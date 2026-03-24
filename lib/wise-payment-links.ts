import crypto from 'crypto';

export type WisePaymentLinkSku =
  | 'annual_pro'
  | 'annual_standard'
  | 'monthly_standard'
  | 'monthly_pro';

const SKU_ENV_KEYS_PROD: Record<WisePaymentLinkSku, string> = {
  annual_pro: 'PROD_WISE_PAYMENT_LINK_120_USD_ANNUAL_PRO',
  annual_standard: 'PROD_WISE_PAYMENT_LINK_70_USD_ANNUAL_STANDARD',
  monthly_standard: 'PROD_WISE_PAYMENT_LINK_7_USD_MONTHLY_STANDARD',
  monthly_pro: 'PROD_WISE_PAYMENT_LINK_12_USD_MONTHLY_PRO',
};

/** Optional sandbox URLs (same SKU keys with SANDBOX_ prefix). */
const SKU_ENV_KEYS_SANDBOX: Record<WisePaymentLinkSku, string> = {
  annual_pro: 'SANDBOX_WISE_PAYMENT_LINK_120_USD_ANNUAL_PRO',
  annual_standard: 'SANDBOX_WISE_PAYMENT_LINK_70_USD_ANNUAL_STANDARD',
  monthly_standard: 'SANDBOX_WISE_PAYMENT_LINK_7_USD_MONTHLY_STANDARD',
  monthly_pro: 'SANDBOX_WISE_PAYMENT_LINK_12_USD_MONTHLY_PRO',
};

/** Expected target amounts in USD for each product (for transfer API fallback matching). */
export const WISE_SKU_USD_TARGET: Record<WisePaymentLinkSku, number> = {
  annual_pro: 120,
  annual_standard: 70,
  monthly_standard: 7,
  monthly_pro: 12,
};

export function wiseSkuFromPlan(
  billingCycle: 'monthly' | 'annual',
  planType: 'standard' | 'pro'
): WisePaymentLinkSku {
  if (billingCycle === 'annual') {
    return planType === 'pro' ? 'annual_pro' : 'annual_standard';
  }
  return planType === 'pro' ? 'monthly_pro' : 'monthly_standard';
}

export function planBillingFromWiseSku(sku: WisePaymentLinkSku): {
  plan: 'standard' | 'pro';
  billingCycle: 'monthly' | 'annual';
} {
  switch (sku) {
    case 'annual_pro':
      return { plan: 'pro', billingCycle: 'annual' };
    case 'annual_standard':
      return { plan: 'standard', billingCycle: 'annual' };
    case 'monthly_pro':
      return { plan: 'pro', billingCycle: 'monthly' };
    case 'monthly_standard':
      return { plan: 'standard', billingCycle: 'monthly' };
    default: {
      const _x: never = sku;
      return _x;
    }
  }
}

function isWisePaymentLinksSandboxMode(): boolean {
  if (process.env.WISE_PAYMENT_LINKS_ENV === 'sandbox') return true;
  if (process.env.WISE_PAYMENT_LINKS_ENV === 'production') return false;
  return process.env.WISE_WEBHOOK_ENV === 'sandbox';
}

/**
 * Resolve configured Wise payment link URL for a SKU (prod vs sandbox env vars).
 */
export function getWisePaymentLinkUrl(sku: WisePaymentLinkSku): string | undefined {
  const sandbox = isWisePaymentLinksSandboxMode();
  const keys = sandbox ? SKU_ENV_KEYS_SANDBOX : SKU_ENV_KEYS_PROD;
  const key = keys[sku];
  const url = process.env[key]?.trim();
  if (url) return url;
  if (sandbox) {
    const fallback = process.env[SKU_ENV_KEYS_PROD[sku]]?.trim();
    if (fallback) return fallback;
  }
  return undefined;
}

/** Append internal reference as query param (Wise may ignore; helps manual debugging). */
export function appendAkoweRefToPaymentUrl(baseUrl: string, reference: string): string {
  try {
    const u = new URL(baseUrl);
    u.searchParams.set('akoweRef', reference);
    return u.toString();
  } catch {
    return baseUrl;
  }
}

export async function generateUniqueWisePaymentReference(
  exists: (ref: string) => Promise<boolean>
): Promise<string> {
  for (let i = 0; i < 8; i++) {
    const ref = `AKW-${crypto.randomBytes(5).toString('hex').toUpperCase()}`;
    if (!(await exists(ref))) return ref;
  }
  throw new Error('Could not allocate unique Wise payment reference');
}
