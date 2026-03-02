import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Project from '@/models/Project';
import Activation from '@/models/Activation';
import DailyUsage from '@/models/DailyUsage';
import EmailLog, { EngagementCohort } from '@/models/EmailLog';
import {
  sendGhostSignupEmail,
  sendStuckStarterEmail,
  sendAlmostActivatedEmail,
  sendGoingIdleEmail,
  sendWinBackEmail,
} from '@/lib/email';
import { getSuppressedEmails, suppressEmail } from '@/lib/email-suppression';

const MAX_PER_COHORT = 15;
const DELAY_BETWEEN_SENDS_MS = 2_000; // 2 seconds between emails to avoid SMTP rate limits
const MAX_RUNTIME_MS = 55_000; // 55 seconds, leaving buffer for Netlify 60s timeout

const HARD_BOUNCE_PATTERNS = [
  /^5\d{2}\b/,           // 5xx SMTP status codes
  /mailbox not found/i,
  /user unknown/i,
  /no such user/i,
  /address rejected/i,
  /does not exist/i,
  /invalid recipient/i,
  /recipient rejected/i,
];

function isHardBounce(errorMessage: string): boolean {
  return HARD_BOUNCE_PATTERNS.some((p) => p.test(errorMessage));
}

interface CohortResult {
  sent: number;
  skipped: number;
  failed: number;
}

