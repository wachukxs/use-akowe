import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import DailyUsage from '@/models/DailyUsage';
import { format } from 'date-fns';

const RESETTABLE_FIELDS = ['aiWordsGenerated', 'plagiarismChecks', 'paraphraseUses', 'topicFinderSearches', 'litReviewAnalyses'] as const;
type ResettableField = typeof RESETTABLE_FIELDS[number];

/**
 * POST /api/admin/reset-usage
 * Body: { email: string, field: ResettableField | 'all', date?: string }
 *
 * Resets one or all usage fields for a user on a given date (defaults to today).
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { email, field, date } = body;

    if (!email) {
      return NextResponse.json({ error: 'email is required' }, { status: 400 });
    }
    if (!field) {
      return NextResponse.json({ error: 'field is required (aiWordsGenerated | plagiarismChecks | paraphraseUses | topicFinderSearches | litReviewAnalyses | all)' }, { status: 400 });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() }).lean();
    if (!user) {
      return NextResponse.json({ error: `No user found with email: ${email}` }, { status: 404 });
    }

    const userId = (user._id as { toString(): string }).toString();
    const targetDate = date || format(new Date(), 'yyyy-MM-dd');

    const $set: Record<string, number> = {};

    if (field === 'all') {
      for (const f of RESETTABLE_FIELDS) {
        $set[f] = 0;
      }
    } else if (RESETTABLE_FIELDS.includes(field as ResettableField)) {
      $set[field as ResettableField] = 0;
    } else {
      return NextResponse.json({ error: `Unknown field: ${field}` }, { status: 400 });
    }

    const result = await DailyUsage.updateOne(
      { userId, date: targetDate },
      { $set },
      { upsert: false }
    );

    const fieldsReset = field === 'all' ? RESETTABLE_FIELDS.join(', ') : field;

    return NextResponse.json({
      success: true,
      email,
      date: targetDate,
      field,
      fieldsReset,
      modified: result.modifiedCount,
      message: result.modifiedCount > 0
        ? `Reset ${fieldsReset} for ${email} on ${targetDate}.`
        : `No usage record found for ${email} on ${targetDate} — nothing to reset.`,
    });
  } catch (error) {
    console.error('Error resetting usage:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
