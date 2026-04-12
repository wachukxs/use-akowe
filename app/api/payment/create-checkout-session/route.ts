import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';
import { stripe, getStripePriceId } from '@/lib/stripe';
import User from '@/models/User';
import WiseCheckoutAttempt from '@/models/WiseCheckoutAttempt';
import connectDB from '@/lib/mongodb';
import { shouldUseWisePaymentLinks } from '@/lib/payment-region';
import {
  appendAkoweRefToPaymentUrl,
  generateUniqueWisePaymentReference,
  getWisePaymentLinkUrl,
  wiseSkuFromPlan,
} from '@/lib/wise-payment-links';

type PaidPlanType = 'standard' | 'pro';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { billingCycle, planType = 'pro', paymentMethod } = body;

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

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // India (geo) / env: Wise payment links instead of Stripe
    // paymentMethod param lets the user override the geo-detected default
    const useWise =
      paymentMethod === 'wise' ||
      (paymentMethod !== 'stripe' && shouldUseWisePaymentLinks(request));
    if (useWise) {
      const sku = wiseSkuFromPlan(billingCycle, resolvedPlanType);
      const paymentUrl = getWisePaymentLinkUrl(sku);
      if (!paymentUrl) {
        return NextResponse.json(
          { error: 'Wise payment link not configured for this plan. Set the matching env URL.' },
          { status: 500 }
        );
      }

      const ref = await generateUniqueWisePaymentReference(async (r) => {
        const [existsUser, existsAttempt] = await Promise.all([
          User.exists({ wisePaymentReference: r }),
          WiseCheckoutAttempt.exists({ reference: r }),
        ]);
        return Boolean(existsUser || existsAttempt);
      });

      user.wisePaymentReference = ref;
      user.wisePendingPlan = resolvedPlanType;
      user.wisePendingBillingCycle = billingCycle;
      user.wisePendingSku = sku;
      await user.save();

      await WiseCheckoutAttempt.create({
        userId: user._id,
        reference: ref,
        plan: resolvedPlanType,
        billingCycle,
        sku,
        status: 'pending',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      const url = appendAkoweRefToPaymentUrl(paymentUrl, ref);

      const { createTrackingMetadata } = await import('@/lib/gtag-server');
      const tracking = createTrackingMetadata(true, 'checkout_start', {
        user_id: user._id.toString(),
        billing_cycle: billingCycle,
        plan_type: resolvedPlanType,
      });

      return NextResponse.json({
        provider: 'wise' as const,
        url,
        wisePaymentReference: ref,
        tracking,
      });
    }

    let customerId = user.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: session.user.email,
        name: user.name,
        metadata: {
          userId: user._id.toString(),
        },
      });

      customerId = customer.id;

      user.stripeCustomerId = customerId;
      await user.save();
    }

    const priceId = getStripePriceId(billingCycle, resolvedPlanType);

    if (!priceId) {
      return NextResponse.json({ error: 'Price ID not configured' }, { status: 500 });
    }

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

    const { createTrackingMetadata } = await import('@/lib/gtag-server');
    const tracking = createTrackingMetadata(true, 'checkout_start', {
      user_id: user._id.toString(),
      billing_cycle: billingCycle,
      plan_type: resolvedPlanType,
    });

    return NextResponse.json({
      provider: 'stripe' as const,
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
      tracking,
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
