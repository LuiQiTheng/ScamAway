/**
 * VirusTotal URL Safety Scanner
 * Uses the VirusTotal v3 API to check URLs for malware, phishing, and other threats.
 * 
 * Free tier limits: 4 lookups/minute, 500/day.
 * API docs: https://docs.virustotal.com/reference/url-info
 */

const VT_API_KEY = import.meta.env.VITE_VIRUSTOTAL_API_KEY || '';
const VT_BASE = 'https://www.virustotal.com/api/v3';

/**
 * Encode a URL to VirusTotal's URL identifier format (base64 without padding).
 * VT v3 requires: base64url(url) with trailing '=' removed.
 */
function vtUrlId(url) {
  return btoa(url).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Check if a domain exists using Google Public DNS (DoH).
 * @param {string} url - The URL to check
 * @returns {Promise<boolean>} True if it resolves, false if NXDOMAIN
 */
export async function checkDomainExists(url) {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname;
    
    const response = await fetch(`https://dns.google/resolve?name=${hostname}`, {
      method: 'GET',
      cache: 'no-store'
    });
    
    if (response.ok) {
      const data = await response.json();
      // Status 3 is NXDOMAIN (Non-Existent Domain)
      if (data.Status === 3) return { exists: false, error: null };
      
      // If there are no answers at all, it might also be a dead domain
      if (data.Status === 0 && !data.Answer) return { exists: false, error: null };
      
      return { exists: true, error: null };
    }
    return { exists: false, error: 'api_failed' };
  } catch (error) {
    console.error("DNS verification failed:", error);
    return { exists: false, error: 'network_blocked' };
  }
}

/**
 * Check a single URL against VirusTotal's database.
 * 
 * Strategy:
 * 1. First, try to GET the existing analysis (fast, no quota cost if already scanned).
 * 2. If not found (404), POST to request a new scan, then poll for results.
 * 3. Gracefully handle CORS, network, and missing API key errors.
 * 
 * @param {string} url - The full URL to check (e.g. "https://example.com")
 * @returns {Promise<object>} Result object with safety assessment
 */
export async function checkUrlWithVirusTotal(url) {
  // Guard: If no API key is configured, skip gracefully
  if (!VT_API_KEY) {
    return {
      status: 'skipped',
      reason: 'No VirusTotal API key configured',
      url,
      isMalicious: false,
      detections: 0,
      total: 0,
      details: null
    };
  }

  try {
    // Step 1: Try to get existing report for this URL
    const urlId = vtUrlId(url);
    const getResponse = await fetchWithTimeout(
      `${VT_BASE}/urls/${urlId}`,
      {
        method: 'GET',
        headers: { 'x-apikey': VT_API_KEY }
      },
      15000 // 15 second timeout
    );

    if (getResponse.ok) {
      const data = await getResponse.json();
      return parseVTResponse(data, url);
    }

    // Step 2: If no existing report, submit URL for scanning
    if (getResponse.status === 404) {
      const formData = new URLSearchParams();
      formData.append('url', url);

      const postResponse = await fetchWithTimeout(
        `${VT_BASE}/urls`,
        {
          method: 'POST',
          headers: { 'x-apikey': VT_API_KEY },
          body: formData
        },
        15000
      );

      if (!postResponse.ok) {
        throw new Error(`VirusTotal scan submission failed: ${postResponse.status}`);
      }

      const postData = await postResponse.json();
      const analysisId = postData?.data?.id;

      if (!analysisId) {
        throw new Error('No analysis ID returned from VirusTotal');
      }

      // Step 3: Poll for the analysis result (wait up to 30s with 5s intervals)
      return await pollAnalysis(analysisId, url);
    }

    // Handle rate limiting
    if (getResponse.status === 429) {
      return {
        status: 'rate_limited',
        reason: 'VirusTotal free tier rate limit reached (4 requests/minute). Please wait and try again.',
        url,
        isMalicious: false,
        detections: 0,
        total: 0,
        details: null
      };
    }

    throw new Error(`VirusTotal returned status ${getResponse.status}`);

  } catch (error) {
    if (error.message === 'Request timed out') {
      return {
        status: 'timeout',
        reason: 'Request timed out',
        url,
        isMalicious: false,
        detections: 0,
        total: 0,
        details: null
      };
    }
    
    // Gracefully handle CORS, network, and other errors
    const isCorsError = error.message?.includes('Failed to fetch') || 
                        error.message?.includes('NetworkError') ||
                        error.message?.includes('CORS');
    
    return {
      status: 'error',
      reason: isCorsError 
        ? 'VirusTotal API blocked by browser CORS policy. This is expected in frontend-only apps — results from the local rules engine are still fully active.'
        : `VirusTotal check failed: ${error.message}`,
      url,
      isMalicious: false,
      detections: 0,
      total: 0,
      details: null
    };
  }
}

/**
 * Poll the VirusTotal analysis endpoint until results are ready.
 * Max 6 attempts with 5-second intervals (30s total).
 */
async function pollAnalysis(analysisId, url) {
  const maxAttempts = 6;
  const interval = 5000;

  for (let i = 0; i < maxAttempts; i++) {
    await sleep(interval);

    try {
      const response = await fetchWithTimeout(
        `${VT_BASE}/analyses/${analysisId}`,
        {
          method: 'GET',
          headers: { 'x-apikey': VT_API_KEY }
        },
        15000
      );

      if (response.ok) {
        const data = await response.json();
        const status = data?.data?.attributes?.status;

        if (status === 'completed') {
          return parseAnalysisResponse(data, url);
        }
        // If still queued/in-progress, continue polling
      }
    } catch {
      // Continue polling on error
    }
  }

  return {
    status: 'timeout',
    reason: 'VirusTotal scan is still processing. Try checking again in a few minutes.',
    url,
    isMalicious: false,
    detections: 0,
    total: 0,
    details: null
  };
}

/**
 * Parse a VirusTotal URL report response (from GET /urls/{id}).
 */
function parseVTResponse(data, url) {
  const attrs = data?.data?.attributes;
  const stats = attrs?.last_analysis_stats || {};

  const malicious = stats.malicious || 0;
  const suspicious = stats.suspicious || 0;
  const harmless = stats.harmless || 0;
  const undetected = stats.undetected || 0;
  const total = malicious + suspicious + harmless + undetected;
  const threats = malicious + suspicious;

  return {
    status: 'success',
    reason: null,
    url,
    isMalicious: threats > 0,
    detections: threats,
    total,
    harmless,
    malicious,
    suspicious,
    scanDate: attrs?.last_analysis_date 
      ? new Date(attrs.last_analysis_date * 1000).toISOString() 
      : null,
    reputation: attrs?.reputation ?? null,
    categories: attrs?.categories || {},
    details: stats
  };
}

/**
 * Parse a VirusTotal analysis response (from GET /analyses/{id}).
 */
function parseAnalysisResponse(data, url) {
  const attrs = data?.data?.attributes;
  const stats = attrs?.stats || {};

  const malicious = stats.malicious || 0;
  const suspicious = stats.suspicious || 0;
  const harmless = stats.harmless || 0;
  const undetected = stats.undetected || 0;
  const total = malicious + suspicious + harmless + undetected;
  const threats = malicious + suspicious;

  return {
    status: 'success',
    reason: null,
    url,
    isMalicious: threats > 0,
    detections: threats,
    total,
    harmless,
    malicious,
    suspicious,
    scanDate: new Date().toISOString(),
    reputation: null,
    categories: {},
    details: stats
  };
}

/**
 * Fetch with a configurable timeout using AbortController.
 */
async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    if (err.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    throw err;
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
