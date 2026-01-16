import crypto from 'crypto';
import PasswordResetToken from '@/models/PasswordResetToken';

export const RESET_TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minutes
export const CLEANUP_INTERVAL_MS = 5 * 60 * 60 * 1000; // 5 hours

export function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function createPasswordResetToken(
  userId: string,
  email: string
): Promise<{ token: string; expiresAt: Date }> {
  // Remove any existing tokens for this user
  await PasswordResetToken.deleteMany({ userId });

  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

  await PasswordResetToken.create({
    userId,
    email: email.toLowerCase(),
    tokenHash,
    expiresAt,
  });

  return { token, expiresAt };
}

export async function verifyPasswordResetToken(token: string, email: string) {
  const tokenHash = hashToken(token);
  return PasswordResetToken.findOne({
    email: email.toLowerCase(),
    tokenHash,
    expiresAt: { $gt: new Date() },
  });
}

export async function cleanupExpiredPasswordTokens() {
  const now = new Date();
  const fiveHoursAgo = new Date(Date.now() - CLEANUP_INTERVAL_MS);
  const result = await PasswordResetToken.deleteMany({
    $or: [
      { expiresAt: { $lte: now } },
      { createdAt: { $lte: fiveHoursAgo } },
    ],
  });

  return result.deletedCount || 0;
}

export function buildPasswordResetUrl(email: string, token: string) {
  const baseUrl =
    process.env.NEXTAUTH_URL ||
    process.env.APP_BASE_URL ||
    process.env.VERCEL_URL ||
    'http://localhost:3000';

  const normalizedBaseUrl = baseUrl.startsWith('http')
    ? baseUrl
    : `https://${baseUrl}`;

  const params = new URLSearchParams({
    email,
    token,
  });

  return `${normalizedBaseUrl}/auth/reset-password?${params.toString()}`;
}
