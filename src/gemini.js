/**
 * gemini.js  (frontend)
 * API client for AgriSave AI – Surplus Produce Advisor.
 *
 * The Gemini API key is now held ONLY on the backend server.
 * This file calls POST /api/analyze and returns the same result
 * shape the rest of the app already expects.
 *
 * DISCLAIMER: AI recommendations do not constitute food-safety
 * certification. Always exercise professional judgment.
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

/**
 * Send produce data to the AgriSave backend and get AI recommendations.
 *
 * @param {Object} form  – produce form values from App.jsx
 * @param {'en'|'ta'} lang – response language
 * @returns {Promise<{ quality, wasteRisk, recommendedAction, suggestedAllocation, urgency }>}
 * @throws {Error} with a user-friendly message on any failure
 */
export async function analyzeSurplusProduce(form, lang = 'en') {
  const response = await fetch(`${API_URL}/api/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      crop:             form.produceName,
      quantity:         form.quantity,
      harvestAge:       form.daysSinceHarvest,
      condition:        form.condition,
      marketDemand:     form.marketDemand,
      storageCondition: form.storageCondition,
      language:         lang,
    }),
  })

  const data = await response.json()

  if (!response.ok) {
    // Backend returned a structured error — surface it to the UI
    throw new Error(data.error || `Server error (${response.status}). Please try again.`)
  }

  // Validate required fields to catch any unexpected backend shape
  const required = ['quality', 'wasteRisk', 'recommendedAction', 'suggestedAllocation', 'urgency']
  for (const key of required) {
    if (!data[key]) throw new Error(`Unexpected response from server (missing: ${key}).`)
  }

  return {
    quality:             data.quality,
    wasteRisk:           data.wasteRisk,
    recommendedAction:   data.recommendedAction,
    suggestedAllocation: data.suggestedAllocation,
    urgency:             data.urgency,
  }
}
