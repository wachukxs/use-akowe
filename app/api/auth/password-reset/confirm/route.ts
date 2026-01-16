import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import PasswordResetToken from '@/models/PasswordResetToken';
import { verifyPasswordResetToken } from '@/lib/password-reset';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    const { email, token, password } = await request.json();

    if (!email || !token || !password) {
      return NextResponse.json(
        { error: 'Email, token, and new password are required' },
        { status: 400 }
      );
    }

    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    await connectDB();

    const tokenRecord = await verifyPasswordResetToken(token, email);

    if (!tokenRecord) {
      return NextResponse.json(
        { error: 'Reset link is invalid or has expired' },
        { status: 400 }
      );
    }

    const user = await User.findOne({
      _id: tokenRecord.userId,
      email: email.toLowerCase(),
    });

    if (!user) {
      await PasswordResetToken.deleteMany({ userId: tokenRecord.userId });
      return NextResponse.json(
        { error: 'Account not found for this reset link' },
        { status: 400 }
      );
    }

    user.password = password;
    await user.save(); // pre-save hook will hash password

    // Remove all outstanding reset tokens for this user
    await PasswordResetToken.deleteMany({ userId: user._id });

    return NextResponse.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password reset confirm failed:', error);
    return NextResponse.json(
      { error: 'Unable to reset password at this time' },
      { status: 500 }
    );
  }
}
