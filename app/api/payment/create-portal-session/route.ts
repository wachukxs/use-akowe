import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';
import { stripe } from '@/lib/stripe';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function POST() {
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

    // Get or create Stripe customer (we never delete stripeCustomerId on cancel/refund,
    // but users may not have one from older flows or edge cases)
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      // Try to find existing Stripe customer by email (e.g. from a previous payment/refund)
      const existing = await stripe.customers.list({
        email: session.user.email,
        limit: 1,
      });
      if (existing.data.length > 0) {
        console.log('Found existing Stripe customer:', existing.data[0].id);
        customerId = existing.data[0].id;
        user.stripeCustomerId = customerId;
        await user.save();
      } else {
        const customer = await stripe.customers.create({
          email: session.user.email,
          name: user.name,
          metadata: {
            userId: user._id.toString(),
          },
        });
        console.log('Created new Stripe customer:', customer.id);
        customerId = customer.id;
        user.stripeCustomerId = customerId;
        await user.save();
      }
    }

    // Create a billing portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/settings`,
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
