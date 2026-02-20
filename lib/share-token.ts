import crypto from 'crypto';

/**
 * Generate a URL-safe, crypto-random token (~24 chars).
 * Uses base64url encoding (no +, /, or = characters).
 */
export function generateShareToken(): string {
  return crypto.randomBytes(18).toString('base64url');
}

/**
 * Generate a random session ID for advisor cookie tracking.
 */
export function generateAdvisorSessionId(): string {
  return crypto.randomBytes(16).toString('hex');
}
