import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';
import { getUserUsageToday, getUserLimits } from '@/lib/usage';

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const usage = await getUserUsageToday(session.user.email);
    const limits = await getUserLimits(session.user.email);

    return NextResponse.json({
      aiWordsGenerated: usage.aiWordsGenerated,
      plagiarismChecks: usage.plagiarismChecks,
      paraphraseUses: usage.paraphraseUses || 0,
      limits,
    });
  } catch (error) {
    console.error('Error fetching usage:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

