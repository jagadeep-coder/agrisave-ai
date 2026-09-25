/**
 * i18n.js – AgriSave AI bilingual translations
 * Supported languages: 'en' (English) | 'ta' (Tamil)
 */

export const translations = {
  en: {
    // Header
    appSubtitle: 'Surplus Produce Advisor',
    headerBadge: 'AI Powered',

    // Hero
    heroEyebrow: 'SDG 2 — Zero Hunger',
    heroHeadingPlain: 'Turn Surplus Produce Into',
    heroHeadingHighlight: 'Smart Decisions',
    heroDesc: 'AI-powered advisor that helps farmers evaluate surplus crops, assess waste risk, and identify the best allocation strategy — reducing avoidable food loss before it happens.',
    heroSdgBadge: 'Supporting Zero Hunger through smarter food systems',

    // Dashboard
    sectionDashboard: 'Live Dashboard',
    statTotalSurplus: 'Total Surplus',
    statTotalSurplusSub: 'Enter produce to begin',
    statPotentiallySaved: 'Potentially Saved',
    statAwaitingAnalysis: 'Awaiting analysis',
    statWasteRisk: 'Waste Risk',
    statRecommendedAction: 'Recommended Action',
    statSaveableSub: 'saveable',
    statPrimaryRec: 'Primary recommendation',

    // Form
    formCardTitle: 'Produce Details',
    formCardSub: 'Enter your surplus produce information',
    labelProduceName: 'Produce / Crop Name',
    placeholderProduce: 'e.g. Tomatoes, Maize, Mangoes…',
    labelQuantity: 'Quantity (kg)',
    placeholderQty: 'e.g. 500',
    labelDays: 'Days Since Harvest',
    placeholderDays: 'e.g. 3',
    labelCondition: 'Produce Condition',
    conditionDefault: 'Select condition…',
    conditionFresh: '🟢 Fresh',
    conditionGood: '🟡 Good',
    conditionSlightlyDamaged: '🟠 Slightly Damaged',
    conditionAtRisk: '🔴 At Risk',
    labelMarketDemand: 'Market Demand',
    demandDefault: 'Select demand…',
    demandHigh: '📈 High',
    demandMedium: '➡️ Medium',
    demandLow: '📉 Low',
    labelStorage: 'Storage Condition',
    storageDefault: 'Select storage…',
    storageCold: '❄️ Cold Storage',
    storageNormal: '🌡️ Normal',
    storagePoor: '🌶️ Poor',
    btnAnalyze: 'Analyze Surplus',
    btnAnalyzing: 'Analyzing…',

    // Results panel
    resultsPanelTitle: 'AI Analysis Results',
    resultsPanelSub: 'Powered by Gemini — smart surplus insights',
    errorTitle: 'Analysis failed',
    loadingTitle: 'Analyzing your produce…',
    loadingDesc: 'Gemini AI is evaluating your surplus data.',
    loadingDescSub: 'This takes a few seconds.',
    readyTitle: 'Ready to Analyze',
    readyDesc1: 'Fill in your produce details and click',
    readyDesc2: 'to get AI-powered recommendations.',

    // Result field labels
    fieldQuality: 'Quality Assessment',
    fieldWasteRisk: 'Waste Risk',
    fieldAction: 'Recommended Action',
    fieldAllocation: 'Suggested Allocation',
    fieldUrgency: 'Urgency',
    fieldAwaitingValue: 'Awaiting analysis…',

    // Smart Surplus Impact
    sectionImpact: 'Smart Surplus Impact',
    planCardTitle: 'Smart Surplus Plan',
    planCardSub: 'Calculated from AI allocation',
    tableChannel: 'Channel',
    tableShare: 'Share',
    tableQuantity: 'Quantity',
    tableTotal: 'Total',

    sdgCardTitle: 'SDG 2 Impact Estimate',
    sdgCardSub: 'Zero Hunger · Decision-support only',
    sdgTagline: 'Smart redirection of surplus produce can help reduce avoidable food loss.',
    sdgStatTotalLabel: 'Total Surplus',
    sdgStatRedirectedLabel: 'Potentially Redirected',
    sdgStatRedirectedSub: 'If plan is followed',
    sdgStatUrgencyLabel: 'Immediate Action',
    sdgDisclaimer: 'AI decision support only — verify recommendations with appropriate agricultural and food-safety guidance.',

    // Footer
    footerCopy: '© 2024 AgriSave AI — Built for SDG 2 Hackathon',
    footerTagline: 'Zero Hunger · Reducing Agricultural Food Loss',
  },

  ta: {
    // Header
    appSubtitle: 'மிகை விளைச்சல் ஆலோசகர்',
    headerBadge: 'AI இயக்கம்',

    // Hero
    heroEyebrow: 'SDG 2 — பசி இல்லாமை',
    heroHeadingPlain: 'மிகை விளைச்சலை மாற்றுங்கள்',
    heroHeadingHighlight: 'சரியான முடிவுகளாக',
    heroDesc: 'விவசாயிகளுக்கு மிகை பயிர்களை மதிப்பிட, கழிவு அபாயத்தை அளவிட மற்றும் சிறந்த விநியோக திட்டத்தை கண்டறிய உதவும் AI ஆலோசகர் — தவிர்க்கக்கூடிய உணவு இழப்பை குறைக்கிறது.',
    heroSdgBadge: 'சிறந்த உணவு அமைப்புகள் மூலம் பசி இல்லாமையை ஆதரிக்கிறது',

    // Dashboard
    sectionDashboard: 'நேரடி டாஷ்போர்டு',
    statTotalSurplus: 'மொத்த மிகை',
    statTotalSurplusSub: 'தொடங்க விவரங்களை உள்ளிடவும்',
    statPotentiallySaved: 'சேமிக்கப்படலாம்',
    statAwaitingAnalysis: 'பகுப்பாய்வு காத்திருக்கிறது',
    statWasteRisk: 'கழிவு அபாயம்',
    statRecommendedAction: 'பரிந்துரைக்கப்பட்ட நடவடிக்கை',
    statSaveableSub: 'சேமிக்கலாம்',
    statPrimaryRec: 'முதன்மை பரிந்துரை',

    // Form
    formCardTitle: 'விளைச்சல் விவரங்கள்',
    formCardSub: 'உங்கள் மிகை விளைச்சல் தகவல்களை உள்ளிடவும்',
    labelProduceName: 'விளைச்சல் / பயிர் பெயர்',
    placeholderProduce: 'எ.கா. தக்காளி, மக்காச்சோளம், மாம்பழம்…',
    labelQuantity: 'அளவு (கிலோ)',
    placeholderQty: 'எ.கா. 500',
    labelDays: 'அறுவடை செய்த நாட்கள்',
    placeholderDays: 'எ.கா. 3',
    labelCondition: 'விளைச்சல் நிலை',
    conditionDefault: 'நிலையை தேர்ந்தெடுக்கவும்…',
    conditionFresh: '🟢 புதிதானது',
    conditionGood: '🟡 நல்லது',
    conditionSlightlyDamaged: '🟠 சிறிது சேதம்',
    conditionAtRisk: '🔴 அபாயத்தில்',
    labelMarketDemand: 'சந்தை தேவை',
    demandDefault: 'தேவையை தேர்ந்தெடுக்கவும்…',
    demandHigh: '📈 அதிகம்',
    demandMedium: '➡️ நடுத்தரம்',
    demandLow: '📉 குறைவு',
    labelStorage: 'சேமிப்பு நிலை',
    storageDefault: 'சேமிப்பை தேர்ந்தெடுக்கவும்…',
    storageCold: '❄️ குளிர்சாதன சேமிப்பு',
    storageNormal: '🌡️ சாதாரண',
    storagePoor: '🌶️ மோசமான',
    btnAnalyze: 'மிகை விளைச்சலை பகுப்பாய்வு செய்',
    btnAnalyzing: 'பகுப்பாய்வு செய்கிறது…',

    // Results panel
    resultsPanelTitle: 'AI பகுப்பாய்வு முடிவுகள்',
    resultsPanelSub: 'Gemini இயக்கம் — சரியான ஆலோசனை',
    errorTitle: 'பகுப்பாய்வு தோல்வியடைந்தது',
    loadingTitle: 'உங்கள் விளைச்சலை பகுப்பாய்வு செய்கிறது…',
    loadingDesc: 'Gemini AI உங்கள் மிகை தரவை மதிப்பிடுகிறது.',
    loadingDescSub: 'சில நொடிகள் ஆகலாம்.',
    readyTitle: 'பகுப்பாய்வுக்கு தயார்',
    readyDesc1: 'விவரங்களை நிரப்பி கிளிக் செய்யவும்',
    readyDesc2: 'AI பரிந்துரைகளைப் பெற.',

    // Result field labels
    fieldQuality: 'தரம் மதிப்பீடு',
    fieldWasteRisk: 'கழிவு அபாயம்',
    fieldAction: 'பரிந்துரைக்கப்பட்ட நடவடிக்கை',
    fieldAllocation: 'பரிந்துரைக்கப்பட்ட விநியோகம்',
    fieldUrgency: 'அவசரம்',
    fieldAwaitingValue: 'பகுப்பாய்வு காத்திருக்கிறது…',

    // Smart Surplus Impact
    sectionImpact: 'சரியான மிகை தாக்கம்',
    planCardTitle: 'சரியான மிகை திட்டம்',
    planCardSub: 'AI விநியோகத்திலிருந்து கணக்கிடப்பட்டது',
    tableChannel: 'சேனல்',
    tableShare: 'பங்கு',
    tableQuantity: 'அளவு',
    tableTotal: 'மொத்தம்',

    sdgCardTitle: 'SDG 2 தாக்க மதிப்பீடு',
    sdgCardSub: 'பசி இல்லாமை · முடிவு ஆதரவு மட்டுமே',
    sdgTagline: 'மிகை விளைச்சலை சரியாக திசைதிருப்புவது தவிர்க்கக்கூடிய உணவு இழப்பை குறைக்க உதவலாம்.',
    sdgStatTotalLabel: 'மொத்த மிகை',
    sdgStatRedirectedLabel: 'திசைதிருப்பப்படலாம்',
    sdgStatRedirectedSub: 'திட்டம் பின்பற்றப்பட்டால்',
    sdgStatUrgencyLabel: 'உடனடி நடவடிக்கை',
    sdgDisclaimer: 'AI முடிவு ஆதரவு மட்டுமே — பரிந்துரைகளை தகுந்த விவசாய மற்றும் உணவு பாதுகாப்பு வழிகாட்டுதலுடன் சரிபார்க்கவும்.',

    // Footer
    footerCopy: '© 2024 AgriSave AI — SDG 2 ஹேக்கதான் கட்டமைக்கப்பட்டது',
    footerTagline: 'பசி இல்லாமை · விவசாய உணவு இழப்பை குறைக்கிறது',
  },
}

/**
 * Get the translation object for the given language code.
 * Falls back to English if the language is not found.
 * @param {'en'|'ta'} lang
 * @returns {Object}
 */
export function getT(lang) {
  return translations[lang] ?? translations.en
}
