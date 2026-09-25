/**
 * AgriSave AI – Local Express Backend
 *
 * LOCAL DEVELOPMENT ONLY — hackathon demo
 *
 * Architecture:
 *   Browser → React/Vite (localhost:5173) → Express (localhost:5000) → Gemini API
 *
 * The GEMINI_API_KEY stays on this server and is NEVER exposed to the browser.
 */

import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { GoogleGenAI } from '@google/genai'
import dotenv from 'dotenv'

// ── Load .env from the server/ directory regardless of where node is invoked ──
const __filename = fileURLToPath(import.meta.url)
const __dirname  = path.dirname(__filename)
dotenv.config({ path: path.join(__dirname, '.env') })

const app   = express()
const PORT  = process.env.PORT || 5000
const MODEL = 'gemini-3.5-flash-lite'

// ── JSON body parser ─────────────────────────────────────────
app.use(express.json())

// ── CORS — allow the Vite dev server ────────────────────────
const allowedOrigins = [
  'http://localhost:5173',   // Vite default
  'http://localhost:4173',   // Vite preview
  'http://localhost:3000',   // CRA / alternative
  'http://127.0.0.1:5173',
  'http://127.0.0.1:4173',
  'http://127.0.0.1:3000',
]

app.use(
  cors({
    origin: (origin, callback) => {
      // No origin header = same-origin, curl, or Postman → allow
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true)
      }
      console.warn(`[CORS] Blocked request from: ${origin}`)
      callback(new Error(`CORS: origin ${origin} not allowed`))
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
  })
)

// ── Prompt builder ──────────────────────────────────────────
function buildPrompt(body) {
  const {
    crop,
    quantity,
    daysSinceHarvest,
    condition,
    marketDemand,
    storageCondition,
    language,
  } = body

  const langInstruction =
    language === 'ta'
      ? 'Return the entire analysis in simple Tamil (தமிழ்) that a farmer can easily understand. All field values must be in Tamil.'
      : 'Return the analysis in simple English.'

  return `You are an agricultural decision-support assistant helping smallholder farmers reduce food loss.

A farmer has surplus produce with the following details:
- Produce / Crop: ${crop}
- Quantity: ${quantity} kg
- Days since harvest: ${daysSinceHarvest} days
- Current condition: ${condition}
- Market demand: ${marketDemand}
- Storage condition: ${storageCondition}

Based on these details, provide practical, actionable recommendations.
Consider options such as: sell immediately, redirect to another market, process/preserve, donate to food bank, or compost as a last resort.

IMPORTANT:
- This is a decision-support tool only. Do NOT claim to certify food safety.
- Use "Estimated waste risk" phrasing, not exact scientific probability.
- Recommendations must dynamically depend on all the inputs above.

${langInstruction}

Respond with ONLY valid JSON — no markdown fences, no extra text — using exactly these fields:
{
  "quality": "Brief quality assessment and suitability for use (1-2 sentences)",
  "wasteRisk": "Estimated waste risk level with rough percentage, e.g. High (70%)",
  "recommendedAction": "Primary recommended action with a clear reason (1-2 sentences)",
  "suggestedAllocation": "How to allocate across channels with percentages, e.g. Local market (50%), Food bank (30%), Processing (20%)",
  "urgency": "Time sensitivity, e.g. High – act within 24 hours"
}`
}

// ── Gemini response parser ───────────────────────────────────
function parseGeminiResponse(rawText) {
  // Strip accidental markdown fences
  const clean = rawText
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim()

  let parsed
  try {
    parsed = JSON.parse(clean)
  } catch {
    throw new Error('Gemini returned invalid JSON. Raw: ' + clean.slice(0, 120))
  }

  const required = ['quality', 'wasteRisk', 'recommendedAction', 'suggestedAllocation', 'urgency']
  for (const key of required) {
    if (!parsed[key]) throw new Error(`Missing field in Gemini response: ${key}`)
  }

  return {
    quality:             parsed.quality,
    wasteRisk:           parsed.wasteRisk,
    recommendedAction:   parsed.recommendedAction,
    suggestedAllocation: parsed.suggestedAllocation,
    urgency:             parsed.urgency,
  }
}

// ── Request validator ────────────────────────────────────────
function validateBody(body) {
  const required = ['crop', 'quantity', 'daysSinceHarvest', 'condition', 'marketDemand', 'storageCondition']
  for (const field of required) {
    if (body[field] === undefined || body[field] === null || body[field] === '') {
      throw new Error(`Missing required field: ${field}`)
    }
  }
}

// ════════════════════════════════════════════════════════════
// API ROUTES
// ════════════════════════════════════════════════════════════

// GET /api/health
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

// POST /api/analyze
app.post('/api/analyze', async (req, res) => {
  // Check API key — never log or expose it
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey || apiKey === 'your_api_key_here' || apiKey.trim() === '') {
    console.error('[server] ERROR: GEMINI_API_KEY is not set in server/.env')
    return res.status(500).json({
      error: 'Gemini API key is not configured on the server. Add GEMINI_API_KEY to server/.env'
    })
  }

  // Validate request body
  try {
    validateBody(req.body)
  } catch (validationErr) {
    console.warn('[server] Validation error:', validationErr.message)
    return res.status(400).json({ error: validationErr.message })
  }

  // Call Gemini
  try {
    const ai = new GoogleGenAI({ apiKey })

    const geminiResponse = await ai.models.generateContent({
      model: MODEL,
      contents: buildPrompt(req.body),
      config: {
        temperature: 0.4,
        maxOutputTokens: 600,
      },
    })

    const rawText = geminiResponse.text
    if (!rawText) throw new Error('Empty response from Gemini API.')

    const result = parseGeminiResponse(rawText)
    console.log(`[server] Analysis complete for: ${req.body.crop} (${req.body.quantity}kg)`)
    return res.json(result)

  } catch (err) {
    // Log the real error server-side but send a safe message to the client
    console.error('[server] Gemini API error:', err.message)

    // Detect overload / quota errors specifically
    const msg = err.message || ''
    if (msg.includes('overloaded') || msg.includes('503') || msg.includes('UNAVAILABLE')) {
      return res.status(503).json({
        error: 'The AI model is temporarily overloaded. Please wait 30 seconds and try again.'
      })
    }
    if (msg.includes('NOT_FOUND') || msg.includes('404')) {
      return res.status(502).json({
        error: 'AI model not available. The model "gemini-3.5-flash-lite" may not be accessible with your API key.'
      })
    }

    return res.status(502).json({
      error: 'AI analysis failed. Please try again in a moment.'
    })
  }
})

// ════════════════════════════════════════════════════════════
// Start
// ════════════════════════════════════════════════════════════
app.listen(PORT, () => {
  console.log('')
  console.log('╔══════════════════════════════════════════════╗')
  console.log('║   AgriSave AI – Backend Server               ║')
  console.log('╠══════════════════════════════════════════════╣')
  console.log(`║   Running on  http://localhost:${PORT}          ║`)
  console.log(`║   Health:     GET  /api/health               ║`)
  console.log(`║   Analyze:    POST /api/analyze              ║`)
  console.log('╠══════════════════════════════════════════════╣')
  console.log(`║   Gemini key: ${process.env.GEMINI_API_KEY ? '✓ configured' : '✗ NOT SET — add to server/.env'}`)
  console.log('╚══════════════════════════════════════════════╝')
  console.log('')
})
