import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Activation from '@/models/Activation';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '0');

    // Date filter: 0 = all-time
    const dateFilter = days > 0
      ? { createdAt: { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) } }
      : {};

    // Step 1: Total signups
    const totalSignups = await User.countDocuments(dateFilter);

    // Step 2: Users who created their first project
    const withFirstProject = await Activation.countDocuments({
      ...dateFilter,
      firstProjectCreatedAt: { $ne: null },
    });

    // Step 3: Users who generated their first AI output
    const withFirstOutput = await Activation.countDocuments({
      ...dateFilter,
      firstOutputGeneratedAt: { $ne: null },
    });

    // Step 4: Users who subscribed (pro or team)
    const subscribers = await User.countDocuments({
      ...dateFilter,
      plan: { $in: ['pro', 'team'] },
    });

    // Build funnel steps with drop-off rates
    const steps = [
      { label: 'Signed Up', count: totalSignups },
      { label: 'Created First Project', count: withFirstProject },
      { label: 'Generated First Output', count: withFirstOutput },
      { label: 'Subscribed', count: subscribers },
    ];

    const funnel = steps.map((step, i) => {
      const prev = i === 0 ? step.count : steps[i - 1].count;
      const conversionFromPrev = prev > 0 ? (step.count / prev) * 100 : 0;
      const conversionFromTop = totalSignups > 0 ? (step.count / totalSignups) * 100 : 0;
      const dropOff = i === 0 ? 0 : prev - step.count;
      const dropOffRate = prev > 0 ? (dropOff / prev) * 100 : 0;

      return {
        ...step,
        conversionFromPrev: Math.round(conversionFromPrev * 10) / 10,
        conversionFromTop: Math.round(conversionFromTop * 10) / 10,
        dropOff,
        dropOffRate: Math.round(dropOffRate * 10) / 10,
      };
    });

    // Median time-to-activation for activated users
    const activatedUsers = await Activation.find({
      ...dateFilter,
      isActivated: true,
      timeToActivation: { $ne: null },
    })
      .select('timeToActivation')
      .lean();

    let medianTimeToActivation: number | null = null;
    if (activatedUsers.length > 0) {
      const times = activatedUsers
        .map((u) => u.timeToActivation as number)
        .sort((a, b) => a - b);
      const mid = Math.floor(times.length / 2);
      medianTimeToActivation =
        times.length % 2 === 0
          ? Math.round((times[mid - 1] + times[mid]) / 2)
          : times[mid];
    }

    // Weekly funnel trend (last 8 weeks)
    const eightWeeksAgo = new Date(Date.now() - 56 * 24 * 60 * 60 * 1000);
    const [weeklySignups, weeklyProjects, weeklyOutputs, weeklySubscribers] = await Promise.all([
      User.aggregate([
        { $match: { createdAt: { $gte: eightWeeksAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-W%V', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Activation.aggregate([
        { $match: { createdAt: { $gte: eightWeeksAgo }, firstProjectCreatedAt: { $ne: null } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-W%V', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Activation.aggregate([
        { $match: { createdAt: { $gte: eightWeeksAgo }, firstOutputGeneratedAt: { $ne: null } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-W%V', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      User.aggregate([
        { $match: { createdAt: { $gte: eightWeeksAgo }, plan: { $in: ['pro', 'team'] } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-W%V', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    // Merge weekly data
    const allWeeks = new Set<string>();
    [weeklySignups, weeklyProjects, weeklyOutputs, weeklySubscribers].forEach((arr) =>
      arr.forEach((r: { _id: string }) => allWeeks.add(r._id))
    );

    const toMap = (arr: Array<{ _id: string; count: number }>) =>
      new Map(arr.map((r) => [r._id, r.count]));

    const signupsMap = toMap(weeklySignups);
    const projectsMap = toMap(weeklyProjects);
    const outputsMap = toMap(weeklyOutputs);
    const subscribersMap = toMap(weeklySubscribers);

    const weeklyTrend = Array.from(allWeeks)
      .sort()
      .map((week) => ({
        week,
        signups: signupsMap.get(week) || 0,
        firstProject: projectsMap.get(week) || 0,
        firstOutput: outputsMap.get(week) || 0,
        subscribed: subscribersMap.get(week) || 0,
      }));

    return NextResponse.json({
      funnel,
      medianTimeToActivation,
      weeklyTrend,
    });
  } catch (error) {
    console.error('Error fetching activation funnel data:', error);
    return NextResponse.json({ error: 'Failed to fetch funnel data' }, { status: 500 });
  }
}
