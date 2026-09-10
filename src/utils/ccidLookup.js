/**
 * External Data Source Lookups — Mock CCID Database & Numverify API
 * 
 * Provides async functions to cross-reference detected phone numbers and
 * bank accounts against a mock CCID/SemakMule police database, and to
 * validate phone numbers via the Numverify API.
 */

// --- Mock CCID Database Lookup (Cached) ---
let ccidCache = null;

const DEFAULT_CCID_DATA = {
  reportedPhones: [
    { number: "+60111234567", reportCount: 12, category: "parcel" },
    { number: "+60139876543", reportCount: 8, category: "job_scam" },
    { number: "+60162345678", reportCount: 23, category: "investment" },
    { number: "+60173456789", reportCount: 5, category: "love_scam" },
    { number: "+60184567890", reportCount: 15, category: "macau_scam" },
    { number: "+60191122334", reportCount: 6, category: "phishing" },
    { number: "+60123338888", reportCount: 31, category: "investment" },
    { number: "+60145556677", reportCount: 9, category: "government_impersonation" }
  ],
  reportedBankAccounts: [
    { account: "1234567890", bank: "Maybank", reportCount: 18, category: "parcel" },
    { account: "9876543210", bank: "CIMB", reportCount: 7, category: "marketplace" },
    { account: "5551234567", bank: "Public Bank", reportCount: 11, category: "investment" },
    { account: "7778889990", bank: "RHB", reportCount: 3, category: "job_scam" },
    { account: "3216549870", bank: "Hong Leong", reportCount: 14, category: "love_scam" },
    { account: "8005551234", bank: "AmBank", reportCount: 20, category: "macau_scam" }
  ]
};

export async function fetchCCIDDatabase() {
  if (ccidCache) return ccidCache;
  try {
    const res = await fetch('/mock_ccid.json');
    if (!res.ok) throw new Error(`CCID fetch failed: HTTP ${res.status}`);
    ccidCache = await res.json();
    return ccidCache;
  } catch (err) {
    // Fallback to embedded simulated database for offline/test reliability
    ccidCache = DEFAULT_CCID_DATA;
    return ccidCache;
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
