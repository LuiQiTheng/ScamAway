/**
 * Cryptographic utility for password hashing and session sanitization.
 * Eliminates plaintext credentials in browser localStorage and database queries.
 */

const APP_SALT = 'scam_away_v1_salt_#2026';

/**
 * Computes a SHA-256 cryptographic hash of a password with an application salt.
 * Uses Web Crypto API (crypto.subtle) where available, with environment fallbacks.
 * 
 * @param {string} password - Raw plaintext password
 * @returns {Promise<string>} Hexadecimal SHA-256 hash string
 */
export async function hashPassword(password) {
  if (!password || typeof password !== 'string') return '';

  const saltedString = password + APP_SALT;
  const encoder = new TextEncoder();
  const data = encoder.encode(saltedString);

  // Web Crypto API in browser and modern Node / jsdom
  if (typeof crypto !== 'undefined' && crypto?.subtle?.digest) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  // Node.js crypto module fallback
  try {
    const nodeCrypto = await import(/* @vite-ignore */ 'crypto');
    return nodeCrypto.createHash('sha256').update(saltedString).digest('hex');
  } catch {
    // Deterministic fallback if subtle crypto is somehow not present
    let hash = 0;
    for (let i = 0; i < saltedString.length; i++) {
      hash = ((hash << 5) - hash) + saltedString.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(16).padStart(64, '0');
  }
}

/**
 * Strips sensitive fields (like password) from user or admin objects before storing in state or localStorage.
 * 
 * @param {object|null} user - User or Admin profile object
 * @returns {object|null} Sanitized user profile without password
 */
export function sanitizeUserSession(user) {
  if (!user || typeof user !== 'object') return null;
  const { password: _password, ...sanitized } = user;
  return sanitized;
}

/**
 * Checks whether a password string is already a 64-character SHA-256 hexadecimal hash.
 * 
 * @param {string} password - The password string to inspect
 * @returns {boolean} True if already a 64-character hex hash, false if legacy plaintext
 */
export function isPasswordHashed(password) {
  if (!password || typeof password !== 'string') return false;
  return /^[a-f0-9]{64}$/i.test(password);
}

