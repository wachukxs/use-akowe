import Stripe from 'stripe';

// Initialize Stripe with the secret key
export const stripe = new Stripe(
  process.env.NODE_ENV === 'production'
    ? process.env.STRIPE_SECRET_KEY_PROD_V2 || ''
    : process.env.STRIPE_SECRET_KEY_TEST || '',
  {
    apiVersion: '2025-10-29.clover',
  }
);

// Stripe product IDs for identifying plan type in webhooks
export const STRIPE_PRODUCT_IDS = {
  standard: {
    monthly: process.env.STRIPE_PRODUCT_STANDARD_MONTHLY || 'prod_U5QlsnN82nIuPu6',
    annual: process.env.STRIPE_PRODUCT_STANDARD_ANNUAL || 'prod_U5QmnGqrvCYikS',
  },
} as const;

// Determine plan type from a Stripe product ID
export function getPlanTypeFromProductId(productId: string): 'standard' | 'pro' {
  if (
    productId === STRIPE_PRODUCT_IDS.standard.monthly ||
    productId === STRIPE_PRODUCT_IDS.standard.annual
  ) {
    return 'standard';
  }
  return 'pro';
}

// Get the appropriate price ID based on environment, plan type, and billing cycle
export function getStripePriceId(
  billingCycle: 'monthly' | 'annual',
  planType: 'standard' | 'pro' = 'pro'
): string {
  const isProduction = process.env.NODE_ENV === 'production';

  if (planType === 'standard') {
    if (isProduction) {
      return billingCycle === 'monthly'
        ? process.env.STRIPE_PRICE_STANDARD_MONTHLY_PROD || ''
        : process.env.STRIPE_PRICE_STANDARD_ANNUAL_PROD || '';
    } else {
      return billingCycle === 'monthly'
        ? process.env.STRIPE_PRICE_STANDARD_MONTHLY_TEST || ''
        : process.env.STRIPE_PRICE_STANDARD_ANNUAL_TEST || '';
    }
  }

  // Pro plan (default)
  if (isProduction) {
    return billingCycle === 'monthly'
      ? process.env.STRIPE_PRICE_MONTHLY_PROD || ''
      : process.env.STRIPE_PRICE_ANNUAL_PROD || '';
  } else {
    return billingCycle === 'monthly'
      ? process.env.STRIPE_PRICE_MONTHLY_TEST || ''
      : process.env.STRIPE_PRICE_ANNUAL_TEST || '';
  }
}

// Get the publishable key for the client
export function getStripePublishableKey(): string {
  return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
}
