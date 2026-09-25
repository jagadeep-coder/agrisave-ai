// api/analyze.js  –  Vercel serverless function
// POST /api/analyze
//
// AgriSave AI – Surplus Produce Advisor
// Calls the Gemini API server-side. GEMINI_API_KEY never reaches the browser.

import { GoogleGenAI } from '@google/genai'

const MODEL = 'gemini-3.5-flash-lite'

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
- Use "Estimated waste risk" phrasing — not exact scientific probability.
- Recommendations must dynamically depend on all provided inputs.

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

// ── Response parser ─────────────────────────────────────────
function parseGeminiResponse(rawText) {
  const clean = rawText
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim()

  let parsed
  try {
    parsed = JSON.parse(clean)
  } catch {
    throw new Error('Gemini returned invalid JSON.')
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

// ── Request validator ───────────────────────────────────────
function validateBody(body) {
  const required = ['crop', 'quantity', 'daysSinceHarvest', 'condition', 'marketDemand', 'storageCondition']
  for (const field of required) {
    if (body[field] === undefined || body[field] === null || String(body[field]).trim() === '') {
      throw new Error(`Missing required field: ${field}`)
    }
  }
}

// ── Vercel handler ──────────────────────────────────────────
export default async function handler(req, res) {
  // Only accept POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' })
  }

  // Check API key — NEVER log or expose its value
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey || apiKey.trim() === '' || apiKey === 'your_api_key_here') {
    console.error('[api/analyze] GEMINI_API_KEY is not configured in Vercel env vars')
    return res.status(500).json({
      error: 'AI service configuration error. Contact the administrator.'
    })
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
    return res.status(200).json(result)

  } catch (err) {
    // Log full error on the server — never expose API key or internals
    console.error('[api/analyze] Gemini error:', err.message)

    const msg = err.message || ''
    if (msg.includes('overloaded') || msg.includes('503') || msg.includes('UNAVAILABLE')) {
      return res.status(503).json({
        error: 'AI service temporarily overloaded. Please wait 30 seconds and try again.'
      })
    }
    if (msg.includes('NOT_FOUND') || msg.includes('404')) {
      return res.status(502).json({
        error: 'AI model not available. Check that your API key has access to gemini-3.5-flash-lite.'
      })
    }
    if (msg.includes('PERMISSION_DENIED') || msg.includes('403')) {
      return res.status(502).json({
        error: 'AI API key is invalid or lacks permission. Check GEMINI_API_KEY in Vercel settings.'
      })
    }

    return res.status(502).json({
      error: 'AI analysis failed. Please try again in a moment.'
    })
  }
}
