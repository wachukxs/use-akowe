import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Influencer from '@/models/Influencer';
import { createWithReferralCode } from '@/lib/referral';
import { requireFullAccess } from '@/lib/admin-auth';
import { sendAffiliateApprovedEmail } from '@/lib/email';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireFullAccess();
    if (!session) {
      return NextResponse.json(
        { error: 'Forbidden: full access required' },
        { status: 403 }
      );
    }

    const { id } = await params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findById(id).select('name email referralCode');
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // If the user already has an Influencer record, just resend the email
    const existingInfluencer = await Influencer.findOne({ email: user.email });
    if (existingInfluencer) {
      await sendAffiliateApprovedEmail(
        existingInfluencer.email,
        existingInfluencer.name,
        existingInfluencer.referralCode
      );
      return NextResponse.json({
        success: true,
        referralCode: existingInfluencer.referralCode,
        alreadyExisted: true,
      });
    }

    // Create a new Influencer record with a fresh code.
    // The user's existing referral code stays active for their user-type commissions.
    const influencer = await createWithReferralCode(async (referralCode) => {
      return Influencer.create({
        name: user.name,
        email: user.email,
        referralCode,
        notes: `Promoted from user referrer. User ID: ${user._id}`,
      });
    });

    await sendAffiliateApprovedEmail(user.email, user.name, influencer.referralCode);

    return NextResponse.json({
      success: true,
      referralCode: influencer.referralCode,
      alreadyExisted: false,
    });
  } catch (error) {
    console.error('[affiliate] Failed to promote user to influencer:', error);
    return NextResponse.json(
      { error: 'Failed to promote user' },
      { status: 500 }
    );
  }
}
