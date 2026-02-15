// Fixed window metrics - WAU, activation, cohort retention, words per active day

import DailyUsage from '@/models/DailyUsage';
import User from '@/models/User';
import Project from '@/models/Project';
import Activation from '@/models/Activation';
import { getChurnDateRanges } from './date-utils';

function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

export async function getFixedWindowCoreMetrics() {
  const now = new Date();
  now.setUTCHours(23, 59, 59, 999);

  // --- WAU: distinct users in last 7 days ---
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 7);
  sevenDaysAgo.setUTCHours(0, 0, 0, 0);
  const wauStartStr = toDateStr(sevenDaysAgo);
  const wauEndStr = toDateStr(now);

  // --- Previous week for WoW comparison ---
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setUTCDate(fourteenDaysAgo.getUTCDate() - 14);
  fourteenDaysAgo.setUTCHours(0, 0, 0, 0);
  const prevEnd = new Date(sevenDaysAgo);
  prevEnd.setUTCDate(prevEnd.getUTCDate() - 1);
  const prevWauStartStr = toDateStr(fourteenDaysAgo);
  const prevWauEndStr = toDateStr(prevEnd);

  // Run WAU queries, activation, and words aggregation in parallel
  const [
    thisWeekUsers,
    lastWeekUsers,
    activationTotal,
    activationActivated,
    activatedRecords,
    wordsAgg,
    projectsCompleted,
    prevProjectsCompleted,
  ] = await Promise.all([
    DailyUsage.distinct('userId', {
      date: { $gte: wauStartStr, $lte: wauEndStr },
    }),
    DailyUsage.distinct('userId', {
      date: { $gte: prevWauStartStr, $lte: prevWauEndStr },
    }),
    Activation.countDocuments({}),
    Activation.countDocuments({ isActivated: true }),
    Activation.find({ isActivated: true, timeToActivation: { $ne: null } })
      .select('timeToActivation')
      .lean(),
    DailyUsage.aggregate([
      { $match: { date: { $gte: wauStartStr, $lte: wauEndStr } } },
      {
        $group: {
          _id: null,
          totalWords: { $sum: '$aiWordsGenerated' },
          totalUserDays: { $sum: 1 },
        },
      },
    ]),
    Project.countDocuments({
      status: 'completed',
      updatedAt: { $gte: sevenDaysAgo, $lte: now },
    }),
    Project.countDocuments({
      status: 'completed',
      updatedAt: { $gte: fourteenDaysAgo, $lte: prevEnd },
    }),
  ]);

  const wau = thisWeekUsers.length;
  const lastWeekWau = lastWeekUsers.length;
  const wauChange =
    lastWeekWau > 0 ? ((wau - lastWeekWau) / lastWeekWau) * 100 : 0;

  // WoW Retention: % of last week's users who returned this week
  const lastWeekUserSet = new Set(lastWeekUsers.map(String));
  const thisWeekUserSet = new Set(thisWeekUsers.map(String));
  let returnedCount = 0;
  for (const uid of lastWeekUserSet) {
    if (thisWeekUserSet.has(uid)) returnedCount++;
  }
  const wowRetention =
    lastWeekWau > 0 ? (returnedCount / lastWeekWau) * 100 : 0;

  // Activation Rate
  const activationRate =
    activationTotal > 0 ? (activationActivated / activationTotal) * 100 : 0;
  const avgTimeToActivation =
    activatedRecords.length > 0
      ? activatedRecords.reduce(
          (sum: number, r: { timeToActivation?: number | null }) =>
            sum + (r.timeToActivation || 0),
          0
        ) / activatedRecords.length
      : null;

  // Words per Active Day
  const totalWords = wordsAgg[0]?.totalWords || 0;
  const totalUserDays = wordsAgg[0]?.totalUserDays || 0;
  const wordsPerActiveDay = totalUserDays > 0 ? totalWords / totalUserDays : 0;

  // Projects completed WoW change
  const projectsCompletedChange =
    prevProjectsCompleted > 0
      ? ((projectsCompleted - prevProjectsCompleted) / prevProjectsCompleted) *
        100
      : 0;

  return {
    wau,
    wauChange,
    activationRate,
    activationTotal,
    activationActivated,
    avgTimeToActivation,
    wordsPerActiveDay,
    projectsCompleted,
    projectsCompletedChange,
    wowRetention,
  };
}

