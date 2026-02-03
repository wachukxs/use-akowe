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
            
            await User.findByIdAndUpdate(userId, {
              plan: 'pro',
              stripeSubscriptionId: subscription.id,
              billingCycle: billingCycle,
              subscriptionStartDate: new Date(subscription.created * 1000),
              subscriptionEndDate: null, // Active subscription
            });
            console.log(`✅ Updated user ${userId} to pro plan (${billingCycle}) with subscription start date`);
            
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
          } catch (error) {
            console.error('Error fetching subscription in webhook:', error);
            // Fallback: use current date as start and clear end date (user is re-subscribing)
            await User.findByIdAndUpdate(userId, {
              plan: 'pro',
              stripeSubscriptionId: typeof session.subscription === 'string' ? session.subscription : session.subscription.id,
              billingCycle: billingCycle,
              subscriptionStartDate: new Date(), // Fallback to current date
              subscriptionEndDate: null, // Clear any stale end date from previous cancellation
            });
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
          case 'trialing':
            // Keep user on Pro or Team plan (both are paying plans)
            const subscriptionStart = new Date(subscription.created * 1000);
            const isPayingPlan = user.plan === 'pro' || user.plan === 'team';
            if (!isPayingPlan || !user.subscriptionStartDate) {
              user.plan = 'pro'; // Default to pro (team plan would need separate handling if needed)
              user.stripeSubscriptionId = subscription.id;
              user.subscriptionStartDate = subscriptionStart;
              user.subscriptionEndDate = null; // Active subscription - use null for consistency with schema
              await user.save();
              console.log(`✅ Updated user ${user._id} to pro plan (active) with subscription dates`);
            } else if (user.subscriptionEndDate) {
              // If user already has a paying plan but subscriptionEndDate is set, clear it (re-activated)
              user.subscriptionEndDate = null;
              await user.save();
            }
            break;
          
          case 'past_due':
          case 'unpaid':
            // Downgrade user but keep subscription ID for retry
            const isPayingPlanPastDue = user.plan === 'pro' || user.plan === 'team';
            if (isPayingPlanPastDue) {
              user.plan = 'free';
              // Don't set end date yet - subscription might recover
              await user.save();
              console.log(`⚠️ Downgraded user ${user._id} to free plan (${subscription.status})`);
            }
            break;
          
          case 'canceled':
          case 'incomplete':
          case 'incomplete_expired':
            // Downgrade and clear subscription ID, set end date
            const canceledAt = subscription.canceled_at 
              ? new Date(subscription.canceled_at * 1000)
              : new Date();
            user.plan = 'free';
            user.stripeSubscriptionId = undefined;
            user.subscriptionEndDate = canceledAt;
            await user.save();
            console.log(`⬇️ Downgraded user ${user._id} to free plan (${subscription.status}) with end date`);
            break;
          
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
          await user.save();
          console.log(`⬇️ Downgraded user ${user._id} to free plan with end date`);
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
