/**
 * gemini.js  (frontend API client)
 *
 * Uses a relative URL /api/analyze which works in:
 *   - Vercel production:  same-origin serverless function
 *   - Local dev (vite):   Vite proxy → Express backend on :5000
 *
 * The Gemini API key NEVER lives in this file or in any VITE_ variable.
 * It stays exclusively in the server environment (Vercel env vars / server/.env).
 */

/**
 * Send produce form data to the backend and receive AI recommendations.
 *
 * @param {Object} form  – produce form values from App.jsx
 * @param {'en'|'ta'} lang – response language
 * @returns {Promise<{ quality, wasteRisk, recommendedAction, suggestedAllocation, urgency }>}
 * @throws {Error} with a clear, user-facing message on any failure
 */
export async function analyzeSurplusProduce(form, lang = 'en') {
  let response

  try {
    response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        crop:             form.produceName,
        quantity:         form.quantity,
        daysSinceHarvest: form.daysSinceHarvest,
        condition:        form.condition,
        marketDemand:     form.marketDemand,
        storageCondition: form.storageCondition,
        language:         lang,
      }),
    })
  } catch (networkErr) {
    // fetch() itself threw — server unreachable
    throw new Error(
      'Cannot connect to the AI server. ' +
      'For local dev: make sure the backend is running on port 5000 (cd server && npm start).'
    )
  }

  let data
  try {
    data = await response.json()
  } catch {
    throw new Error(`Server returned an unexpected response (HTTP ${response.status}).`)
  }

  if (!response.ok) {
    throw new Error(data?.error || `Server error (${response.status}). Please try again.`)
  }

  const required = ['quality', 'wasteRisk', 'recommendedAction', 'suggestedAllocation', 'urgency']
  for (const key of required) {
    if (!data[key]) {
      throw new Error(`Incomplete response from AI server (missing: ${key}). Please try again.`)
    }
  }

  return {
    quality:             data.quality,
    wasteRisk:           data.wasteRisk,
    recommendedAction:   data.recommendedAction,
    suggestedAllocation: data.suggestedAllocation,
    urgency:             data.urgency,
  }
}
