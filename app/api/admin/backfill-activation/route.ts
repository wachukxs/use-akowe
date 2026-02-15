import { NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/admin-auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import DailyUsage from '@/models/DailyUsage';
import Activation from '@/models/Activation';
import { checkAndUpdateActivation } from '@/lib/activation-tracking';

/**
 * One-time backfill: For users who used features (plagiarism, lit review,
 * rewrite, topic finder) before activation tracking was added to those
 * endpoints, retroactively set firstOutputGeneratedAt on their Activation
 * record and re-evaluate full activation status.
 *
 * Safe to run multiple times — only touches records where
 * firstOutputGeneratedAt is null.
 */
export async function POST() {
  try {
    const isAdmin = await verifyAdminSession();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Step 1: Find all DailyUsage records where a non-AI-word feature was used
    // These fields indicate feature usage that wasn't tracked for activation before
    const featureUsageRecords = await DailyUsage.find({
      $or: [
        { plagiarismChecks: { $gt: 0 } },
        { litReviewAnalyses: { $gt: 0 } },
        { paraphraseUses: { $gt: 0 } },
        { topicFinderSearches: { $gt: 0 } },
      ],
    })
      .select('userId date')
      .sort({ date: 1 })
      .lean();

    // Group by userId → earliest date they used any feature
    const earliestFeatureUse = new Map<string, string>();
    for (const record of featureUsageRecords) {
      if (!earliestFeatureUse.has(record.userId)) {
        earliestFeatureUse.set(record.userId, record.date);
      }
    }

    // Step 2: DailyUsage.userId = ObjectId string, Activation.userId = email
    // Build mapping: ObjectId string → email
    const objectIds = [...earliestFeatureUse.keys()];
    const users = await User.find({
      _id: { $in: objectIds },
    })
      .select('_id email')
      .lean();

    const idToEmail = new Map<string, string>();
    for (const u of users) {
      idToEmail.set(u._id.toString(), u.email);
    }

    // Step 3: Find Activation records that are missing firstOutputGeneratedAt
    const emails = [...idToEmail.values()];
    const existingActivations = await Activation.find({
      userId: { $in: emails },
      firstOutputGeneratedAt: null,
    })
      .select('userId')
      .lean();

    const needsBackfill = new Set(existingActivations.map((a: any) => a.userId));

    // Also include users with no Activation record at all
    const allActivations = await Activation.find({
      userId: { $in: emails },
    })
      .select('userId')
      .lean();
    const hasActivation = new Set(allActivations.map((a: any) => a.userId));

    let updated = 0;
    let created = 0;
    let activatedCount = 0;

    for (const [objectId, earliestDate] of earliestFeatureUse) {
      const email = idToEmail.get(objectId);
      if (!email) continue;

      const shouldUpdate = needsBackfill.has(email);
      const shouldCreate = !hasActivation.has(email);

      if (!shouldUpdate && !shouldCreate) continue;

      // Set firstOutputGeneratedAt to the earliest feature usage date
      const outputDate = new Date(earliestDate + 'T00:00:00.000Z');

      if (shouldCreate) {
        // Create new activation record
        await Activation.create({
          userId: email,
          firstOutputGeneratedAt: outputDate,
          isActivated: false,
        });
        created++;
      } else {
        // Update existing record
        await Activation.updateOne(
          { userId: email, firstOutputGeneratedAt: null },
          { $set: { firstOutputGeneratedAt: outputDate } }
        );
        updated++;
      }

      // Re-evaluate full activation (project + 300 words + 2 days)
      const activated = await checkAndUpdateActivation(email);
      if (activated) activatedCount++;
    }

    return NextResponse.json({
      success: true,
      featureUsersFound: earliestFeatureUse.size,
      created,
      updated,
      newlyActivated: activatedCount,
      alreadyTracked: earliestFeatureUse.size - created - updated,
    });
  } catch (error) {
    console.error('Backfill activation error:', error);
    return NextResponse.json(
      { error: 'Backfill failed' },
      { status: 500 }
    );
  }
}
