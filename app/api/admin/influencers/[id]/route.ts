import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import Influencer from '@/models/Influencer';
import User from '@/models/User';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid influencer ID' },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if influencer exists
    const influencer = await Influencer.findById(id);
    if (!influencer) {
      return NextResponse.json(
        { error: 'Influencer not found' },
        { status: 404 }
      );
    }

    // Check if there are users referred by this influencer
    const referredUsersCount = await User.countDocuments({
      referredByInfluencer: new mongoose.Types.ObjectId(id),
    });

    // Delete the influencer
    await Influencer.findByIdAndDelete(id);

    // Note: We don't delete the referredByInfluencer reference from users
    // This preserves the historical record that they were referred,
    // but the influencer details won't be available anymore

    return NextResponse.json({
      message: 'Influencer deleted successfully',
      referredUsersCount,
      note:
        referredUsersCount > 0
          ? `${referredUsersCount} user(s) were referred by this influencer. Their referral history has been preserved.`
          : undefined,
    });
  } catch (error) {
    console.error('Error deleting influencer:', error);
    return NextResponse.json(
      { error: 'Failed to delete influencer' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    // Get users referred by this influencer
    const referredUsers = await User.find({
      referredByInfluencer: new mongoose.Types.ObjectId(id),
    })
      .select('name email plan createdAt')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      influencer: {
        _id: influencer._id.toString(),
        name: influencer.name,
        email: influencer.email,
        referralCode: influencer.referralCode,
        notes: influencer.notes,
        createdAt: influencer.createdAt,
      },
      referredUsers: referredUsers.map((user) => ({
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        plan: user.plan,
        createdAt: user.createdAt,
      })),
      referralCount: referredUsers.length,
    });
  } catch (error) {
    console.error('Error fetching influencer:', error);
    return NextResponse.json(
      { error: 'Failed to fetch influencer' },
      { status: 500 }
    );
  }
}
