import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import DailyUsage from '@/models/DailyUsage';
import User from '@/models/User';
import { format, subDays } from 'date-fns';

/**
 * POST /api/admin/reset-plagiarism
 *
 * Body (one of):
 *   { mode: 'bulk', days: number }   — reset all users whose checks were incremented in the last N days
 *   { mode: 'user', email: string }  — reset a single user by email (clears all their DailyUsage plagiarism counts)
 *
 * Protected by admin_session middleware.
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { mode, days, email } = body;

    if (mode === 'user') {
      if (!email) {
        return NextResponse.json({ error: 'email is required for user mode' }, { status: 400 });
      }

      const user = await User.findOne({ email: email.trim().toLowerCase() }).lean();
      if (!user) {
        return NextResponse.json({ error: `No user found with email: ${email}` }, { status: 404 });
      }

      const userId = (user._id as { toString(): string }).toString();

      const result = await DailyUsage.updateMany(
        { userId, plagiarismChecks: { $gt: 0 } },
        { $set: { plagiarismChecks: 0 } }
      );

      return NextResponse.json({
        success: true,
        mode: 'user',
        email,
        docsModified: result.modifiedCount,
        message: `Reset plagiarism checks for ${email} across ${result.modifiedCount} day(s).`,
      });
    }

    if (mode === 'bulk') {
      const numDays = Math.min(Math.max(parseInt(days || '3', 10), 1), 30);
      const cutoffDate = format(subDays(new Date(), numDays - 1), 'yyyy-MM-dd');

      // Find all DailyUsage docs in the window that have plagiarism counts > 0
      const affected = await DailyUsage.find({
        date: { $gte: cutoffDate },
        plagiarismChecks: { $gt: 0 },
      }).lean();

      if (affected.length === 0) {
        return NextResponse.json({
          success: true,
          mode: 'bulk',
          docsModified: 0,
          uniqueUsers: 0,
          message: `No plagiarism checks found in the last ${numDays} day(s).`,
        });
      }

      const result = await DailyUsage.updateMany(
        { date: { $gte: cutoffDate }, plagiarismChecks: { $gt: 0 } },
        { $set: { plagiarismChecks: 0 } }
      );

      const uniqueUserIds = new Set(affected.map((d) => d.userId));

      return NextResponse.json({
        success: true,
        mode: 'bulk',
        windowDays: numDays,
        cutoffDate,
        docsModified: result.modifiedCount,
        uniqueUsers: uniqueUserIds.size,
        message: `Reset plagiarism checks for ${uniqueUserIds.size} user(s) across ${result.modifiedCount} day record(s) (last ${numDays} days).`,
      });
    }

    return NextResponse.json({ error: 'mode must be "bulk" or "user"' }, { status: 400 });
  } catch (error) {
    console.error('Error resetting plagiarism checks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/admin/reset-plagiarism?days=3
 * Preview — shows who would be affected without making changes.
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const numDays = Math.min(Math.max(parseInt(searchParams.get('days') || '3', 10), 1), 30);
    const cutoffDate = format(subDays(new Date(), numDays - 1), 'yyyy-MM-dd');

    const affected = await DailyUsage.find({
      date: { $gte: cutoffDate },
      plagiarismChecks: { $gt: 0 },
    }).lean();

    const uniqueUserIds = [...new Set(affected.map((d) => d.userId))];

    // Look up user emails for display
    const users = await User.find(
      { _id: { $in: uniqueUserIds } },
      { email: 1, plan: 1 }
    ).lean();

    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    const breakdown = affected.map((d) => ({
      userId: d.userId,
      email: userMap.get(d.userId)?.email ?? '(unknown)',
      plan: userMap.get(d.userId)?.plan ?? '(unknown)',
      date: d.date,
      plagiarismChecks: d.plagiarismChecks,
    }));

    return NextResponse.json({
      windowDays: numDays,
      cutoffDate,
      totalDocs: affected.length,
      uniqueUsers: uniqueUserIds.length,
      breakdown,
    });
  } catch (error) {
    console.error('Error previewing plagiarism reset:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
