/**
 * VIP Users Configuration
 * 
 * Users in this list get automatic pro plan access without limits.
 * Their accounts are upgraded to pro on login if they're on the free plan.
 * 
 * When removed from this list:
 * - Users WITH a Stripe subscription keep their pro plan (they paid)
 * - Users WITHOUT a Stripe subscription are downgraded to free on next login
 */

// List of email addresses that should have unlimited access (pro plan)
// Set via VIP_USERS env variable as comma-separated emails (e.g., "demo@example.com,test@example.com")
export const VIP_EMAILS: string[] = (process.env.VIP_USERS || '')
  .split(',')
  .map(email => email.trim().toLowerCase())
  .filter(email => email.length > 0);

/**
 * Check if an email belongs to a VIP user
 */
export function isVIPUser(email: string): boolean {
  if (!email) return false;
  return VIP_EMAILS.some(vipEmail => 
    vipEmail.toLowerCase() === email.toLowerCase()
  );
}

/**
 * Check if a user should keep their pro plan
 * Returns true if user is VIP OR has an active Stripe subscription
 */
export function shouldHaveProPlan(email: string, stripeSubscriptionId?: string): boolean {
  return isVIPUser(email) || !!stripeSubscriptionId;
}

