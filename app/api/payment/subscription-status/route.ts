import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';
import { stripe } from '@/lib/stripe';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // If user doesn't have a Stripe subscription, return current plan
    if (!user.stripeSubscriptionId || user.stripeCustomerId === undefined) {
      return NextResponse.json({
        plan: user.plan,
        status: 'active',
        needsUpdate: false,
        billingCycle: user.billingCycle || 'monthly',
      });
    }

    // Get subscription details from Stripe
    try {
      const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);

      // Determine user's plan based on subscription status
      let plan = user.plan;
      const status = subscription.status;
      let needsUpdate = false;

      // Handle different subscription statuses
      switch (subscription.status) {
        case 'active':
          if (user.plan !== 'pro') {
            plan = 'pro';
            needsUpdate = true;
          }
          break;
        case 'past_due':
        case 'unpaid':
        case 'canceled':
          if (user.plan !== 'free') {
            plan = 'free';
            needsUpdate = true;
            // Clear the subscription ID if cancelled
            if (subscription.status === 'canceled') {
              user.stripeSubscriptionId = undefined;
            }
          }
          break;
        case 'trialing':
          // Keep plan as pro during trial
          if (user.plan !== 'pro') {
            plan = 'pro';
            needsUpdate = true;
          }
          break;
      }

      // Update user in database if needed
      if (needsUpdate) {
        user.plan = plan;
        await user.save();
        console.log(`🔄 Updated user ${user._id} plan to ${plan} based on subscription status: ${subscription.status}`);
      }

      interface StripeSubscription {
        current_period_end?: number;
      }
      return NextResponse.json({
        plan,
        status,
        needsUpdate,
        billingCycle: user.billingCycle || 'monthly',
        subscriptionEnd: (subscription as StripeSubscription).current_period_end,
      });
    } catch (stripeError) {
      console.error('Error retrieving subscription from Stripe:', stripeError);
      // If subscription doesn't exist in Stripe, downgrade user
      if (user.plan !== 'free') {
        user.plan = 'free';
        user.stripeSubscriptionId = undefined;
        await user.save();
        console.log(`⬇️ Downgraded user ${user._id} to free (subscription not found in Stripe)`);
      }

      return NextResponse.json({
        plan: user.plan,
        status: 'error',
        needsUpdate: true,
        billingCycle: user.billingCycle || 'monthly',
      });
    }
  } catch (error) {
    console.error('Error checking subscription status:', error);
    return NextResponse.json(
      { error: 'Failed to check subscription status' },
      { status: 500 }
    );
  }
}
