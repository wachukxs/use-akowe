import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ReferralClick from '@/models/ReferralClick';
import User from '@/models/User';
import { lookupReferralCode } from '@/lib/referral';

/**
 * Public API to get affiliate stats for a referral code or link
 * Returns click count, signup count, and conversion rate
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const input = searchParams.get('code') || searchParams.get('link');

    if (!input) {
      return NextResponse.json({ error: 'Referral code or link is required' }, { status: 400 });
    }

    // Extract referral code from input (handles both code and full URL)
    let referralCode: string;
    
    // If it's a URL, extract the ref parameter
    if (input.includes('?ref=') || input.includes('&ref=')) {
      try {
        // Try parsing as URL (add protocol if missing)
        const urlString = input.startsWith('http') ? input : `https://${input}`;
        const url = new URL(urlString);
        referralCode = url.searchParams.get('ref') || '';
      } catch (error) {
        // If URL parsing fails, try extracting manually
        const match = input.match(/[?&]ref=([^&]+)/);
        referralCode = match ? match[1] : '';
      }
    } else {
      // Assume it's just a referral code
      referralCode = input.trim();
    }

    if (!referralCode) {
      return NextResponse.json({ error: 'Invalid referral code or link' }, { status: 400 });
    }

    await connectDB();

    // Verify the referral code exists (in User or Influencer collection)
    const referrer = await lookupReferralCode(referralCode);
    if (!referrer) {
      return NextResponse.json({ error: 'Referral code not found' }, { status: 404 });
    }

    // Count clicks for this referral code
    const clickCount = await ReferralClick.countDocuments({ referralCode });

    // Count signups for this referral code
    let signupCount = 0;
    if (referrer.type === 'user') {
      signupCount = await User.countDocuments({ referredBy: referrer.id });
    } else if (referrer.type === 'influencer') {
      signupCount = await User.countDocuments({ referredByInfluencer: referrer.id });
    }

    // Calculate conversion rate
    const conversionRate = clickCount > 0 ? ((signupCount / clickCount) * 100).toFixed(1) : '0.0';

    return NextResponse.json({
      referralCode,
      clicks: clickCount,
      signups: signupCount,
      conversionRate: `${conversionRate}%`,
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching affiliate stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
