import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { buildPasswordResetUrl, createPasswordResetToken } from '@/lib/password-reset';
import { sendPasswordResetEmail } from '@/lib/email';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || !emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findOne({ email: email.toLowerCase() });

    // Always respond with success message to avoid account enumeration
    const genericResponse = NextResponse.json({
      message: 'If we find an account for that email, a reset link will be sent.',
    });

    if (!user) {
      console.log('User found for email:', email);
      return genericResponse;
    }

    const { token, expiresAt } = await createPasswordResetToken(
      user._id.toString(),
      user.email
    );

    const resetUrl = buildPasswordResetUrl(user.email, token);

    await sendPasswordResetEmail(user.email, resetUrl, expiresAt);

    return genericResponse;
  } catch (error) {
    console.error('Password reset request failed:', error);
    return NextResponse.json(
      { error: 'Unable to process password reset request' },
      { status: 500 }
    );
  }
}
