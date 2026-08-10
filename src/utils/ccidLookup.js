/**
 * External Data Source Lookups — Mock CCID Database & Numverify API
 * 
 * Provides async functions to cross-reference detected phone numbers and
 * bank accounts against a mock CCID/SemakMule police database, and to
 * validate phone numbers via the Numverify API.
 */

// --- Mock CCID Database Lookup (Cached) ---
let ccidCache = null;

export async function fetchCCIDDatabase() {
  if (ccidCache) return ccidCache;
  try {
    const res = await fetch('/mock_ccid.json');
    if (!res.ok) throw new Error(`CCID fetch failed: HTTP ${res.status}`);
    ccidCache = await res.json();
    return ccidCache;
  } catch (err) {
    console.warn('[CCID] Failed to load mock database:', err.message);
    return { reportedPhones: [], reportedBankAccounts: [] };
  }
}

export function lookupPhone(ccidData, normalizedPhone) {
  const cleanInput = normalizedPhone.replace(/\D/g, '');
  return ccidData.reportedPhones.find(entry => {
    const cleanEntry = entry.number.replace(/\D/g, '');
    // Match if either is a suffix of the other (handles +60 vs 0 prefix)
    return cleanInput === cleanEntry || 
           cleanInput.endsWith(cleanEntry.slice(-9)) && cleanEntry.slice(-9).length >= 9 ||
           cleanEntry.endsWith(cleanInput.slice(-9)) && cleanInput.slice(-9).length >= 9;
  }) || null;
}

export function lookupBankAccount(ccidData, normalizedAccount) {
  return ccidData.reportedBankAccounts.find(entry =>
    entry.account === normalizedAccount
  ) || null;
}

// --- Numverify API Integration ---
const NUMVERIFY_API_KEY = import.meta.env.VITE_NUMVERIFY_API_KEY || '';

export async function validatePhoneNumverify(phoneNumber) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    
    const cleanNumber = phoneNumber.replace(/[\s-]/g, '');
    const res = await fetch(
      `http://apilayer.net/api/validate?access_key=${NUMVERIFY_API_KEY}&number=${encodeURIComponent(cleanNumber)}&country_code=MY&format=1`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);
    
    if (!res.ok) throw new Error(`Numverify HTTP ${res.status}`);
    const data = await res.json();
    
    return {
      valid: data.valid,
      lineType: data.line_type || 'unknown',
      carrier: data.carrier || 'Unknown',
      location: data.location || '',
      country: data.country_name || 'Malaysia',
      internationalFormat: data.international_format || cleanNumber
    };
  } catch (err) {
    console.warn('[Numverify] API check failed:', err.message);
    return { valid: null, lineType: 'unknown', carrier: 'Unknown', error: err.message };
  }
}
