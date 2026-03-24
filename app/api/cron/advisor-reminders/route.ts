import { NextRequest, NextResponse } from 'next/server';
import { sendAdvisorReminders } from '@/lib/advisor-reminder';

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error('[cron] CRON_SECRET env var not configured');
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await sendAdvisorReminders();
    console.info('[cron] Advisor reminders complete', result);
    return NextResponse.json({ success: true, ...result }, { status: 200 });
  } catch (error) {
    console.error('[cron] Advisor reminders failed:', error);
    return NextResponse.json({ error: 'Failed to send advisor reminders' }, { status: 500 });
  }
}
