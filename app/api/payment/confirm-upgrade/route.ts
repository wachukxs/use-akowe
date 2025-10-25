import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';
import { stripe } from '@/lib/stripe';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'No session ID provided' }, { status: 400 });
    }

    await connectDB();

    // Get the checkout session from Stripe
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);

    // Get the user
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // If payment was successful and user is not already pro, update to pro
    if (checkoutSession.payment_status === 'paid' && user.plan !== 'pro') {
      user.plan = 'pro';
      // Save billing cycle from metadata
      const billingCycle = checkoutSession.metadata?.billingCycle || 'monthly';
      user.billingCycle = billingCycle as 'monthly' | 'annual';
      if (checkoutSession.subscription) {
        user.stripeSubscriptionId = typeof checkoutSession.subscription === 'string' 
          ? checkoutSession.subscription 
          : checkoutSession.subscription.id;
      }
      await user.save();
      console.log(`✅ Updated user ${user._id} to pro plan (${billingCycle}) via confirmation`);
      
      // Trigger a session update by calling the internal NextAuth update
      // This is done by returning a flag that the client can use
      return NextResponse.json({ 
        success: true,
        plan: user.plan,
        needsSessionUpdate: true,
      });
    }

    return NextResponse.json({ 
      success: true,
      plan: user.plan,
    });
  } catch (error) {
    console.error('Error confirming upgrade:', error);
    return NextResponse.json(
      { error: 'Failed to confirm upgrade' },
      { status: 500 }
    );
  }
}
