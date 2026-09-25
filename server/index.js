/**
 * AgriSave AI – Express Backend
 * Proxies requests from the React frontend to the Gemini API.
 * The GEMINI_API_KEY never leaves this server.
 */

import express from 'express'
import cors from 'cors'
import { GoogleGenAI } from '@google/genai'
import 'dotenv/config'

const app = express()
const PORT = process.env.PORT || 5000
const MODEL = 'gemini-3.5-flash-lite'

// ── Middleware ──────────────────────────────────────────────
app.use(express.json())

// Allow the Vite dev server (any localhost port) during development.
// In production, restrict this to your actual frontend origin.
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:4173',
  // ▼ Add your deployed Vercel frontend URL here before deploying
  'https://your-app-name.vercel.app',
]

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. curl, Postman) or allowed origins
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        callback(new Error(`CORS: origin ${origin} not allowed`))
      }
    },
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
  })
)

// ── Prompt builder (same logic as the old frontend gemini.js) ──
function buildPrompt(body) {
  const { crop, quantity, harvestAge, condition, marketDemand, storageCondition, language } = body

  const langInstruction =
    language === 'ta'
      ? 'Return the entire analysis in simple Tamil (தமிழ்) that a farmer can easily understand. All field values must be in Tamil.'
      : 'Return the analysis in simple English.'

  return `You are an agricultural decision-support assistant helping smallholder farmers reduce food loss.

A farmer has surplus produce with the following details:
- Produce / Crop: ${crop}
- Quantity: ${quantity} kg
- Days since harvest: ${harvestAge} days
- Current condition: ${condition}
- Market demand: ${marketDemand}
- Storage condition: ${storageCondition}

Based on these details, provide practical, actionable recommendations.
Consider options such as: sell immediately, redirect to another market, process/preserve, donate to food bank, or compost as a last resort.

IMPORTANT: This is a decision-support tool only. Do NOT claim to certify food safety.

${langInstruction}

Respond with ONLY valid JSON — no markdown fences, no extra text — using exactly these fields:
{
  "quality": "Brief quality assessment and suitability for use (1-2 sentences)",
  "wasteRisk": "Estimated waste risk as a percentage and risk level, e.g. High (70%)",
  "recommendedAction": "Primary recommended action with a clear reason (1-2 sentences)",
  "suggestedAllocation": "How to allocate the produce across channels, e.g. Local market (50%), Food bank (30%), Processing (20%)",
  "urgency": "Time sensitivity, e.g. High – act within 24 hours"
}`
}

// ── Response parser (same logic as the old frontend gemini.js) ──
function parseGeminiResponse(rawText) {
  const clean = rawText
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim()

  const parsed = JSON.parse(clean)

  const required = ['quality', 'wasteRisk', 'recommendedAction', 'suggestedAllocation', 'urgency']
  for (const key of required) {
    if (!parsed[key]) throw new Error(`Missing field in Gemini response: ${key}`)
  }

  return {
    quality: parsed.quality,
    wasteRisk: parsed.wasteRisk,
    recommendedAction: parsed.recommendedAction,
    suggestedAllocation: parsed.suggestedAllocation,
    urgency: parsed.urgency,
  }
}

// ── Validate incoming request body ──
function validateBody(body) {
  const required = ['crop', 'quantity', 'harvestAge', 'condition', 'marketDemand', 'storageCondition']
  for (const field of required) {
    if (body[field] === undefined || body[field] === null || body[field] === '') {
      throw new Error(`Missing required field: ${field}`)
    }
  }
}

// ── GET /api/health ─────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

// ── POST /api/analyze ───────────────────────────────────────
app.post('/api/analyze', async (req, res) => {
  // Validate API key (never expose it in responses)
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey || apiKey === 'your_api_key_here') {
    console.error('[server] GEMINI_API_KEY is not configured.')
    return res.status(500).json({ error: 'Server configuration error. Contact the administrator.' })
  }

  // Validate request body
  try {
    validateBody(req.body)
  } catch (validationErr) {
    return res.status(400).json({ error: validationErr.message })
  }

  // Call Gemini
  try {
    const ai = new GoogleGenAI({ apiKey })

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: buildPrompt(req.body),
      config: {
        temperature: 0.4,
        maxOutputTokens: 512,
      },
    })

    const rawText = response.text
    if (!rawText) throw new Error('Empty response from Gemini API.')

    const result = parseGeminiResponse(rawText)
    return res.json(result)
  } catch (err) {
    // Log full error server-side, never send it to the client
    console.error('[server] Gemini error:', err.message)
    return res.status(502).json({ error: 'AI analysis failed. Please try again.' })
  }
})

// ── 404 fallback ────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found.' })
})

// ── Start ───────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`AgriSave AI server running on http://localhost:${PORT}`)
  console.log(`  Health check: GET  http://localhost:${PORT}/api/health`)
  console.log(`  Analyze:      POST http://localhost:${PORT}/api/analyze`)
})
