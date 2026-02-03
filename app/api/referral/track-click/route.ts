import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ReferralClick from '@/models/ReferralClick';
import { shouldBlockReferralClick } from '@/lib/fraud-prevention';

/**
 * Tracks a referral link click
 * This endpoint is called when a user visits a page with ?ref=CODE in the URL
 */
export async function POST(request: NextRequest) {
  try {
    const { referralCode } = await request.json();

    if (!referralCode || typeof referralCode !== 'string') {
      return NextResponse.json({ error: 'Referral code is required' }, { status: 400 });
    }

    await connectDB();

    // Check for fraud before tracking
    const fraudCheck = await shouldBlockReferralClick(request, referralCode.trim());
    if (fraudCheck.block) {
      // Log fraud attempt but don't block (silent fail to avoid revealing detection)
      console.warn('Fraudulent referral click detected:', {
        referralCode: referralCode.trim(),
        reason: fraudCheck.reason,
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      });
      // Return success to avoid revealing fraud detection
      return NextResponse.json({ success: true }, { status: 200 });
    }

    // Get user agent and IP for analytics (optional, can be removed for privacy)
    const userAgent = request.headers.get('user-agent') || undefined;
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    // Extract IP from headers (x-forwarded-for takes precedence, fallback to x-real-ip)
    const ipAddress = forwardedFor ? forwardedFor.split(',')[0].trim() : (realIp || undefined);

    // Create click record (fire-and-forget, don't block the user)
    await ReferralClick.create({
      referralCode: referralCode.trim(),
      clickedAt: new Date(),
      userAgent,
      ipAddress,
      converted: false,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    // Don't block the user flow if click tracking fails
    console.error('Error tracking referral click:', error);
    return NextResponse.json({ success: false, error: 'Failed to track click' }, { status: 500 });
  }
}
