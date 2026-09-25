import { useState } from 'react'
import './App.css'
import { analyzeSurplusProduce } from './gemini'
import { getT } from './i18n'

// ── Dashboard stat IDs (labels come from translations) ──
const STAT_IDS = [
  { id: 'total-surplus',      variant: 'green', icon: '🌾' },
  { id: 'potentially-saved',  variant: 'amber', icon: '✅' },
  { id: 'waste-risk',         variant: 'red',   icon: '⚠️' },
  { id: 'recommended-action', variant: 'blue',  icon: '💡' },
]

// ── Result field config (labels come from translations) ──
const RESULT_KEYS = [
  { id: 'quality-assessment',      key: 'quality',            variant: 'quality',  icon: '🔬' },
  { id: 'waste-risk-result',        key: 'wasteRisk',          variant: 'risk',     icon: '⚠️' },
  { id: 'recommended-action-result',key: 'recommendedAction',  variant: 'action',   icon: '💡' },
  { id: 'suggested-allocation-result',key:'suggestedAllocation',variant: 'alloc',   icon: '📦' },
  { id: 'urgency-result',           key: 'urgency',            variant: 'urgency',  icon: '⏱️' },
]

const DEFAULT_FORM = {
  produceName: '',
  quantity: '',
  daysSinceHarvest: '',
  condition: '',
  marketDemand: '',
  storageCondition: '',
}

/**
 * Parse Gemini's suggestedAllocation string into an array of
 * { label, pct, kg } entries for the Smart Surplus Plan.
 */
