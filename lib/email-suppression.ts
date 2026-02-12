import crypto from 'crypto';
import EmailSuppression, { SuppressionReason } from '@/models/EmailSuppression';

function getSecret(): string {
  const secret = process.env.CRON_SECRET;
  if (!secret) throw new Error('CRON_SECRET env var not configured');
  return secret;
}

/**
 * Generate an HMAC-SHA256 token for an email address.
 * Used to create signed unsubscribe URLs that don't require authentication.
 */
export function generateUnsubscribeToken(email: string): string {
  return crypto
    .createHmac('sha256', getSecret())
    .update(email.toLowerCase())
    .digest('hex');
}

/**
 * Validate that a token matches the expected HMAC for an email address.
 */
export function validateUnsubscribeToken(token: string, email: string): boolean {
  const expected = generateUnsubscribeToken(email);
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}

/**
 * Build a full unsubscribe URL with signed token.
 */
export function getUnsubscribeUrl(email: string): string {
  const baseUrl =
    process.env.NEXTAUTH_URL ||
    process.env.APP_BASE_URL ||
    process.env.VERCEL_URL ||
    'https://useakowe.com';
  const base = baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`;
  const token = generateUnsubscribeToken(email);
  return `${base}/api/email/unsubscribe?email=${encodeURIComponent(email)}&token=${token}`;
}

/**
 * Check if an email is on the suppression list.
 */
export async function isEmailSuppressed(email: string): Promise<boolean> {
  const record = await EmailSuppression.findOne({ email: email.toLowerCase() }).lean();
  return !!record;
}

/**
 * Get all suppressed email addresses as a Set for efficient lookups.
 */
export async function getSuppressedEmails(): Promise<Set<string>> {
  const records = await EmailSuppression.find().select('email').lean();
  return new Set(records.map((r) => r.email.toLowerCase()));
}

/**
 * Add an email to the suppression list.
 * Uses upsert so duplicate entries don't throw.
 */
export async function suppressEmail(
  email: string,
  reason: SuppressionReason,
  source?: string
): Promise<void> {
  await EmailSuppression.updateOne(
    { email: email.toLowerCase() },
    {
      $setOnInsert: {
        email: email.toLowerCase(),
        reason,
        suppressedAt: new Date(),
        ...(source && { source }),
      },
    },
    { upsert: true }
  );
}
