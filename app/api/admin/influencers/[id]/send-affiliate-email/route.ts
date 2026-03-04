import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import Influencer from '@/models/Influencer';
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
        { error: 'Invalid influencer ID' },
        { status: 400 }
      );
    }

    await connectDB();

    const influencer = await Influencer.findById(id);
    if (!influencer) {
      return NextResponse.json(
        { error: 'Influencer not found' },
        { status: 404 }
      );
    }

    await sendAffiliateApprovedEmail(
      influencer.email,
      influencer.name,
      influencer.referralCode
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[affiliate] Failed to send affiliate email to influencer:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
