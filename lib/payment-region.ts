import type { NextRequest } from 'next/server';

/**
 * Use Wise payment links instead of Stripe (e.g. India where Stripe checkout is unavailable).
 * Uses geo headers from the hosting edge when present.
 */
export function shouldUseWisePaymentLinks(request: NextRequest): boolean {
  if (process.env.PAYMENT_USE_WISE === 'true') return true;
  if (process.env.PAYMENT_USE_WISE === 'false') return false;

  const country =
    request.headers.get('x-vercel-ip-country') ||
    request.headers.get('cf-ipcountry') ||
    request.headers.get('x-nf-country') ||
    '';

  if (country === 'IN' || country === 'PT') return true;

  const forced = process.env.PAYMENT_WISE_TEST_COUNTRY;
  if (forced && country === forced) return true;

  return false;
}
