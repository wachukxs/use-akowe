import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Influencer from '@/models/Influencer';
import { createWithReferralCode } from '@/lib/referral';
import { requireFullAccess } from '@/lib/admin-auth';

export async function POST(request: NextRequest) {
  try {
    const session = await requireFullAccess();
    if (!session) {
      return NextResponse.json(
        { error: 'Forbidden: full access required' },
        { status: 403 }
      );
    }

    const { name, email, notes } = await request.json();

    // Validation
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if influencer with this email already exists
    const existingInfluencer = await Influencer.findOne({
      email: email.toLowerCase(),
    });
    if (existingInfluencer) {
      return NextResponse.json(
        { error: 'An influencer with this email already exists' },
        { status: 400 }
      );
    }

    // Create new influencer with referral code, handling duplicate key errors
    const influencer = await createWithReferralCode(async (referralCode) => {
      return Influencer.create({
        name,
        email: email.toLowerCase(),
        referralCode,
        notes,
      });
    });

    return NextResponse.json(
      {
        message: 'Influencer created successfully',
        influencer: {
          _id: influencer._id.toString(),
          name: influencer.name,
          email: influencer.email,
          referralCode: influencer.referralCode,
          notes: influencer.notes,
          createdAt: influencer.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating influencer:', error);
    return NextResponse.json(
      { error: 'Failed to create influencer' },
      { status: 500 }
    );
  }
}
