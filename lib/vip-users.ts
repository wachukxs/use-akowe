/**
 * VIP Users Configuration
 * 
 * Users in this list get automatic pro plan access without limits.
 * Their accounts are upgraded to pro on login if they're on the free plan.
 * 
 * When removed from this list:
 * - Users WITH a Stripe subscription keep their pro plan (they paid)
 * - Users WITHOUT a Stripe subscription are downgraded to free on next login
 * 
 * Influencers with hasProAccess enabled also receive the same treatment.
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
 * Check if an email belongs to an influencer who has pro access enabled.
 * This is an async check against the database.
 */
export async function isInfluencerWithProAccess(email: string): Promise<boolean> {
  if (!email) return false;
  try {
    const Influencer = (await import('@/models/Influencer')).default;
    const influencer = await Influencer.findOne({
      email: email.toLowerCase(),
      hasProAccess: true,
    }).lean();
    return !!influencer;
  } catch {
    return false;
  }
}

/**
 * Check if a user should have pro plan access.
 * Returns true if user is VIP, is an influencer with pro access enabled,
 * or has an active Stripe subscription.
 */
export async function shouldHaveProPlan(email: string, stripeSubscriptionId?: string): Promise<boolean> {
  if (!!stripeSubscriptionId) return true;
  if (isVIPUser(email)) return true;
  return isInfluencerWithProAccess(email);
}

