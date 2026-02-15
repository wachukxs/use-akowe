import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Project from '@/models/Project';
import Activation from '@/models/Activation';
import { checkAndUpdateActivation } from '@/lib/activation-tracking';

/**
 * One-time backfill: For users who created projects before activation
 * tracking was added, retroactively set firstProjectCreatedAt on their
 * Activation record based on their earliest Project.
 *
 * Safe to run multiple times — only touches records where
 * firstProjectCreatedAt is null.
 *
 * Auth is handled by middleware for all /api/admin/* routes.
 */
export async function POST() {
  try {
    await connectDB();

    // Step 1: Find all users who have at least one project
    // Project.userId stores EMAIL addresses
    const projectAgg = await Project.aggregate([
      { $sort: { createdAt: 1 } },
      {
        $group: {
          _id: '$userId', // email
          earliestProjectDate: { $first: '$createdAt' },
        },
      },
    ]);

    // Step 2: Find Activation records missing firstProjectCreatedAt
    const emails = projectAgg.map((r: any) => r._id);
    const existingActivations = await Activation.find({
      userId: { $in: emails },
      firstProjectCreatedAt: null,
    })
      .select('userId')
      .lean();
    const needsBackfill = new Set(existingActivations.map((a: any) => a.userId));

    // Also find users with no Activation record at all
    const allActivations = await Activation.find({
      userId: { $in: emails },
    })
      .select('userId')
      .lean();
    const hasActivation = new Set(allActivations.map((a: any) => a.userId));

    let updated = 0;
    let created = 0;
    let activatedCount = 0;

    const emailToDate = new Map(
      projectAgg.map((r: any) => [r._id as string, r.earliestProjectDate as Date])
    );

    for (const [email, earliestDate] of emailToDate) {
      const shouldUpdate = needsBackfill.has(email);
      const shouldCreate = !hasActivation.has(email);

      if (!shouldUpdate && !shouldCreate) continue;

      const projectDate = new Date(earliestDate);

      if (shouldCreate) {
        await Activation.create({
          userId: email,
          firstProjectCreatedAt: projectDate,
          isActivated: false,
        });
        created++;
      } else {
        await Activation.updateOne(
          { userId: email, firstProjectCreatedAt: null },
          { $set: { firstProjectCreatedAt: projectDate } }
        );
        updated++;
      }

      // Re-evaluate full activation (project + 300 words + 2 days)
      const activated = await checkAndUpdateActivation(email);
      if (activated) activatedCount++;
    }

    return NextResponse.json({
      success: true,
      usersWithProjects: projectAgg.length,
      created,
      updated,
      newlyActivated: activatedCount,
      alreadyTracked: projectAgg.length - created - updated,
    });
  } catch (error) {
    console.error('Backfill activation error:', error);
    return NextResponse.json(
      { error: 'Backfill failed' },
      { status: 500 }
    );
  }
}
