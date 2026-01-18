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

// Get the appropriate price ID based on environment and billing cycle
export function getStripePriceId(billingCycle: 'monthly' | 'annual'): string {
  const isProduction = process.env.NODE_ENV === 'production';
  
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
