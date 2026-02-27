import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ReferralClick from '@/models/ReferralClick';
import User from '@/models/User';
import AffiliateCommission from '@/models/AffiliateCommission';
import { lookupReferralCode } from '@/lib/referral';

/**
 * Public API to get affiliate stats for a referral code or link
 * Returns click count, signup count, and conversion rate for a specific month
 * Defaults to current month if no month/year specified
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const input = searchParams.get('code') || searchParams.get('link');
    const monthParam = searchParams.get('month'); // 1-12
    const yearParam = searchParams.get('year'); // YYYY

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
      } catch {
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

    // Determine which month/year to show stats for (defaults to current month)
    const now = new Date();
    const year = yearParam ? parseInt(yearParam, 10) : now.getFullYear();
    const month = monthParam ? parseInt(monthParam, 10) - 1 : now.getMonth(); // monthParam is 1-12, Date uses 0-11

    // Validate month/year
    if (isNaN(year) || year < 2020 || year > 2100) {
      return NextResponse.json({ error: 'Invalid year' }, { status: 400 });
    }
    if (isNaN(month) || month < 0 || month > 11) {
      return NextResponse.json({ error: 'Invalid month (must be 1-12)' }, { status: 400 });
    }

    // Calculate start and end of the selected month
    const monthStart = new Date(year, month, 1, 0, 0, 0, 0);
    const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999); // Last day of month

    // Count clicks for this referral code within the selected month
    const clickCount = await ReferralClick.countDocuments({
      referralCode,
      clickedAt: {
        $gte: monthStart,
        $lte: monthEnd,
      },
    });

    // Count signups for this referral code within the selected month
    let signupCount = 0;
    if (referrer.type === 'user') {
      signupCount = await User.countDocuments({
        referredBy: referrer.id,
        createdAt: {
          $gte: monthStart,
          $lte: monthEnd,
        },
      });
    } else if (referrer.type === 'influencer') {
      signupCount = await User.countDocuments({
        referredByInfluencer: referrer.id,
        createdAt: {
          $gte: monthStart,
          $lte: monthEnd,
        },
      });
    }

    // Count paid conversions and total commission for this referral code within the selected month
    const commissionAgg = await AffiliateCommission.aggregate([
      {
        $match: {
          referralCode,
          status: { $ne: 'cancelled' },
          createdAt: { $gte: monthStart, $lte: monthEnd },
        },
      },
      {
        $group: {
          _id: null,
          paidConversions: { $sum: 1 },
          totalCommissionCents: { $sum: '$commissionAmount' },
          totalRevenueCents: { $sum: '$paymentAmount' },
        },
      },
    ]);

    const commissionData = commissionAgg[0] || { paidConversions: 0, totalCommissionCents: 0, totalRevenueCents: 0 };
    const paidConversions: number = commissionData.paidConversions;
    const commissionEarnedDollars = (commissionData.totalCommissionCents / 100).toFixed(2);
    const totalRevenueDollars = (commissionData.totalRevenueCents / 100).toFixed(2);

    // All-time totals (across all months)
    const allTimeAgg = await AffiliateCommission.aggregate([
      {
        $match: {
          referralCode,
          status: { $ne: 'cancelled' },
        },
      },
      {
        $group: {
          _id: null,
          totalPaidConversions: { $sum: 1 },
          totalCommissionCents: { $sum: '$commissionAmount' },
        },
      },
    ]);
    const allTime = allTimeAgg[0] || { totalPaidConversions: 0, totalCommissionCents: 0 };

    // Calculate conversion rate
    const conversionRate = clickCount > 0 ? ((signupCount / clickCount) * 100).toFixed(1) : '0.0';

    // Format month name for display
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'];
    const monthName = monthNames[month];

    return NextResponse.json({
      referralCode,
      clicks: clickCount,
      signups: signupCount,
      paidConversions,
      conversionRate: `${conversionRate}%`,
      commissionEarned: `$${commissionEarnedDollars}`,
      revenueGenerated: `$${totalRevenueDollars}`,
      allTime: {
        paidConversions: allTime.totalPaidConversions,
        commissionEarned: `$${(allTime.totalCommissionCents / 100).toFixed(2)}`,
      },
      month: month + 1, // Return 1-12 for consistency
      year,
      monthName,
      period: `${monthName} ${year}`,
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching affiliate stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
