/**
 * Stripe Webhook Handler
 *
 * Listens to:
 * - checkout.session.completed — upgrade to Pro after successful checkout, records first affiliate commission
 * - invoice.paid — records recurring affiliate commissions for up to 12 months after first payment
 * - customer.subscription.updated — sync plan when subscription status changes (active, past_due, canceled, etc.)
 * - customer.subscription.deleted — downgrade when subscription is removed
 * - charge.refunded — downgrade when a charge is refunded (refunds don’t always cancel the subscription in Stripe)
 *
 * In Stripe Dashboard: Developers → Webhooks → your endpoint → ensure these events are enabled:
 * checkout.session.completed, invoice.paid, customer.subscription.updated,
 * customer.subscription.deleted, invoice.payment_failed, charge.refunded
 */
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import AffiliateCommission from '@/models/AffiliateCommission';
import { trackPaywallEvent } from '@/lib/paywall-tracking';
import { sendGA4ServerEvent } from '@/lib/ga4-server';
import { sendPaymentFailedEmail } from '@/lib/email';

const GRACE_PERIOD_DAYS = 3;
// Commission rate: 30% of each payment for up to 12 months after the referred user's first payment
const AFFILIATE_COMMISSION_RATE = 0.30;
const AFFILIATE_COMMISSION_MONTHS = 12;

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

            // Record first-payment affiliate commission if this user was referred
            if (wasFreeUser && (userBeforeUpdate.referredBy || userBeforeUpdate.referredByInfluencer)) {
              try {
                const referrerId = userBeforeUpdate.referredBy || userBeforeUpdate.referredByInfluencer;
                const referrerType = userBeforeUpdate.referredBy ? 'user' : 'influencer';
                const Influencer = (await import('@/models/Influencer')).default;
                const referrer = referrerType === 'user'
                  ? await User.findById(referrerId).select('referralCode').lean()
                  : await Influencer.findById(referrerId).select('referralCode').lean();
                if (referrer?.referralCode) {
                  const paymentAmount = subscription.items.data[0]?.price?.unit_amount || 0;
                  const commissionAmount = Math.round(paymentAmount * AFFILIATE_COMMISSION_RATE);
                  // Retrieve the invoice ID for this first payment — used as unique key
                  const latestInvoiceId = typeof subscription.latest_invoice === 'string'
                    ? subscription.latest_invoice
                    : (subscription.latest_invoice as any)?.id || session.id;
                  await AffiliateCommission.create({
                    referralCode: referrer.referralCode,
                    referrerId,
                    referrerType,
                    referredUserId: userId,
                    stripeInvoiceId: latestInvoiceId,
                    stripeSessionId: session.id,
                    stripeSubscriptionId: subscription.id,
                    billingCycle,
                    commissionMonth: 1,
                    billingReason: 'subscription_create',
                    paymentAmount,
                    commissionRate: AFFILIATE_COMMISSION_RATE,
                    commissionAmount,
                    status: 'pending',
                  });
                  console.log(`💰 Affiliate commission (month 1) recorded: $${commissionAmount / 100} for code ${referrer.referralCode}`);
                }
              } catch (commissionError) {
                // Never block the webhook for commission errors
                console.error('Error recording affiliate commission:', commissionError);
              }
            }

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

        // Cancel the pending affiliate commission tied to this specific charge's invoice.
        // A refund means the payment was reversed — the commission was not actually earned.
        if (charge.invoice) {
          const cancelled = await AffiliateCommission.findOneAndUpdate(
            { stripeInvoiceId: charge.invoice, status: 'pending' },
            { status: 'cancelled' }
          );
          if (cancelled) {
            console.log(`❌ Affiliate commission cancelled for refunded invoice ${charge.invoice}`);
          }
        }
        break;
      }

      case 'invoice.paid': {
        // Fires for every paid invoice — first payment AND renewals.
        // We only process 'subscription_cycle' here because 'subscription_create'
        // is already handled by checkout.session.completed above.
        const invoice = event.data.object as any;
        if (invoice.billing_reason !== 'subscription_cycle') break;
        if (!invoice.subscription || !invoice.customer) break;

        const user = await User.findOne({ stripeCustomerId: invoice.customer });
        if (!user) {
          console.log(`⚠️ User not found for customer ${invoice.customer} (invoice.paid renewal)`);
          break;
        }

        // Only credit commission if the user was referred
        if (!user.referredBy && !user.referredByInfluencer) break;

        // Check we are still within the 12-month commission window
        const subscriptionStart = user.subscriptionStartDate;
        if (!subscriptionStart) break;
        const monthsElapsed =
          (new Date().getFullYear() - subscriptionStart.getFullYear()) * 12 +
          (new Date().getMonth() - subscriptionStart.getMonth());
        if (monthsElapsed >= AFFILIATE_COMMISSION_MONTHS) {
          console.log(`ℹ️ Affiliate commission window expired for user ${user._id} (${monthsElapsed} months)`);
          break;
        }

        try {
          const referrerId = user.referredBy || user.referredByInfluencer;
          const referrerType = user.referredBy ? 'user' : 'influencer';
          const Influencer = (await import('@/models/Influencer')).default;
          const referrer = referrerType === 'user'
            ? await User.findById(referrerId).select('referralCode').lean()
            : await Influencer.findById(referrerId).select('referralCode').lean();
          if (!referrer?.referralCode) break;

          // commissionMonth = how many commissions already exist for this user + 1
          const existingCount = await AffiliateCommission.countDocuments({ referredUserId: user._id });
          const commissionMonth = existingCount + 1;

          // Guard: never exceed 12 months even if somehow we missed the window check
          if (commissionMonth > AFFILIATE_COMMISSION_MONTHS) break;

          const paymentAmount = invoice.amount_paid || 0;
          const commissionAmount = Math.round(paymentAmount * AFFILIATE_COMMISSION_RATE);

          await AffiliateCommission.create({
            referralCode: referrer.referralCode,
            referrerId,
            referrerType,
            referredUserId: user._id,
            stripeInvoiceId: invoice.id,
            stripeSubscriptionId: typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription.id,
            billingCycle: user.billingCycle || 'monthly',
            commissionMonth,
            billingReason: 'subscription_cycle',
            paymentAmount,
            commissionRate: AFFILIATE_COMMISSION_RATE,
            commissionAmount,
            status: 'pending',
          });
          console.log(`💰 Affiliate commission (month ${commissionMonth}) recorded: $${commissionAmount / 100} for code ${referrer.referralCode}`);
        } catch (commissionError) {
          // Never block the webhook for commission errors
          console.error('Error recording renewal affiliate commission:', commissionError);
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
