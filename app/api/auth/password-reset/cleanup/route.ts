import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { cleanupExpiredPasswordTokens } from '@/lib/password-reset';

export async function POST(request: NextRequest) {
  try {
    const configuredSecret = process.env.PASSWORD_RESET_CLEANUP_SECRET;
    const providedSecret =
      request.headers.get('x-cron-secret') ||
      request.nextUrl.searchParams.get('secret');

    if (configuredSecret && configuredSecret !== providedSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const deleted = await cleanupExpiredPasswordTokens();

    return NextResponse.json({
      message: 'Cleanup complete',
      deleted,
    });
  } catch (error) {
    console.error('Password reset cleanup failed:', error);
    return NextResponse.json(
      { error: 'Cleanup failed' },
      { status: 500 }
    );
  }
}
