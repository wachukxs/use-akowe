/**
 * Paywall A/B test utilities
 * 
 * Tests different paywall placement strategies:
 * - Variant A: Paywall before output (block generation)
 * - Variant B: Output preview then paywall before export (let them see, block export)
 */

export type PaywallVariant = 'variant_a' | 'variant_b';

/**
 * Gets paywall variant for a user from cookie
 * Falls back to random assignment if no cookie exists
 */
export function getPaywallVariant(): PaywallVariant {
  if (typeof window === 'undefined') return 'variant_a';
  
  const cookies = document.cookie.split(';');
  const variantCookie = cookies.find(cookie => cookie.trim().startsWith('akowe_paywall_variant='));
  
  if (variantCookie) {
    const value = variantCookie.split('=')[1]?.trim();
    if (value === 'variant_a' || value === 'variant_b') {
      return value;
    }
  }
  
  // Random assignment (50/50 split)
  const variant = Math.random() < 0.5 ? 'variant_a' : 'variant_b';
  
  // Set cookie for 30 days
  document.cookie = `akowe_paywall_variant=${variant}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;
  
  return variant;
}

/**
 * Sets paywall variant cookie (for server-side assignment)
 */
export function setPaywallVariantCookie(variant: PaywallVariant): string {
  return `akowe_paywall_variant=${variant}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;
}

/**
 * Determines if user should see paywall before output generation
 * Variant A: Show paywall before output
 * Variant B: Allow preview, show paywall before export
 */
export function shouldShowPaywallBeforeOutput(variant: PaywallVariant): boolean {
  return variant === 'variant_a';
}

/**
 * Determines if user should see paywall before export
 * Variant A: Already blocked, so no export paywall needed
 * Variant B: Show paywall before export
 */
export function shouldShowPaywallBeforeExport(variant: PaywallVariant): boolean {
  return variant === 'variant_b';
}
