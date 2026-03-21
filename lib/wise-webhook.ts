import crypto from 'crypto';

/** Sandbox signing key from https://docs.wise.com/guides/developer/webhooks/event-handling */
const WISE_PUBLIC_KEY_SANDBOX = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAwpb91cEYuyJNQepZAVfP
ZIlPZfNUefH+n6w9SW3fykqKu938cR7WadQv87oF2VuT+fDt7kqeRziTmPSUhqPU
ys/V2Q1rlfJuXbE+Gga37t7zwd0egQ+KyOEHQOpcTwKmtZ81ieGHynAQzsn1We3j
wt760MsCPJ7GMT141ByQM+yW1Bx+4SG3IGjXWyqOWrcXsxAvIXkpUD/jK/L958Cg
nZEgz0BSEh0QxYLITnW1lLokSx/dTianWPFEhMC9BgijempgNXHNfcVirg1lPSyg
z7KqoKUN0oHqWLr2U1A+7kqrl6O2nx3CKs1bj1hToT1+p4kcMoHXA7kA+VBLUpEs
VwIDAQAB
-----END PUBLIC KEY-----`;

/** Production signing key from https://docs.wise.com/guides/developer/webhooks/event-handling */
const WISE_PUBLIC_KEY_PRODUCTION = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAvO8vXV+JksBzZAY6GhSO
XdoTCfhXaaiZ+qAbtaDBiu2AGkGVpmEygFmWP4Li9m5+Ni85BhVvZOodM9epgW3F
bA5Q1SexvAF1PPjX4JpMstak/QhAgl1qMSqEevL8cmUeTgcMuVWCJmlge9h7B1CS
D4rtlimGZozG39rUBDg6Qt2K+P4wBfLblL0k4C4YUdLnpGYEDIth+i8XsRpFlogx
CAFyH9+knYsDbR43UJ9shtc42Ybd40Afihj8KnYKXzchyQ42aC8aZ/h5hyZ28yVy
Oj3Vos0VdBIs/gAyJ/4yyQFCXYte64I7ssrlbGRaco4nKF3HmaNhxwyKyJafz19e
HwIDAQAB
-----END PUBLIC KEY-----`;

export type WiseWebhookEnvironment = 'sandbox' | 'production';

export function getWiseWebhookPublicKeyPem(): string {
  const custom = process.env.WISE_WEBHOOK_PUBLIC_KEY?.trim();
  if (custom) {
    if (!custom.includes('BEGIN PUBLIC KEY')) {
      return `-----BEGIN PUBLIC KEY-----\n${custom}\n-----END PUBLIC KEY-----`;
    }
    return custom;
  }
  const env = process.env.WISE_WEBHOOK_ENV as WiseWebhookEnvironment | undefined;
  if (env === 'sandbox') return WISE_PUBLIC_KEY_SANDBOX;
  if (env === 'production') return WISE_PUBLIC_KEY_PRODUCTION;
  // Safe default: local / preview → sandbox; deployed production → production
  if (process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production') {
    return WISE_PUBLIC_KEY_PRODUCTION;
  }
  return WISE_PUBLIC_KEY_SANDBOX;
}

/**
 * Verify Wise `X-Signature-SHA256` (RSA-SHA256 over raw body).
 * @see https://github.com/transferwise/digital-signatures-examples/blob/main/verify-webhook-signature/verify-signature.js
 */
export function verifyWiseWebhookSignature(
  rawBody: string | Buffer,
  signatureBase64: string | null | undefined,
  publicKeyPem: string
): boolean {
  if (!signatureBase64) return false;
  try {
    const publicKey = crypto.createPublicKey({ key: publicKeyPem, format: 'pem' });
    const buf = typeof rawBody === 'string' ? Buffer.from(rawBody, 'utf8') : rawBody;
    return crypto.verify(
      'RSA-SHA256',
      buf,
      { key: publicKey, padding: crypto.constants.RSA_PKCS1_PADDING },
      Buffer.from(signatureBase64, 'base64')
    );
  } catch {
    return false;
  }
}

/** Pull a 24-char hex Mongo ObjectId from a SWIFT reference field (may include /RFB/ etc.). */
export function extractMongoIdFromWiseReference(ref: string | undefined | null): string | null {
  if (!ref || typeof ref !== 'string') return null;
  const compact = ref.replace(/\s/g, '');
  const exact = /^[a-f\d]{24}$/i.exec(compact);
  if (exact) return exact[0].toLowerCase();
  const embedded = /([a-f\d]{24})/i.exec(compact);
  if (embedded) return embedded[1].toLowerCase();
  return null;
}