export async function POST(request: NextRequest) {
  // Bearer token auth
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error('[cron] CRON_SECRET env var not configured');
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  await connectDB();

  const now = new Date();
  const results: Record<string, CohortResult> = {};

  // Helper: get user IDs that already received a given cohort email
  async function getAlreadySent(cohort: EngagementCohort): Promise<Set<string>> {
    const logs = await EmailLog.find({ cohort, status: 'sent' }).select('userId').lean();
    return new Set(logs.map((l) => l.userId));
  }

  // Load suppressed emails once for the entire run
  const suppressedEmails = await getSuppressedEmails();

  // Helper: send emails for a cohort with de-duplication and suppression
  async function processCohort(
    cohort: EngagementCohort,
    candidates: Array<{ email: string; name: string; projectName?: string }>,
    sendFn: (to: string, name: string, projectName?: string) => Promise<{ messageId: string }>
  ): Promise<CohortResult> {
    const alreadySent = await getAlreadySent(cohort);
    const toSend = candidates.filter(
      (c) => !alreadySent.has(c.email) && !suppressedEmails.has(c.email.toLowerCase())
    );
    const batch = toSend.slice(0, MAX_PER_COHORT);

    let sent = 0;
    let failed = 0;

    for (let i = 0; i < batch.length; i++) {
      const candidate = batch[i];

      // Check timeout before each send
      if (Date.now() - startTime > MAX_RUNTIME_MS) {
        console.warn(`[cron] Approaching timeout during ${cohort}, stopping early`);
        break;
      }

      // Delay between sends to avoid SMTP rate limits (skip before first)
      if (i > 0) {
        await new Promise((resolve) => setTimeout(resolve, DELAY_BETWEEN_SENDS_MS));
      }

      try {
        const result = await sendFn(candidate.email, candidate.name, candidate.projectName);
        await EmailLog.create({
          userId: candidate.email,
          cohort,
          sentAt: now,
          status: 'sent',
          messageId: result.messageId,
        });
        sent++;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);

        // Auto-suppress on hard bounces (5xx SMTP codes, mailbox not found)
        if (isHardBounce(errorMsg)) {
          await suppressEmail(candidate.email, 'bounced', 'bounce-auto').catch(() => {});
          suppressedEmails.add(candidate.email.toLowerCase());
        }

        try {
          await EmailLog.create({
            userId: candidate.email,
            cohort,
            sentAt: now,
            status: 'failed',
            error: errorMsg,
          });
        } catch (logErr: any) {
          // Duplicate key = already logged, skip silently
          if (logErr?.code !== 11000) {
            console.error('[cron] Failed to log email failure:', logErr);
          }
        }
        failed++;
      }
    }

    return { sent, skipped: alreadySent.size, failed };
  }

  try {
    // ============================================
    // COHORT 1: ghost_signup
    // Signed up 2-3 days ago, zero projects, free plan
    // ============================================
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

    const ghostUsers = await User.find({
      plan: 'free',
      createdAt: { $gte: threeDaysAgo, $lte: twoDaysAgo },
    }).select('email name').lean();

    if (ghostUsers.length > 0) {
      const ghostEmails = ghostUsers.map((u) => u.email);
      const ghostWithProjects = new Set(
        await Project.distinct('userId', { userId: { $in: ghostEmails } })
      );
      const ghostCandidates = ghostUsers
        .filter((u) => !ghostWithProjects.has(u.email))
        .map((u) => ({ email: u.email, name: u.name }));

      results.ghost_signup = await processCohort('ghost_signup', ghostCandidates, sendGhostSignupEmail);
    } else {
      results.ghost_signup = { sent: 0, skipped: 0, failed: 0 };
    }

    if (Date.now() - startTime > MAX_RUNTIME_MS) {
      console.warn('[cron] Approaching timeout after ghost_signup, stopping');
      return NextResponse.json({ success: true, results, partial: true }, { status: 200 });
    }

    // ============================================
    // COHORT 2: stuck_starter
    // 3-5 days old, has project but <100 total words, free plan
    // ============================================
    const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

    const stuckUsers = await User.find({
      plan: 'free',
      createdAt: { $gte: fiveDaysAgo, $lte: threeDaysAgo },
    }).select('email name').lean();

    if (stuckUsers.length > 0) {
      const stuckEmails = stuckUsers.map((u) => u.email);
      const userWordCounts = await Project.aggregate([
        { $match: { userId: { $in: stuckEmails } } },
        { $group: { _id: '$userId', totalWords: { $sum: '$wordCount' } } },
      ]);

      const wordCountMap = new Map(userWordCounts.map((r: any) => [r._id, r.totalWords]));
      const usersWithProjects = new Set(userWordCounts.map((r: any) => r._id));

      // Fetch most recent project title for each stuck user (for personalised email copy)
      const stuckMostRecentProjects = await Project.aggregate([
        { $match: { userId: { $in: stuckEmails } } },
        { $sort: { createdAt: -1 } },
        { $group: { _id: '$userId', title: { $first: '$title' } } },
      ]);
      const stuckProjectNameMap = new Map(stuckMostRecentProjects.map((r: any) => [r._id, r.title as string]));

      const stuckCandidates = stuckUsers
        .filter((u) => {
          if (!usersWithProjects.has(u.email)) return false;
          return (wordCountMap.get(u.email) || 0) < 100;
        })
        .map((u) => ({ email: u.email, name: u.name, projectName: stuckProjectNameMap.get(u.email) }));

      results.stuck_starter = await processCohort('stuck_starter', stuckCandidates, sendStuckStarterEmail);
    } else {
      results.stuck_starter = { sent: 0, skipped: 0, failed: 0 };
    }

    if (Date.now() - startTime > MAX_RUNTIME_MS) {
      console.warn('[cron] Approaching timeout after stuck_starter, stopping');
      return NextResponse.json({ success: true, results, partial: true }, { status: 200 });
    }

    // ============================================
    // COHORT 3: almost_activated
    // 5-10 days old, has project + some AI usage, NOT activated, free plan
    // ============================================
    const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);

    const almostUsers = await User.find({
      plan: 'free',
      createdAt: { $gte: tenDaysAgo, $lte: fiveDaysAgo },
    }).select('email name').lean();

    if (almostUsers.length > 0) {
      const almostEmails = almostUsers.map((u) => u.email);

      const activatedRecords = await Activation.find({
        userId: { $in: almostEmails },
        isActivated: true,
      }).select('userId').lean();
      const activatedSet = new Set(activatedRecords.map((a: any) => a.userId));

      // DailyUsage.userId stores ObjectId strings, not emails — convert first
      const almostUserDocs = await User.find({
        email: { $in: almostEmails },
      }).select('_id email').lean();
      const emailToId = new Map(almostUserDocs.map((u: any) => [u.email, u._id.toString()]));
      const almostIds = [...emailToId.values()];

      const usersWithAIUsageIds = new Set(
        await DailyUsage.distinct('userId', {
          userId: { $in: almostIds },
          aiWordsGenerated: { $gt: 0 },
        })
      );
      // Map back to emails for candidate filtering
      const usersWithAIUsage = new Set(
        [...emailToId.entries()]
          .filter(([, id]) => usersWithAIUsageIds.has(id))
          .map(([email]) => email)
      );

      const almostCandidates = almostUsers
        .filter((u) => !activatedSet.has(u.email) && usersWithAIUsage.has(u.email))
        .map((u) => ({ email: u.email, name: u.name }));

      results.almost_activated = await processCohort('almost_activated', almostCandidates, sendAlmostActivatedEmail);
    } else {
      results.almost_activated = { sent: 0, skipped: 0, failed: 0 };
    }

    if (Date.now() - startTime > MAX_RUNTIME_MS) {
      console.warn('[cron] Approaching timeout after almost_activated, stopping');
      return NextResponse.json({ success: true, results, partial: true }, { status: 200 });
    }

    // ============================================
    // COHORT 4: going_idle
    // lastActiveAt 7-14 days ago, had projects, free plan
    // ============================================
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const idleUsers = await User.find({
      plan: 'free',
      lastActiveAt: { $gte: fourteenDaysAgo, $lte: sevenDaysAgo },
    }).select('email name').lean();

    if (idleUsers.length > 0) {
      const idleEmails = idleUsers.map((u) => u.email);
      const idleWithProjects = new Set(
        await Project.distinct('userId', { userId: { $in: idleEmails } })
      );

      // Fetch most recent project title for each idle user (for personalised email copy)
      const idleMostRecentProjects = await Project.aggregate([
        { $match: { userId: { $in: idleEmails } } },
        { $sort: { updatedAt: -1 } },
        { $group: { _id: '$userId', title: { $first: '$title' } } },
      ]);
      const idleProjectNameMap = new Map(idleMostRecentProjects.map((r: any) => [r._id, r.title as string]));

      const idleCandidates = idleUsers
        .filter((u) => idleWithProjects.has(u.email))
        .map((u) => ({ email: u.email, name: u.name, projectName: idleProjectNameMap.get(u.email) }));

      results.going_idle = await processCohort('going_idle', idleCandidates, sendGoingIdleEmail);
    } else {
      results.going_idle = { sent: 0, skipped: 0, failed: 0 };
    }

    if (Date.now() - startTime > MAX_RUNTIME_MS) {
      console.warn('[cron] Approaching timeout after going_idle, stopping');
      return NextResponse.json({ success: true, results, partial: true }, { status: 200 });
    }

    // ============================================
    // COHORT 5: win_back
    // lastActiveAt 30+ days ago, free plan
    // ============================================
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const winBackUsers = await User.find({
      plan: 'free',
      lastActiveAt: { $lte: thirtyDaysAgo },
    }).select('email name').lean();

    if (winBackUsers.length > 0) {
      const winBackCandidates = winBackUsers.map((u) => ({ email: u.email, name: u.name }));
      results.win_back = await processCohort('win_back', winBackCandidates, sendWinBackEmail);
    } else {
      results.win_back = { sent: 0, skipped: 0, failed: 0 };
    }

    const duration = Date.now() - startTime;
    console.info('[cron] Engagement emails complete', { duration: `${duration}ms`, results });
    return NextResponse.json({ success: true, results, duration: `${duration}ms` }, { status: 200 });
  } catch (error) {
    console.error('[cron] Engagement emails failed:', error);
    return NextResponse.json(
      { error: 'Internal server error', results },
      { status: 500 }
    );
  }
}
