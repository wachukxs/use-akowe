import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';
import { stripe, getStripePriceId } from '@/lib/stripe';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

const baseUrl = () => process.env.NEXTAUTH_URL || 'http://localhost:3000';

export async function POST(request: NextRequest) {
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

    // Optional billing cycle for resubscribe (when we send them to Checkout instead of portal)
    let billingCycle: 'monthly' | 'annual' = user.billingCycle || 'monthly';
    try {
      const body = await request.json().catch(() => ({}));
      if (body?.billingCycle === 'monthly' || body?.billingCycle === 'annual') {
        billingCycle = body.billingCycle;
      }
    } catch {
      // no body or invalid JSON
    }

    // Get or create Stripe customer (we never delete stripeCustomerId on cancel/refund,
    // but users may not have one from older flows or edge cases)
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const existing = await stripe.customers.list({
        email: session.user.email,
        limit: 1,
      });
      if (existing.data.length > 0) {
        customerId = existing.data[0].id;
        user.stripeCustomerId = customerId;
        await user.save();
      } else {
        const customer = await stripe.customers.create({
          email: session.user.email,
          name: user.name,
          metadata: { userId: user._id.toString() },
        });
        customerId = customer.id;
        user.stripeCustomerId = customerId;
        await user.save();
      }
    }

    // If user has no active subscription (e.g. refunded, canceled), Stripe portal only shows
    // invoices with no option to resubscribe. Send them to Checkout to subscribe again.
    let hasActiveSubscription = !!user.stripeSubscriptionId;
    if (user.stripeSubscriptionId) {
      try {
        const sub = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
        hasActiveSubscription = sub.status === 'active' || sub.status === 'trialing';
      } catch {
        hasActiveSubscription = false;
      }
    }
    if (!hasActiveSubscription) {
      const priceId = getStripePriceId(billingCycle);
      if (!priceId) {
        return NextResponse.json(
          { error: 'Price ID not configured' },
          { status: 500 }
        );
      }
      const checkoutSession = await stripe.checkout.sessions.create({
        customer: customerId,
        allow_promotion_codes: true,
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        mode: 'subscription',
        success_url: `${baseUrl()}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl()}/settings?checkout_cancelled=1`,
        metadata: {
          userId: user._id.toString(),
          userEmail: session.user.email,
          billingCycle,
        },
      });
      return NextResponse.json({
        url: checkoutSession.url,
      });
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${baseUrl()}/settings`,
    });

    return NextResponse.json({
      url: portalSession.url,
    });
  } catch (error) {
    console.error('Error creating portal session:', error);
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    );
  }
}
