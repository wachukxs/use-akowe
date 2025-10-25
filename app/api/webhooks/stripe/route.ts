/**
 * Stripe Webhook Handler
 * 
 * Handles Stripe webhook events to keep user subscriptions in sync:
 * - Upgrades users to Pro on successful payment
 * - Downgrades users to Free on payment failures/expiration
 * - Prevents revenue loss from failed payments
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
        
        if (userId) {
          await User.findByIdAndUpdate(userId, {
            plan: 'pro',
            stripeSubscriptionId: session.subscription,
            billingCycle: billingCycle,
          });
          console.log(`✅ Updated user ${userId} to pro plan (${billingCycle})`);
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
            // Keep user on Pro plan
            if (user.plan !== 'pro') {
              user.plan = 'pro';
              user.stripeSubscriptionId = subscription.id;
              await user.save();
              console.log(`✅ Updated user ${user._id} to pro plan (active)`);
            }
            break;
          
          case 'past_due':
          case 'unpaid':
            // Downgrade user but keep subscription ID for retry
            if (user.plan !== 'free') {
              user.plan = 'free';
              await user.save();
              console.log(`⚠️ Downgraded user ${user._id} to free plan (${subscription.status})`);
            }
            break;
          
          case 'canceled':
          case 'incomplete':
          case 'incomplete_expired':
            // Downgrade and clear subscription ID
            user.plan = 'free';
            user.stripeSubscriptionId = undefined;
            await user.save();
            console.log(`⬇️ Downgraded user ${user._id} to free plan (${subscription.status})`);
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
          user.plan = 'free';
          user.stripeSubscriptionId = undefined;
          await user.save();
          console.log(`⬇️ Downgraded user ${user._id} to free plan`);
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
