import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import EmailSuppression from '@/models/EmailSuppression';

/**
 * GET /api/admin/email-suppression?email=...
 * Check if a user is on the suppression list.
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email')?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ error: 'email query param is required' }, { status: 400 });
    }

    const record = await EmailSuppression.findOne({ email }).lean();

    if (!record) {
      return NextResponse.json({ suppressed: false, email });
    }

    return NextResponse.json({
      suppressed: true,
      email,
      reason: record.reason,
      suppressedAt: record.suppressedAt,
    });
  } catch (error) {
    console.error('Error checking suppression:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/email-suppression
 * Body: { email: string }
 * Removes a user from the suppression list so they receive emails again.
 */
export async function DELETE(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const email = body.email?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ error: 'email is required' }, { status: 400 });
    }

    const result = await EmailSuppression.deleteOne({ email });

    if (result.deletedCount === 0) {
      return NextResponse.json({
        success: true,
        email,
        message: `${email} was not on the suppression list.`,
      });
    }

    return NextResponse.json({
      success: true,
      email,
      message: `Removed ${email} from the suppression list. They will receive emails again.`,
    });
  } catch (error) {
    console.error('Error removing suppression:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
