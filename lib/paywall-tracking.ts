import connectDB from './mongodb';
import PaywallEvent from '@/models/PaywallEvent';
import type { PaywallVariant } from './paywall-ab-test';

/**
 * Track paywall events in the database for A/B test analysis
 * Events are automatically deleted after 90 days via TTL index
 */
export async function trackPaywallEvent(
  userId: string,
  variant: PaywallVariant,
  eventType: 'paywall_view' | 'export_attempt' | 'preview_view' | 'conversion',
  context?: string
): Promise<void> {
  try {
    await connectDB();
    
    await PaywallEvent.create({
      userId,
      variant,
      eventType,
      context,
    });
  } catch (error) {
    // Silently fail - analytics shouldn't break user experience
    console.error('Failed to track paywall event:', error);
  }
}
