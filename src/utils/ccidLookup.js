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

// --- Numverify API Integration & Malaysian Telco Fallback ---
const NUMVERIFY_API_KEY = import.meta.env.VITE_NUMVERIFY_API_KEY || '';

/**
 * Fallback Malaysian Telco & Line Type Resolver when Numverify API quota is reached (HTTP 429)
 * or when offline / network failure occurs.
 */
export function getMalaysianCarrierFallback(phoneNumber) {
  if (!phoneNumber) return { valid: false, lineType: 'unknown', carrier: 'Unknown', source: 'local_fallback' };

  const clean = phoneNumber.replace(/[^\d+]/g, '');
  let standard = clean;
  if (standard.startsWith('+60')) standard = '0' + standard.slice(3);
  else if (standard.startsWith('60')) standard = '0' + standard.slice(2);

  // Check Malaysian VoIP (0154 prefix assigned to VoIP services in Malaysia)
  const isVoip = /^015[0-9]{7,8}$/.test(standard);
  if (isVoip) {
    return {
      valid: true,
      lineType: 'voip',
      carrier: 'VoIP Provider (MCMC 015 Prefix)',
      country: 'Malaysia',
      source: 'local_fallback'
    };
  }

  // Check Malaysian Mobile (10 or 11 digits: 01X-XXXXXXX)
  const isMobile = /^01[0-9]{8,9}$/.test(standard);
  if (isMobile) {
    let carrier = 'Malaysian Mobile';
    const prefix3 = standard.slice(0, 3);
    const prefix4 = standard.slice(0, 4);

    if (prefix3 === '012' || prefix3 === '017') carrier = 'Maxis';
    else if (prefix3 === '019' || prefix3 === '013') carrier = 'Celcom';
    else if (prefix3 === '016' || prefix3 === '014') carrier = 'Digi';
    else if (prefix3 === '018') carrier = 'U Mobile';
    else if (prefix4 === '0111' || prefix4 === '0112') carrier = 'Maxis';
    else if (prefix4 === '0113' || prefix4 === '0114') carrier = 'U Mobile';
    else if (prefix4 === '0115') carrier = 'Celcom';
    else if (prefix4 === '0116') carrier = 'Digi';
    else if (prefix4 === '0117') carrier = 'YTL Yes 5G';
    else if (prefix3 === '011') carrier = 'CelcomDigi / U Mobile / MVNO';

    return {
      valid: true,
      lineType: 'mobile',
      carrier,
      country: 'Malaysia',
      source: 'local_fallback'
    };
  }

  // Check Malaysian Landline / Fixed Line
  const isLandline = /^0[3-9][0-9]{7,8}$/.test(standard);
  if (isLandline) {
    const area = standard.slice(0, 2);
    let areaName = 'Fixed Line (Telekom Malaysia)';
    if (area === '03') areaName = 'Telekom Malaysia (KL/Selangor/Putrajaya)';
    else if (area === '04') areaName = 'Telekom Malaysia (Penang/Kedah/Perlis)';
    else if (area === '05') areaName = 'Telekom Malaysia (Perak)';
    else if (area === '06') areaName = 'Telekom Malaysia (Melaka/N.Sembilan/Muar)';
    else if (area === '07') areaName = 'Telekom Malaysia (Johor)';
    else if (area === '09') areaName = 'Telekom Malaysia (Pahang/Terengganu/Kelantan)';
    else if (standard.startsWith('082') || standard.startsWith('083') || standard.startsWith('084') || standard.startsWith('085') || standard.startsWith('086')) {
      areaName = 'Telekom Malaysia (Sarawak)';
    } else if (standard.startsWith('087') || standard.startsWith('088') || standard.startsWith('089')) {
      areaName = 'Telekom Malaysia (Sabah/Labuan)';
    }

    return {
      valid: true,
      lineType: 'landline',
      carrier: areaName,
      country: 'Malaysia',
      source: 'local_fallback'
    };
  }

  return {
    valid: false,
    lineType: 'unknown',
    carrier: 'Unassigned / Non-Malaysian',
    country: 'Unknown',
    source: 'local_fallback'
  };
}

export async function validatePhoneNumverify(phoneNumber) {
  const fallback = getMalaysianCarrierFallback(phoneNumber);

  if (!NUMVERIFY_API_KEY) {
    return fallback;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    
    const cleanNumber = phoneNumber.replace(/[\s-]/g, '');
    const res = await fetch(
      `http://apilayer.net/api/validate?access_key=${NUMVERIFY_API_KEY}&number=${encodeURIComponent(cleanNumber)}&country_code=MY&format=1`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);
    
    if (res.ok) {
      const data = await res.json();
      if (data && data.success !== false) {
        return {
          valid: data.valid ?? fallback.valid,
          lineType: data.line_type || fallback.lineType,
          carrier: data.carrier || fallback.carrier,
          location: data.location || '',
          country: data.country_name || fallback.country,
          internationalFormat: data.international_format || cleanNumber,
          source: 'numverify_api'
        };
      }
    }
  } catch (err) {
    console.warn('[Numverify] API check failed:', err.message);
  }

  // Graceful fallback to Malaysian Telco Carrier Database when API monthly limit (HTTP 429) is hit
  return fallback;
}
