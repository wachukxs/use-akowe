import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';
import { stripe, getStripePriceId } from '@/lib/stripe';
import User from '@/models/User';
import connectDB from '@/lib/mongodb';

type PaidPlanType = 'standard' | 'pro';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { billingCycle, planType = 'pro' } = body;

    if (!billingCycle || !['monthly', 'annual'].includes(billingCycle)) {
      return NextResponse.json(
        { error: 'Invalid billing cycle. Must be "monthly" or "annual"' },
        { status: 400 }
      );
    }

    if (!['standard', 'pro'].includes(planType)) {
      return NextResponse.json(
        { error: 'Invalid plan type. Must be "standard" or "pro"' },
        { status: 400 }
      );
    }

    const resolvedPlanType: PaidPlanType = planType as PaidPlanType;

    await connectDB();
    
    // Get or create Stripe customer
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let customerId = user.stripeCustomerId;

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: session.user.email,
        name: user.name,
        metadata: {
          userId: user._id.toString(),
        },
      });

      customerId = customer.id;
      
      // Save customer ID to user
      user.stripeCustomerId = customerId;
      await user.save();
    }

    // Get the appropriate price ID
    const priceId = getStripePriceId(billingCycle, resolvedPlanType);

    if (!priceId) {
      return NextResponse.json(
        { error: 'Price ID not configured' },
        { status: 500 }
      );
    }

    // Create checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      allow_promotion_codes: true,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/settings?checkout_cancelled=1`,
      metadata: {
        userId: user._id.toString(),
        userEmail: session.user.email,
        billingCycle: billingCycle,
        planType: resolvedPlanType,
      },
    });

    // Return tracking metadata for checkout_start
    const { createTrackingMetadata } = await import('@/lib/gtag-server');
    const tracking = createTrackingMetadata(
      true, // Always track checkout_start
      'checkout_start',
      {
        user_id: user._id.toString(),
        billing_cycle: billingCycle,
        plan_type: resolvedPlanType,
      }
    );

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
      tracking,
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
