export const SCAM_CATEGORIES = [
  { id: 'phishing', labelKey: 'report.cat_phishing' },
  { id: 'parcel', labelKey: 'report.cat_parcel' },
  { id: 'job', labelKey: 'report.cat_job' },
  { id: 'emergency', labelKey: 'report.cat_emergency' },
  { id: 'marketplace', labelKey: 'report.cat_marketplace' },
  { id: 'finance', labelKey: 'report.cat_finance' },
];

/**
 * Helper to get translated or formatted label for a given scam category
 * @param {string} categoryId 
 * @param {function} t - Translation function from LanguageContext
 * @returns {string} Translated category string or fallback
 */
export const getCategoryLabel = (categoryId, t) => {
  if (!categoryId) return '';
  const key = String(categoryId).toLowerCase();
  const found = SCAM_CATEGORIES.find(c => c.id === key);
  if (found && typeof t === 'function') {
    const translated = t(found.labelKey);
    if (translated && translated !== found.labelKey) {
      return translated;
    }
  }
  return key.charAt(0).toUpperCase() + key.slice(1);
};