function parseAllocationBreakdown(allocationText, totalKg) {
  if (!allocationText || !totalKg) return []
  const pattern = /([A-Za-z\u0B80-\u0BFF][^(%\d]*)[\(:]?\s*(\d+)\s*%\)?/g
  const entries = []
  let match
  while ((match = pattern.exec(allocationText)) !== null) {
    const label = match[1].replace(/[:,\-]/g, '').trim()
    const pct   = parseInt(match[2], 10)
    if (label && pct > 0) {
      entries.push({ label, pct, kg: Math.round((totalKg * pct) / 100) })
    }
  }
  if (entries.length === 0) {
    return [{ label: allocationText.slice(0, 40), pct: 100, kg: Math.round(totalKg) }]
  }
  return entries
}

function App() {
  const [lang, setLang] = useState('en')      // 'en' | 'ta'
  const [form, setForm] = useState(DEFAULT_FORM)
  const [analysisResult, setAnalysisResult] = useState(null)
  const [stats, setStats] = useState(null)
  const [hasAnalyzed, setHasAnalyzed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [surplusPlan, setSurplusPlan] = useState(null)

  const t = getT(lang)

  // Derived stat cards from translations + current values
  const displayStats = stats ?? [
    { ...STAT_IDS[0], label: t.statTotalSurplus,       value: '—', sub: t.statTotalSurplusSub },
    { ...STAT_IDS[1], label: t.statPotentiallySaved,   value: '—', sub: t.statAwaitingAnalysis },
    { ...STAT_IDS[2], label: t.statWasteRisk,          value: '—', sub: t.statAwaitingAnalysis },
    { ...STAT_IDS[3], label: t.statRecommendedAction,  value: '—', sub: t.statAwaitingAnalysis },
  ]

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleLangToggle = (newLang) => {
    setLang(newLang)
    // Reset results when language changes so they match the new lang on next run
    setAnalysisResult(null)
    setHasAnalyzed(false)
    setSurplusPlan(null)
    setStats(null)
    setError(null)
  }

  const handleAnalyze = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setAnalysisResult(null)
    setHasAnalyzed(false)
    setSurplusPlan(null)

    try {
      const result = await analyzeSurplusProduce(form, lang)
      setAnalysisResult(result)
      setHasAnalyzed(true)

      const riskMatch = result.wasteRisk.match(/(\d+)\s*%/)
      const riskPct = riskMatch ? `${riskMatch[1]}%` : '—'
      const actionLabel = result.recommendedAction.split(/[–—,.]/)[0].trim().split(' ').slice(0, 2).join(' ')
      const riskNum = riskMatch ? parseInt(riskMatch[1], 10) : 30
      const saveablePct = Math.max(0, 100 - riskNum)
      const saveableKg = Math.round((parseFloat(form.quantity) || 0) * (saveablePct / 100))

      setStats([
        { ...STAT_IDS[0], label: t.statTotalSurplus,      value: `${form.quantity} kg`, sub: form.produceName },
        { ...STAT_IDS[1], label: t.statPotentiallySaved,  value: `${saveableKg} kg`,    sub: `~${saveablePct}% ${t.statSaveableSub}` },
        { ...STAT_IDS[2], label: t.statWasteRisk,         value: riskPct,               sub: result.wasteRisk.split('(')[0].trim() },
        { ...STAT_IDS[3], label: t.statRecommendedAction, value: actionLabel,            sub: t.statPrimaryRec },
      ])

      const qty = parseFloat(form.quantity) || 0
      const breakdown = parseAllocationBreakdown(result.suggestedAllocation, qty)
      setSurplusPlan({ produce: form.produceName, totalKg: qty, urgency: result.urgency, breakdown })
    } catch (err) {
      console.error('Gemini API error:', err)
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const isFormValid =
    !isLoading &&
    form.produceName.trim() &&
    form.quantity &&
    form.daysSinceHarvest &&
    form.condition &&
    form.marketDemand &&
    form.storageCondition

  return (
    <div className="app" lang={lang}>

      {/* ── Header ── */}
      <header className="header" role="banner">
        <div className="header-inner">
          <div className="logo-group">
            <div className="logo-icon" aria-hidden="true">🌿</div>
            <div className="logo-text">
              <h1>AgriSave AI</h1>
              <span>{t.appSubtitle}</span>
            </div>
          </div>

          <div className="header-right">
            {/* Language toggle */}
            <div className="lang-toggle" role="group" aria-label="Language selector">
              <button
                id="lang-en"
                className={`lang-btn${lang === 'en' ? ' active' : ''}`}
                onClick={() => handleLangToggle('en')}
                aria-pressed={lang === 'en'}
              >
                English
              </button>
              <span className="lang-sep" aria-hidden="true">|</span>
              <button
                id="lang-ta"
                className={`lang-btn${lang === 'ta' ? ' active' : ''}`}
                onClick={() => handleLangToggle('ta')}
                aria-pressed={lang === 'ta'}
              >
                தமிழ்
              </button>
            </div>

            <div className="header-badge" aria-label="AI-powered">
              {t.headerBadge}
            </div>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="hero" aria-labelledby="hero-heading">
        <div className="hero-grid-overlay" aria-hidden="true" />
        <div className="hero-inner">
          <div className="hero-eyebrow">
            <span>🌾</span>
            {t.heroEyebrow}
          </div>
          <h2 id="hero-heading">
            {t.heroHeadingPlain}{' '}
            <span className="highlight">{t.heroHeadingHighlight}</span>
          </h2>
          <p className="hero-desc">{t.heroDesc}</p>
          <div className="hero-sdg-badge">
            <span className="sdg-tag">SDG 2</span>
            {t.heroSdgBadge}
          </div>
        </div>
      </section>

      {/* ── Main Dashboard ── */}
      <main className="main" role="main">

        {/* Dashboard stats */}
        <p className="section-label">{t.sectionDashboard}</p>
        <div className="dashboard-stats" role="region" aria-label={t.sectionDashboard}>
          {displayStats.map((s) => (
            <article key={s.id} id={s.id} className={`stat-card ${s.variant}`}>
              <div className="stat-icon" aria-hidden="true">{s.icon}</div>
              <div className="stat-content">
                <div className="stat-label">{s.label}</div>
                <div className="stat-value">{s.value}</div>
                <div className="stat-sub">{s.sub}</div>
              </div>
            </article>
          ))}
        </div>

        {/* Two-column: Form + Results */}
        <div className="content-grid">

          {/* ── Input Form ── */}
          <section className="card" aria-labelledby="form-heading">
            <div className="card-header">
              <div className="card-header-icon" aria-hidden="true">📋</div>
              <div className="card-header-text">
                <h3 id="form-heading">{t.formCardTitle}</h3>
                <p>{t.formCardSub}</p>
              </div>
            </div>
            <div className="card-body">
              <form id="produce-form" className="produce-form" onSubmit={handleAnalyze} noValidate>

                {/* Produce name */}
                <div className="form-group">
                  <label htmlFor="produceName">
                    <span className="label-icon">🌿</span>
                    {t.labelProduceName}
                  </label>
                  <input
                    id="produceName" name="produceName" type="text"
                    className="form-control"
                    placeholder={t.placeholderProduce}
                    value={form.produceName} onChange={handleChange}
                    autoComplete="off" required
                  />
                </div>

                {/* Quantity + Days */}
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="quantity">
                      <span className="label-icon">⚖️</span>
                      {t.labelQuantity}
                    </label>
                    <input
                      id="quantity" name="quantity" type="number"
                      className="form-control"
                      placeholder={t.placeholderQty}
                      min="0" step="0.1"
                      value={form.quantity} onChange={handleChange} required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="daysSinceHarvest">
                      <span className="label-icon">📅</span>
                      {t.labelDays}
                    </label>
                    <input
                      id="daysSinceHarvest" name="daysSinceHarvest" type="number"
                      className="form-control"
                      placeholder={t.placeholderDays}
                      min="0"
                      value={form.daysSinceHarvest} onChange={handleChange} required
                    />
                  </div>
                </div>

                {/* Condition */}
                <div className="form-group">
                  <label htmlFor="condition">
                    <span className="label-icon">🔍</span>
                    {t.labelCondition}
                  </label>
                  <select id="condition" name="condition" className="form-control"
                    value={form.condition} onChange={handleChange} required>
                    <option value="" disabled>{t.conditionDefault}</option>
                    <option value="fresh">{t.conditionFresh}</option>
                    <option value="good">{t.conditionGood}</option>
                    <option value="slightly-damaged">{t.conditionSlightlyDamaged}</option>
                    <option value="at-risk">{t.conditionAtRisk}</option>
                  </select>
                </div>

                {/* Market demand + Storage */}
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="marketDemand">
                      <span className="label-icon">📈</span>
                      {t.labelMarketDemand}
                    </label>
                    <select id="marketDemand" name="marketDemand" className="form-control"
                      value={form.marketDemand} onChange={handleChange} required>
                      <option value="" disabled>{t.demandDefault}</option>
                      <option value="high">{t.demandHigh}</option>
                      <option value="medium">{t.demandMedium}</option>
                      <option value="low">{t.demandLow}</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="storageCondition">
                      <span className="label-icon">🏪</span>
                      {t.labelStorage}
                    </label>
                    <select id="storageCondition" name="storageCondition" className="form-control"
                      value={form.storageCondition} onChange={handleChange} required>
                      <option value="" disabled>{t.storageDefault}</option>
                      <option value="cold-storage">{t.storageCold}</option>
                      <option value="normal">{t.storageNormal}</option>
                      <option value="poor">{t.storagePoor}</option>
                    </select>
                  </div>
                </div>

                {/* Submit */}
                <button
                  id="btn-analyze" type="submit"
                  className="btn-analyze"
                  disabled={!isFormValid} aria-disabled={!isFormValid}
                >
                  {isLoading ? (
                    <>
                      <span className="btn-spinner" aria-hidden="true" />
                      {t.btnAnalyzing}
                    </>
                  ) : (
                    <>
                      <span className="btn-icon">🤖</span>
                      {t.btnAnalyze}
                    </>
                  )}
                </button>
              </form>
            </div>
          </section>

          {/* ── Results Panel ── */}
          <section className="card results-panel" aria-labelledby="results-heading">
            <div className="card-header">
              <div className="card-header-icon" aria-hidden="true">📊</div>
              <div className="card-header-text">
                <h3 id="results-heading">{t.resultsPanelTitle}</h3>
                <p>{t.resultsPanelSub}</p>
              </div>
            </div>

            {/* Error banner */}
            {error && (
              <div className="error-banner" role="alert">
                <span className="error-icon" aria-hidden="true">⚠️</span>
                <div>
                  <strong>{t.errorTitle}</strong>
                  <p>{error}</p>
                </div>
              </div>
            )}

            {isLoading ? (
              <div className="results-placeholder" role="status" aria-live="polite" aria-busy="true">
                <div className="loading-spinner" aria-hidden="true" />
                <h4>{t.loadingTitle}</h4>
                <p>{t.loadingDesc}<br />{t.loadingDescSub}</p>
              </div>
            ) : !hasAnalyzed ? (
              <div className="results-placeholder" role="status" aria-live="polite">
                <div className="placeholder-icon" aria-hidden="true">🌱</div>
                <h4>{t.readyTitle}</h4>
                <p>
                  {t.readyDesc1}{' '}
                  <strong>"{t.btnAnalyze}"</strong>{' '}
                  {t.readyDesc2}
                </p>
              </div>
            ) : (
              <div className="result-items" role="region" aria-label={t.resultsPanelTitle} aria-live="polite">
                {RESULT_KEYS.map((field) => {
                  const labelKey = {
                    quality: 'fieldQuality', wasteRisk: 'fieldWasteRisk',
                    recommendedAction: 'fieldAction', suggestedAllocation: 'fieldAllocation',
                    urgency: 'fieldUrgency',
                  }[field.key]
                  return (
                    <div key={field.id} id={field.id} className={`result-item ${field.variant}`}>
                      <div className="result-item-icon" aria-hidden="true">{field.icon}</div>
                      <div className="result-item-body">
                        <div className="result-item-label">{t[labelKey]}</div>
                        <div className="result-item-value">
                          {analysisResult?.[field.key] ?? t.fieldAwaitingValue}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* ── Inline SDG 2 Impact (shows after analysis) ── */}
            {surplusPlan && (
              <div id="sdg2-impact-inline" className="sdg2-inline" role="region" aria-label="SDG 2 Impact">

                <div className="sdg2-inline-header">
                  <span aria-hidden="true">🌍</span>
                  SDG 2 Impact
                </div>

                {/* Allocation kg breakdown */}
                <div className="sdg2-alloc-list">
                  {surplusPlan.breakdown.map((row, i) => (
                    <div key={i} className="sdg2-alloc-row">
                      <span className="sdg2-alloc-dot" style={{ '--seg-idx': i }} aria-hidden="true" />
                      <span className="sdg2-alloc-label">{row.label}</span>
                      <span className="sdg2-alloc-bar-wrap">
                        <span
                          className="sdg2-alloc-bar"
                          style={{ width: `${row.pct}%`, '--seg-idx': i }}
                          aria-hidden="true"
                        />
                      </span>
                      <span className="sdg2-alloc-kg">{row.kg} kg</span>
                    </div>
                  ))}
                </div>

                {/* Potentially Redirected hero number */}
                <div className="sdg2-redirected-card">
                  <div className="sdg2-redirected-label">
                    ♻️ Potentially Redirected from Waste
                  </div>
                  <div className="sdg2-redirected-value">{surplusPlan.totalKg} kg</div>
                  <p className="sdg2-redirected-desc">
                    AgriSave AI helps farmers choose alternative pathways for surplus
                    produce before it becomes avoidable food loss.
                  </p>
                </div>

                {/* Disclaimer */}
                <p className="sdg2-disclaimer" role="note">
                  ⚠️ AI decision support only — verify recommendations with appropriate
                  agricultural and food-safety guidance.
                </p>

              </div>
            )}

          </section>

        </div>

        {/* ── Smart Surplus Impact ── */}
        {surplusPlan && (
          <section id="smart-surplus-impact" aria-labelledby="impact-heading" className="impact-section">

            <p className="section-label" style={{ marginTop: 0 }}>{t.sectionImpact}</p>

            <div className="impact-grid">

              {/* ── Allocation Plan card ── */}
              <div className="card impact-card">
                <div className="card-header">
                  <div className="card-header-icon" aria-hidden="true">📋</div>
                  <div className="card-header-text">
                    <h3 id="impact-heading">{t.planCardTitle}</h3>
                    <p>{t.planCardSub} · {surplusPlan.produce}</p>
                  </div>
                </div>
                <div className="card-body">
                  <table className="plan-table" role="table" aria-label={t.planCardTitle}>
                    <thead>
                      <tr>
                        <th scope="col">{t.tableChannel}</th>
                        <th scope="col" style={{ textAlign: 'right' }}>{t.tableShare}</th>
                        <th scope="col" style={{ textAlign: 'right' }}>{t.tableQuantity}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {surplusPlan.breakdown.map((row, i) => (
                        <tr key={i}>
                          <td>
                            <span className="plan-row-dot" style={{ '--seg-idx': i }} aria-hidden="true" />
                            {row.label}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <span className="badge badge-green">{row.pct}%</span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <strong className="plan-kg">{row.kg} kg</strong>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="plan-total-row">
                        <td><strong>{t.tableTotal}</strong></td>
                        <td style={{ textAlign: 'right' }}><strong>100%</strong></td>
                        <td style={{ textAlign: 'right' }}>
                          <strong className="plan-kg plan-total-kg">{surplusPlan.totalKg} kg</strong>
                        </td>
                      </tr>
                    </tfoot>
                  </table>

                  {/* Progress bar */}
                  <div className="plan-bar-wrap" role="img" aria-label={t.tableQuantity}>
                    {surplusPlan.breakdown.map((row, i) => (
                      <div key={i} className="plan-bar-seg"
                        style={{ width: `${row.pct}%`, '--seg-idx': i }}
                        title={`${row.label}: ${row.pct}%`} />
                    ))}
                  </div>
                  <div className="plan-bar-legend">
                    {surplusPlan.breakdown.map((row, i) => (
                      <div key={i} className="plan-legend-item">
                        <span className="plan-legend-dot" style={{ '--seg-idx': i }} aria-hidden="true" />
                        {row.label}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── SDG 2 Impact card ── */}
              <div className="card impact-card sdg-impact-card">
                <div className="sdg-impact-glow" aria-hidden="true" />
                <div className="card-header">
                  <div className="card-header-icon sdg-icon" aria-hidden="true">🌍</div>
                  <div className="card-header-text">
                    <h3>{t.sdgCardTitle}</h3>
                    <p>{t.sdgCardSub}</p>
                  </div>
                </div>
                <div className="card-body">
                  <p className="sdg-tagline">{t.sdgTagline}</p>

                  <div className="sdg-stats">
                    <div className="sdg-stat">
                      <span className="sdg-stat-icon" aria-hidden="true">🌾</span>
                      <div>
                        <div className="sdg-stat-label">{t.sdgStatTotalLabel}</div>
                        <div className="sdg-stat-value">{surplusPlan.totalKg} kg</div>
                        <div className="sdg-stat-sub">{surplusPlan.produce}</div>
                      </div>
                    </div>
                    <div className="sdg-stat">
                      <span className="sdg-stat-icon" aria-hidden="true">♻️</span>
                      <div>
                        <div className="sdg-stat-label">{t.sdgStatRedirectedLabel}</div>
                        <div className="sdg-stat-value">{surplusPlan.totalKg} kg</div>
                        <div className="sdg-stat-sub">{t.sdgStatRedirectedSub}</div>
                      </div>
                    </div>
                    <div className="sdg-stat">
                      <span className="sdg-stat-icon" aria-hidden="true">⏱️</span>
                      <div>
                        <div className="sdg-stat-label">{t.sdgStatUrgencyLabel}</div>
                        <div className="sdg-stat-value sdg-urgency">
                          {surplusPlan.urgency.split(/[–—]/)[0].trim()}
                        </div>
                        <div className="sdg-stat-sub">{surplusPlan.urgency}</div>
                      </div>
                    </div>
                  </div>

                  <div className="sdg-disclaimer" role="note">
                    <span aria-hidden="true">⚠️</span>
                    {t.sdgDisclaimer}
                  </div>
                </div>
              </div>

            </div>
          </section>
        )}

      </main>

      {/* ── Footer ── */}
      <footer className="footer" role="contentinfo">
        <div className="footer-inner">
          <p>{t.footerCopy}</p>
          <div className="footer-sdg">
            <span className="sdg-tag">SDG 2</span>
            {t.footerTagline}
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
