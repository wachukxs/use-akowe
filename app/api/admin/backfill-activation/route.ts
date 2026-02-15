import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Project from '@/models/Project';
import Activation from '@/models/Activation';

/**
 * One-time backfill: For users who created projects before activation
 * tracking was added, retroactively set firstProjectCreatedAt on their
 * Activation record based on their earliest Project.
 *
 * Uses bulk operations to avoid serverless timeout.
 * Safe to run multiple times — only touches records where
 * firstProjectCreatedAt is null.
 *
 * Auth is handled by middleware for all /api/admin/* routes.
 */
export async function POST() {
  try {
    await connectDB();

    // Step 1: Get earliest project date per user (email)
    const projectAgg = await Project.aggregate([
      { $sort: { createdAt: 1 } },
      {
        $group: {
          _id: '$userId',
          earliestProjectDate: { $first: '$createdAt' },
        },
      },
    ]);

    const emailToDate = new Map<string, Date>(
      projectAgg.map((r: any) => [r._id, new Date(r.earliestProjectDate)])
    );
    const emails = [...emailToDate.keys()];

    // Step 2: Find which emails already have Activation records
    const allActivations = await Activation.find({
      userId: { $in: emails },
    })
      .select('userId firstProjectCreatedAt')
      .lean();

    const activationMap = new Map<string, any>();
    for (const a of allActivations) {
      activationMap.set(a.userId, a);
    }

    // Step 3: Bulk create for users with no Activation record
    const toCreate = [];
    for (const [email, date] of emailToDate) {
      if (!activationMap.has(email)) {
        toCreate.push({
          userId: email,
          firstProjectCreatedAt: date,
          isActivated: false,
        });
      }
    }

    let created = 0;
    if (toCreate.length > 0) {
      const result = await Activation.insertMany(toCreate, { ordered: false }).catch((err) => {
        // Some may fail due to duplicate key — that's fine
        return err.insertedDocs || [];
      });
      created = Array.isArray(result) ? result.length : toCreate.length;
    }

    // Step 4: Bulk update for users with Activation but null firstProjectCreatedAt
    const bulkOps = [];
    for (const [email, date] of emailToDate) {
      const existing = activationMap.get(email);
      if (existing && !existing.firstProjectCreatedAt) {
        bulkOps.push({
          updateOne: {
            filter: { userId: email, firstProjectCreatedAt: null },
            update: { $set: { firstProjectCreatedAt: date } },
          },
        });
      }
    }

    let updated = 0;
    if (bulkOps.length > 0) {
      const result = await Activation.bulkWrite(bulkOps, { ordered: false });
      updated = result.modifiedCount;
    }

    return NextResponse.json({
      success: true,
      usersWithProjects: projectAgg.length,
      created,
      updated,
      alreadyTracked: projectAgg.length - created - bulkOps.length,
    });
  } catch (error) {
    console.error('Backfill activation error:', error);
    return NextResponse.json(
      { error: 'Backfill failed' },
      { status: 500 }
    );
  }
}
