/**
 * Term-based billing for Wise (non-recurring): period length, renewal window, expiry.
 */

export function addBillingPeriod(from: Date, billingCycle: 'monthly' | 'annual'): Date {
  const d = new Date(from.getTime());
  if (billingCycle === 'annual') {
    d.setFullYear(d.getFullYear() + 1);
  } else {
    d.setMonth(d.getMonth() + 1);
  }
  return d;
}

/**
 * New Wise payment: extend from current period end if still active (early renewal), else from now.
 */
export function computeWiseSubscriptionPeriod(
  billingCycle: 'monthly' | 'annual',
  previousEnd: Date | null | undefined
): { start: Date; end: Date } {
  const now = new Date();
  const base =
    previousEnd && previousEnd > now ? previousEnd : now;
  return {
    start: now,
    end: addBillingPeriod(base, billingCycle),
  };
}

/**
 * True when roughly **3 days** remain before period end (daily cron–friendly).
 * Uses a 2–4 day window so a once-daily job doesn’t miss the reminder.
 */
export function isInWiseRenewalReminderWindow(subscriptionEndDate: Date, now: Date): boolean {
  const msLeft = subscriptionEndDate.getTime() - now.getTime();
  const daysLeft = msLeft / (24 * 60 * 60 * 1000);
  return daysLeft >= 2 && daysLeft <= 4;
}
