import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';
import { getUserUsageToday, getUserLimits, checkPlagiarismLimit } from '@/lib/usage';

// Replace Infinity (which serializes to null in JSON) with a sentinel so the
// client can distinguish "unlimited" from "not set".
function serializeLimits(limits: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(limits)) {
    out[k] = v === Infinity ? null : v;
  }
  return out;
}

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [usage, limits, plagiarismLimitInfo] = await Promise.all([
      getUserUsageToday(session.user.email),
      getUserLimits(session.user.email),
      checkPlagiarismLimit(session.user.email),
    ]);

    // For plans with a weekly plagiarism limit, show weekly used count
    // (today's count alone is misleading — the window spans 7 days)
    const plagiarismChecksDisplay = limits.plagiarismChecksPerWeek != null
      ? (limits.plagiarismChecksPerWeek - plagiarismLimitInfo.remaining)
      : usage.plagiarismChecks;

    return NextResponse.json({
      aiWordsGenerated: usage.aiWordsGenerated,
      plagiarismChecks: plagiarismChecksDisplay,
      paraphraseUses: usage.paraphraseUses || 0,
      limits: serializeLimits(limits as unknown as Record<string, unknown>),
    });
  } catch (error) {
    console.error('Error fetching usage:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

