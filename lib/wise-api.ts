/**
 * Wise REST API — fetch transfer details for webhook reconciliation.
 * @see https://docs.wise.com/api-reference/transfer
 */
export type WiseTransferDetails = {
  id: number;
  status?: string;
  reference?: string;
  details?: { reference?: string };
  originator?: { reference?: string };
  sourceCurrency?: string;
  sourceValue?: number;
  targetCurrency?: string;
  targetValue?: number;
  customerTransactionId?: string;
};

/** Aligns API host + token with sandbox vs production (same rules as webhook signing env). */
function isWiseSandboxApiContext(): boolean {
  if (process.env.WISE_API_ENV === 'sandbox' || process.env.WISE_WEBHOOK_ENV === 'sandbox') {
    return true;
  }
  if (process.env.WISE_API_ENV === 'production' || process.env.WISE_WEBHOOK_ENV === 'production') {
    return false;
  }
  return (
    process.env.WISE_API_ENV !== 'production' &&
    process.env.WISE_WEBHOOK_ENV !== 'production' &&
    process.env.VERCEL_ENV !== 'production' &&
    process.env.NODE_ENV !== 'production'
  );
}

export function getWiseApiBaseUrl(): string {
  const override = process.env.WISE_API_BASE?.trim();
  if (override) return override.replace(/\/$/, '');
  return isWiseSandboxApiContext()
    ? 'https://api.sandbox.transferwise.com'
    : 'https://api.wise.com';
}

export function getWiseApiToken(): string | undefined {
  const token = isWiseSandboxApiContext()
    ? process.env.WISE_SANDBOX_TOKEN_KEY?.trim()
    : process.env.WISE_PROD_TOKEN_KEY?.trim();
  return token || undefined;
}

export async function wiseGetTransfer(transferId: string | number): Promise<WiseTransferDetails | null> {
  const token = getWiseApiToken();
  if (!token) {
    const which = isWiseSandboxApiContext() ? 'WISE_SANDBOX_TOKEN_KEY' : 'WISE_PROD_TOKEN_KEY';
    console.error(`[wise api] ${which} is not set — cannot load transfer for webhook matching`);
    return null;
  }
  const base = getWiseApiBaseUrl();
  const id = typeof transferId === 'string' ? transferId.replace(/\D/g, '') || transferId : String(transferId);
  try {
    const res = await fetch(`${base}/v1/transfers/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });
    if (!res.ok) {
      console.error('[wise api] GET /v1/transfers failed', id, res.status, await res.text());
      return null;
    }
    return (await res.json()) as WiseTransferDetails;
  } catch (e) {
    console.error('[wise api] GET /v1/transfers error', id, e);
    return null;
  }
}
