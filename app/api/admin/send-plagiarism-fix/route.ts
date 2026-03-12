import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import DailyUsage from '@/models/DailyUsage';
import User from '@/models/User';
import { sendPlagiarismFixEmail } from '@/lib/email';
import { format, subDays } from 'date-fns';

/**
 * GET /api/admin/send-plagiarism-fix?days=3
 * Preview — shows which users would receive the email (without sending).
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const numDays = Math.min(Math.max(parseInt(searchParams.get('days') || '3', 10), 1), 30);
    const cutoffDate = format(subDays(new Date(), numDays - 1), 'yyyy-MM-dd');

    const affected = await DailyUsage.find({
      date: { $gte: cutoffDate },
      plagiarismChecks: { $exists: true },
    }).lean();

    const uniqueUserIds = [...new Set(affected.map((d) => d.userId))];

    const users = await User.find(
      { _id: { $in: uniqueUserIds } },
      { email: 1, name: 1, plan: 1 }
    ).lean();

    return NextResponse.json({
      windowDays: numDays,
      cutoffDate,
      uniqueUsers: users.length,
      users: users.map((u) => ({
        email: u.email,
        name: u.name,
        plan: u.plan,
      })),
    });
  } catch (error) {
    console.error('Error previewing plagiarism fix email recipients:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/admin/send-plagiarism-fix
 * Body: { days: number, dryRun?: boolean }
 *
 * Finds all users who had plagiarism activity in the last N days and sends
 * them the plagiarism-fix notification email.
 *
 * Set dryRun: true to preview without sending.
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const numDays = Math.min(Math.max(parseInt(body.days || '3', 10), 1), 30);
    const dryRun = body.dryRun === true;
    const cutoffDate = format(subDays(new Date(), numDays - 1), 'yyyy-MM-dd');

    const affected = await DailyUsage.find({
      date: { $gte: cutoffDate },
      plagiarismChecks: { $exists: true },
    }).lean();

    const uniqueUserIds = [...new Set(affected.map((d) => d.userId))];

    const users = await User.find(
      { _id: { $in: uniqueUserIds } },
      { email: 1, name: 1, plan: 1 }
    ).lean();

    if (dryRun) {
      return NextResponse.json({
        dryRun: true,
        windowDays: numDays,
        cutoffDate,
        uniqueUsers: users.length,
        users: users.map((u) => ({ email: u.email, name: u.name, plan: u.plan })),
        message: `Dry run: would send to ${users.length} user(s).`,
      });
    }

    const results: { email: string; status: 'sent' | 'failed'; error?: string }[] = [];

    for (const user of users) {
      try {
        await sendPlagiarismFixEmail(user.email, user.name || '');
        results.push({ email: user.email, status: 'sent' });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('[admin] Failed to send plagiarism fix email', { email: user.email, error: message });
        results.push({ email: user.email, status: 'failed', error: message });
      }
    }

    const sent = results.filter((r) => r.status === 'sent').length;
    const failed = results.filter((r) => r.status === 'failed').length;

    return NextResponse.json({
      success: true,
      windowDays: numDays,
      cutoffDate,
      totalUsers: users.length,
      sent,
      failed,
      results,
      message: `Sent to ${sent}/${users.length} user(s). ${failed > 0 ? `${failed} failed.` : ''}`.trim(),
    });
  } catch (error) {
    console.error('Error sending plagiarism fix emails:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
