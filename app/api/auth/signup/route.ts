import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { createWithReferralCode, lookupReferralCode } from '@/lib/referral';
import { sendWelcomeEmail } from '@/lib/email';
import { markLeadAsConverted } from '@/lib/lead-conversion';
import { markReferralClicksAsConverted } from '@/lib/referral-click-conversion';
import { shouldBlockSignup, getIpAddress } from '@/lib/fraud-prevention';

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, referralCode } = await request.json();

    // Validation
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    if (name.trim().length < 2) {
      return NextResponse.json({ error: 'Name must be at least 2 characters' }, { status: 400 });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    await connectDB();

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json({ error: 'An account with this email already exists. Please sign in instead.' }, { status: 400 });
    }

    // Check for fraud before proceeding with signup
    const fraudCheck = await shouldBlockSignup(request, email.toLowerCase(), referralCode);
    if (fraudCheck.block) {
      // Log fraud attempt
      console.warn('Fraudulent signup attempt blocked:', {
        email: email.toLowerCase(),
        referralCode,
        reason: fraudCheck.reason,
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      });
      // Return generic error to avoid revealing fraud detection
      return NextResponse.json({ error: 'Unable to create account. Please try again later.' }, { status: 400 });
    }

    // Look up referral code if provided
    let referredBy = undefined;
    let referredByInfluencer = undefined;
    
    if (referralCode) {
      const referrer = await lookupReferralCode(referralCode);
      if (referrer) {
        if (referrer.type === 'user') {
          referredBy = referrer.id;
        } else {
          referredByInfluencer = referrer.id;
        }
      }
      // If referral code is invalid, we silently ignore it and continue signup
    }

    // Extract IP address for fraud investigation audit trail
    const signupIp = getIpAddress(request);

    // Create new user with referral tracking
    // Uses createWithReferralCode to handle duplicate key errors gracefully
    const user = await createWithReferralCode(async (newReferralCode) => {
      return User.create({
        name,
        email: email.toLowerCase(),
        password, // Password will be hashed by the pre-save hook
        plan: 'free',
        referralCode: newReferralCode,
        referredBy,
        referredByInfluencer,
        ...(signupIp && { signupIp }),
      });
    });

    // Fire-and-forget welcome email; don't block signup if email fails
    sendWelcomeEmail(user.email, user.name).catch(err => {
      console.error('Welcome email failed:', err);
    });

    // Mark any leads as converted (fire-and-forget, don't block signup)
    markLeadAsConverted(user.email, user._id.toString(), user.createdAt).catch(err => {
      console.error('Lead conversion tracking failed:', err);
    });

    // Mark referral clicks as converted if user signed up with a referral code (fire-and-forget)
    if (referralCode) {
      markReferralClicksAsConverted(referralCode, user.createdAt).catch(err => {
        console.error('Referral click conversion tracking failed:', err);
      });
    }

    return NextResponse.json({ 
      message: 'User created successfully',
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        plan: user.plan,
        referralCode: user.referralCode,
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Sign up error:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
