import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import LeadCapture from '@/models/LeadCapture';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Get query params for filtering
    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source');
    const converted = searchParams.get('converted');
    const limit = parseInt(searchParams.get('limit') || '100');
    const skip = parseInt(searchParams.get('skip') || '0');

    // Build filter
    const filter: any = {};
    if (source) filter.source = source;
    if (converted === 'true') filter.convertedAt = { $exists: true };
    if (converted === 'false') filter.convertedAt = { $exists: false };

    // Check ALL leads for conversions and update them FIRST
    // This ensures stats, total count, and paginated results are calculated with the latest conversion data
    // Get all lead emails that haven't been converted yet
    const allUnconvertedLeads = await LeadCapture.find({
      convertedAt: { $exists: false },
    })
      .select('email')
      .lean();
    
    const allLeadEmails = [...new Set(allUnconvertedLeads.map(l => l.email))];
    
    if (allLeadEmails.length > 0) {
      const signedUpUsers = await User.find({ email: { $in: allLeadEmails } })
        .select('_id email createdAt')
        .lean();
      const signedUpMap = new Map(signedUpUsers.map(u => [u.email, { id: u._id.toString(), createdAt: u.createdAt }]));

      // Update conversion status for ALL unconverted leads that have signed up
      for (const email of allLeadEmails) {
        const userInfo = signedUpMap.get(email);
        if (userInfo) {
          await LeadCapture.updateMany(
            { email, convertedAt: { $exists: false } },
            { convertedAt: userInfo.createdAt, userId: userInfo.id }
          );
        }
      }
    }

    // Re-query leads AFTER updating conversions to ensure pagination consistency
    // This ensures we get the correct number of leads that match the filter after updates
    const leads = await LeadCapture.find(filter)
      .sort({ capturedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Now calculate total count and stats AFTER updating conversions to ensure accuracy
    // Get total count with the same filter (now reflects updated conversion status)
    const total = await LeadCapture.countDocuments(filter);

    // Get conversion stats (apply same filter for consistency)
    const statsFilter: any = {};
    if (source) statsFilter.source = source;
    if (converted === 'true') statsFilter.convertedAt = { $exists: true };
    if (converted === 'false') statsFilter.convertedAt = { $exists: false };
    
    const statsPipeline: any[] = [];
    if (Object.keys(statsFilter).length > 0) {
      statsPipeline.push({ $match: statsFilter });
    }
    statsPipeline.push({
      $group: {
        _id: '$source',
        total: { $sum: 1 },
        converted: {
          $sum: { $cond: [{ $ifNull: ['$convertedAt', false] }, 1, 0] }
        },
      },
    });
    
    const stats = await LeadCapture.aggregate(statsPipeline);

    return NextResponse.json({
      leads,
      total,
      stats: stats.reduce((acc, s) => {
        acc[s._id] = { total: s.total, converted: s.converted };
        return acc;
      }, {} as Record<string, { total: number; converted: number }>),
    });
  } catch (error) {
    console.error('Error fetching leads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leads' },
      { status: 500 }
    );
  }
}