export async function getFixedWindowRetentionMetrics(periodDays: number) {
  const ranges = getChurnDateRanges(periodDays);

  // --- Existing churn logic ---
  const usersActiveInCohort = await DailyUsage.distinct('userId', {
    date: {
      $gte: ranges.cohortStart.startStr,
      $lt: ranges.cohortEnd.endStr,
    },
  });

  const usersStillActive = await DailyUsage.distinct('userId', {
    userId: { $in: usersActiveInCohort },
    date: { $gte: ranges.currentStart.startStr },
  });

  const churnedUsers = usersActiveInCohort.length - usersStillActive.length;
  const churnRate =
    usersActiveInCohort.length > 0
      ? (churnedUsers / usersActiveInCohort.length) * 100
      : 0;

  // --- Week 1 Retention (cohort-based) ---
  // Cohort: ALL users who signed up at least 14 days ago (so their week 1 window has fully passed).
  // For each user, check if they had activity 7-14 days after their signup.
  const now = new Date();
  const w1CohortCutoff = new Date(now);
  w1CohortCutoff.setUTCDate(now.getUTCDate() - 14);
  w1CohortCutoff.setUTCHours(0, 0, 0, 0);

  // --- Week 4 Retention (cohort-based) ---
  // Cohort: ALL users who signed up at least 35 days ago (so their week 4 window has fully passed).
  // For each user, check if they had activity 21-28 days after their signup.
  const w4CohortCutoff = new Date(now);
  w4CohortCutoff.setUTCDate(now.getUTCDate() - 35);
  w4CohortCutoff.setUTCHours(0, 0, 0, 0);

  // Fetch both cohorts in parallel
  const [w1CohortUsers, w4CohortUsers] = await Promise.all([
    User.find({
      createdAt: { $lt: w1CohortCutoff },
    })
      .select('_id createdAt')
      .lean(),
    User.find({
      createdAt: { $lt: w4CohortCutoff },
    })
      .select('_id createdAt')
      .lean(),
  ]);

  // Calculate Week 1 retention using batch query
  const week1Retention = await calculateCohortRetention(
    w1CohortUsers,
    7,
    14
  );

  // Calculate Week 4 retention using batch query
  const week4Retention = await calculateCohortRetention(
    w4CohortUsers,
    21,
    28
  );

  return {
    churnRate,
    churnedUsers,
    week1Retention: week1Retention.rate,
    week1CohortSize: week1Retention.cohortSize,
    week4Retention: week4Retention.rate,
    week4CohortSize: week4Retention.cohortSize,
    wowRetention: 0, // Populated from core metrics in orchestrator
  };
}

/**
 * Calculate cohort retention using batch queries for performance.
 * For each user in the cohort, checks if they had activity between
 * dayStart and dayEnd days after their signup date.
 */
async function calculateCohortRetention(
  cohortUsers: Array<{ _id: unknown; createdAt: Date }>,
  dayStart: number,
  dayEnd: number
): Promise<{ rate: number; cohortSize: number }> {
  if (cohortUsers.length === 0) {
    return { rate: 0, cohortSize: 0 };
  }

  // Build per-user activity windows
  const userWindows = new Map<
    string,
    { startStr: string; endStr: string }
  >();
  let earliestStart = '';
  let latestEnd = '';

  for (const user of cohortUsers) {
    const userId = user._id!.toString();
    const signup = new Date(user.createdAt);

    const windowStart = new Date(signup);
    windowStart.setUTCDate(signup.getUTCDate() + dayStart);
    const windowEnd = new Date(signup);
    windowEnd.setUTCDate(signup.getUTCDate() + dayEnd);

    const startStr = toDateStr(windowStart);
    const endStr = toDateStr(windowEnd);

    userWindows.set(userId, { startStr, endStr });

    if (!earliestStart || startStr < earliestStart) earliestStart = startStr;
    if (!latestEnd || endStr > latestEnd) latestEnd = endStr;
  }

  // Single batch query for all users' activity in the overall window
  const userIds = cohortUsers.map((u) => u._id!.toString());
  const allActivity = await DailyUsage.find({
    userId: { $in: userIds },
    date: { $gte: earliestStart, $lte: latestEnd },
  })
    .select('userId date')
    .lean();

  // Check each record against the user's personal retention window
  const retainedSet = new Set<string>();
  for (const record of allActivity) {
    const window = userWindows.get(record.userId);
    if (
      window &&
      record.date >= window.startStr &&
      record.date <= window.endStr
    ) {
      retainedSet.add(record.userId);
    }
  }

  const rate =
    cohortUsers.length > 0
      ? (retainedSet.size / cohortUsers.length) * 100
      : 0;

  return { rate, cohortSize: cohortUsers.length };
}
