/**
 * Stripe Webhook Handler
 *
 * Listens to:
 * - checkout.session.completed — upgrade to Pro after successful checkout
 * - customer.subscription.updated — sync plan when subscription status changes (active, past_due, canceled, etc.)
 * - customer.subscription.deleted — downgrade when subscription is removed
 * - charge.refunded — downgrade when a charge is refunded (refunds don’t always cancel the subscription in Stripe)
 *
 * In Stripe Dashboard: Developers → Webhooks → your endpoint → ensure “charge.refunded” is in the list of events to send.
 */
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { trackPaywallEvent } from '@/lib/paywall-tracking';
import { sendGA4ServerEvent } from '@/lib/ga4-server';
import { sendPaymentFailedEmail } from '@/lib/email';

const GRACE_PERIOD_DAYS = 3;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  let event;
  
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }

  await connectDB();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        const userId = session.metadata?.userId;
        const billingCycle = session.metadata?.billingCycle || 'monthly';
        
        if (userId && session.subscription) {
          // Fetch subscription to get creation date
          try {
            const subscription = await stripe.subscriptions.retrieve(
              typeof session.subscription === 'string' ? session.subscription : session.subscription.id
            );
            
            const userBeforeUpdate = await User.findById(userId).lean();
            const wasFreeUser = userBeforeUpdate && userBeforeUpdate.plan === 'free';
            
            await User.findByIdAndUpdate(userId, {
              plan: 'pro',
              stripeSubscriptionId: subscription.id,
              billingCycle: billingCycle,
              subscriptionStartDate: new Date(subscription.created * 1000),
              subscriptionEndDate: null, // Active subscription
            });
            console.log(`✅ Updated user ${userId} to pro plan (${billingCycle}) with subscription start date`);
            
            // Track conversion event (if user was previously on free plan)
            if (wasFreeUser) {
              // Find the user's most recent paywall event to determine their variant
              const PaywallEventModel = (await import('@/models/PaywallEvent')).default;
              const recentPaywallEvent = await PaywallEventModel.findOne({
                userId: userId,
                eventType: { $in: ['paywall_view', 'preview_view', 'export_attempt'] },
              })
                .sort({ createdAt: -1 })
                .lean();
              
              // Use the variant from their most recent paywall event, or default to variant_a
              const userVariant = (recentPaywallEvent && 'variant' in recentPaywallEvent && (recentPaywallEvent.variant === 'variant_a' || recentPaywallEvent.variant === 'variant_b'))
                ? recentPaywallEvent.variant
                : 'variant_a';
              await trackPaywallEvent(userId, userVariant, 'conversion', 'checkout_completed');
            }
            
            // Track purchase event (server-side tracking will be handled via client callback)
            // Store tracking metadata in user document for client to pick up
            const priceAmount = subscription.items.data[0]?.price?.unit_amount || 0;
            const priceInDollars = priceAmount / 100;
            await User.findByIdAndUpdate(userId, {
              $set: {
                lastPurchaseTracking: {
                  eventName: 'purchase',
                  params: {
                    user_id: userId,
                    billing_cycle: billingCycle,
                    plan_type: 'pro',
                    value: priceInDollars,
                    currency: 'USD',
                    timestamp: Date.now(),
                  },
                },
              },
            });

            // Fire GA4 server-side event — ensures conversion is tracked
            // even if the client-side redirect after checkout fails
            sendGA4ServerEvent(userId, userId, [
              {
                name: 'subscription_started',
                params: {
                  billing_cycle: billingCycle,
                  plan_type: 'pro',
                  value: priceInDollars,
                  currency: 'USD',
                  subscription_id: subscription.id,
                },
              },
              {
                name: 'purchase',
                params: {
                  billing_cycle: billingCycle,
                  plan_type: 'pro',
                  value: priceInDollars,
                  currency: 'USD',
                },
              },
            ]).catch(() => {}); // Fire-and-forget, never block the webhook
          } catch (error) {
            console.error('Error fetching subscription in webhook:', error);
            // Fallback: use current date as start and clear end date (user is re-subscribing)
            const userBeforeUpdate = await User.findById(userId).lean();
            const wasFreeUser = userBeforeUpdate && userBeforeUpdate.plan === 'free';
            
            await User.findByIdAndUpdate(userId, {
              plan: 'pro',
              stripeSubscriptionId: typeof session.subscription === 'string' ? session.subscription : session.subscription.id,
              billingCycle: billingCycle,
              subscriptionStartDate: new Date(), // Fallback to current date
              subscriptionEndDate: null, // Clear any stale end date from previous cancellation
            });
            
            // Track conversion event (if user was previously on free plan)
            if (wasFreeUser) {
              // Find the user's most recent paywall event to determine their variant
              const PaywallEventModel = (await import('@/models/PaywallEvent')).default;
              const recentPaywallEvent = await PaywallEventModel.findOne({
                userId: userId,
                eventType: { $in: ['paywall_view', 'preview_view', 'export_attempt'] },
              })
                .sort({ createdAt: -1 })
                .lean();
              
              // Use the variant from their most recent paywall event, or default to variant_a
              const userVariant = (recentPaywallEvent && 'variant' in recentPaywallEvent && (recentPaywallEvent.variant === 'variant_a' || recentPaywallEvent.variant === 'variant_b'))
                ? recentPaywallEvent.variant
                : 'variant_a';
              await trackPaywallEvent(userId, userVariant, 'conversion', 'checkout_completed');
            }

            // Fire GA4 server-side event (fallback path)
            sendGA4ServerEvent(userId, userId, [
              {
                name: 'subscription_started',
                params: {
                  billing_cycle: billingCycle,
                  plan_type: 'pro',
                  value: 0,
                  currency: 'USD',
                  subscription_id: typeof session.subscription === 'string' ? session.subscription : session.subscription.id,
                },
              },
            ]).catch(() => {});
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as any;
        const customerId = subscription.customer;
        const user = await User.findOne({ stripeCustomerId: customerId });
        
        if (!user) {
          console.log(`⚠️ User not found for customer ${customerId}`);
          break;
        }

        // Handle different subscription statuses
        switch (subscription.status) {
          case 'active':
          case 'trialing': {
            // Keep user on Pro or Team plan (both are paying plans)
            const subscriptionStart = new Date(subscription.created * 1000);
            const isPayingPlan = user.plan === 'pro' || user.plan === 'team';
            const hadGracePeriod = !!user.paymentGraceDeadline;
            if (!isPayingPlan || !user.subscriptionStartDate) {
              user.plan = 'pro';
              user.stripeSubscriptionId = subscription.id;
              user.subscriptionStartDate = subscriptionStart;
              user.subscriptionEndDate = null;
              user.paymentGraceDeadline = null;
              await user.save();
              console.log(`✅ Updated user ${user._id} to pro plan (active) with subscription dates`);
            } else if (user.subscriptionEndDate || hadGracePeriod) {
              user.subscriptionEndDate = null;
              user.paymentGraceDeadline = null;
              await user.save();
              if (hadGracePeriod) {
                console.log(`✅ Payment recovered for user ${user._id}, grace period cleared`);
              }
            }
            break;
          }
          
          case 'past_due':
          case 'unpaid': {
            // Start grace period — keep user on Pro for GRACE_PERIOD_DAYS before downgrade
            const isPayingPlanPastDue = user.plan === 'pro' || user.plan === 'team';
            if (isPayingPlanPastDue && !user.paymentGraceDeadline) {
              const deadline = new Date();
              deadline.setDate(deadline.getDate() + GRACE_PERIOD_DAYS);
              user.paymentGraceDeadline = deadline;
              await user.save();
              console.log(`⚠️ Grace period started for user ${user._id} until ${deadline.toISOString()} (${subscription.status})`);

              sendPaymentFailedEmail(user.email, user.name, deadline).catch((err) => {
                console.error(`[email] Failed to send payment failed email to ${user.email}:`, err);
              });
            }
            break;
          }
          
          case 'canceled':
          case 'incomplete':
          case 'incomplete_expired': {
            const canceledAt = subscription.canceled_at 
              ? new Date(subscription.canceled_at * 1000)
              : new Date();
            user.plan = 'free';
            user.stripeSubscriptionId = undefined;
            user.subscriptionEndDate = canceledAt;
            user.paymentGraceDeadline = null;
            await user.save();
            console.log(`⬇️ Downgraded user ${user._id} to free plan (${subscription.status}) with end date`);
            break;
          }
          
          default:
            console.log(`⚠️ Unhandled subscription status: ${subscription.status} for user ${user._id}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;
        const customerId = subscription.customer;
        const user = await User.findOne({ stripeCustomerId: customerId });
        
        if (user) {
          const canceledAt = subscription.canceled_at 
            ? new Date(subscription.canceled_at * 1000)
            : new Date();
          user.plan = 'free';
          user.stripeSubscriptionId = undefined;
          user.subscriptionEndDate = canceledAt;
          user.paymentGraceDeadline = null;
          await user.save();
          console.log(`⬇️ Downgraded user ${user._id} to free plan with end date`);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any;
        const customerId = invoice.customer;
        if (!customerId) break;

        // Only act on subscription invoices (not one-off invoices)
        if (!invoice.subscription) break;

        const user = await User.findOne({ stripeCustomerId: customerId });
        if (!user) {
          console.log(`⚠️ User not found for customer ${customerId} (invoice.payment_failed)`);
          break;
        }

        const isPayingPlan = user.plan === 'pro' || user.plan === 'team';
        if (isPayingPlan && !user.paymentGraceDeadline) {
          const deadline = new Date();
          deadline.setDate(deadline.getDate() + GRACE_PERIOD_DAYS);
          user.paymentGraceDeadline = deadline;
          await user.save();
          console.log(`⚠️ Invoice payment failed for user ${user._id}, grace period until ${deadline.toISOString()}`);

          sendPaymentFailedEmail(user.email, user.name, deadline).catch((err) => {
            console.error(`[email] Failed to send payment failed email to ${user.email}:`, err);
          });
        }
        break;
      }

      case 'charge.refunded': {
        // Refunding a charge doesn't cancel the subscription in Stripe, so we need to
        // downgrade the user when a refund is issued (e.g. support refund).
        const charge = event.data.object as any;
        const customerId = charge.customer;
        if (!customerId) break;

        const user = await User.findOne({ stripeCustomerId: customerId });
        if (!user) {
          console.log(`⚠️ User not found for customer ${customerId} (charge.refunded)`);
          break;
        }

        if (user.plan === 'pro' || user.plan === 'team') {
          user.plan = 'free';
          user.stripeSubscriptionId = undefined;
          user.subscriptionEndDate = new Date();
          user.paymentGraceDeadline = null;
          await user.save();
          console.log(`⬇️ Downgraded user ${user._id} to free plan (charge refunded)`);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
