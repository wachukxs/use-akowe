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

    // Get leads
    const leads = await LeadCapture.find(filter)
      .sort({ capturedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count
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

    // Check which leads have signed up (by email)
    const leadEmails = leads.map(l => l.email);
    const signedUpUsers = await User.find({ email: { $in: leadEmails } })
      .select('_id email createdAt')
      .lean();
    const signedUpMap = new Map(signedUpUsers.map(u => [u.email, { id: u._id.toString(), createdAt: u.createdAt }]));

    // Update conversion status for leads that signed up
    for (const lead of leads) {
      const userInfo = signedUpMap.get(lead.email);
      if (userInfo && !lead.convertedAt) {
        // Mark as converted with proper userId reference
        await LeadCapture.updateOne(
          { _id: lead._id },
          { convertedAt: userInfo.createdAt, userId: userInfo.id }
        );
        lead.convertedAt = userInfo.createdAt;
        lead.userId = userInfo.id;
      }
    }

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
