import { NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/admin-auth';

export async function GET() {
  try {
    const session = await verifyAdminSession();

    if (session.authenticated) {
      return NextResponse.json({
        authenticated: true,
        role: session.role ?? 'full_access',
      });
    } else {
      return NextResponse.json(
        { authenticated: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Admin verify error:', error);
    return NextResponse.json(
      { authenticated: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
