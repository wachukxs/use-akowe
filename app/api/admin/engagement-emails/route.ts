import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import EmailLog from '@/models/EmailLog';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view') || 'summary';
    const cohort = searchParams.get('cohort');
    const days = parseInt(searchParams.get('days') || '30');
    const userEmail = searchParams.get('email');

    if (view === 'summary') {
      const dateFilter = days > 0
        ? { sentAt: { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) } }
        : {};

      const [aggregation, uniqueUsers, totalEmails] = await Promise.all([
        EmailLog.aggregate([
          { $match: dateFilter },
          {
            $group: {
              _id: { cohort: '$cohort', status: '$status' },
              count: { $sum: 1 },
              lastSent: { $max: '$sentAt' },
            },
          },
        ]),
        EmailLog.distinct('userId', { status: 'sent', ...dateFilter }),
        EmailLog.countDocuments(dateFilter),
      ]);

      // Reshape into per-cohort summary
      const cohorts: Record<string, { sent: number; failed: number; lastSent: string | null }> = {};
      for (const row of aggregation) {
        const c = row._id.cohort;
        if (!cohorts[c]) cohorts[c] = { sent: 0, failed: 0, lastSent: null };
        if (row._id.status === 'sent') {
          cohorts[c].sent = row.count;
          cohorts[c].lastSent = row.lastSent?.toISOString() || null;
        } else {
          cohorts[c].failed = row.count;
        }
      }

      return NextResponse.json({
        cohorts,
        uniqueUsersEmailed: uniqueUsers.length,
        totalEmails,
      });
    }

    if (view === 'daily') {
      const pipeline = [
        {
          $match: {
            sentAt: { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) },
            ...(cohort ? { cohort } : {}),
          },
        },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: '%Y-%m-%d', date: '$sentAt' } },
              cohort: '$cohort',
              status: '$status',
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.date': -1 as const } },
      ];

      const results = await EmailLog.aggregate(pipeline);
      return NextResponse.json({ daily: results });
    }

    if (view === 'user') {
      if (!userEmail) {
        return NextResponse.json({ error: 'email parameter required' }, { status: 400 });
      }

      const logs = await EmailLog.find({ userId: userEmail })
        .sort({ sentAt: -1 })
        .limit(50)
        .lean();

      return NextResponse.json({ logs });
    }

    // Default: paginated recent logs
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const skip = parseInt(searchParams.get('skip') || '0');

    const filter: any = {};
    if (cohort) filter.cohort = cohort;
    if (days > 0) filter.sentAt = { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) };

    const [logs, total] = await Promise.all([
      EmailLog.find(filter).sort({ sentAt: -1 }).skip(skip).limit(limit).lean(),
      EmailLog.countDocuments(filter),
    ]);

    return NextResponse.json({ logs, total });
  } catch (error) {
    console.error('Error fetching engagement email data:', error);
    return NextResponse.json({ error: 'Failed to fetch engagement email data' }, { status: 500 });
  }
}
