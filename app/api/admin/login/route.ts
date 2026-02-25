import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import connectDB from '@/lib/mongodb';
import Admin from '@/models/Admin';

const SESSION_DURATION = 24 * 60 * 60; // 24 hours in seconds

function generateSessionToken(adminId: string, role: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return Buffer.from(`admin:${adminId}:${role}:${timestamp}:${random}`).toString('base64');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    await connectDB();

    const admin = await Admin.findOne({ username: username.toLowerCase() });
    if (!admin) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    admin.lastLoginAt = new Date();
    await admin.save();

    const sessionToken = generateSessionToken(admin._id!.toString(), admin.role);
    const expiresAt = new Date(Date.now() + SESSION_DURATION * 1000);

    const cookieStore = await cookies();
    cookieStore.set('admin_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAt,
      path: '/',
    });

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      role: admin.role,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
