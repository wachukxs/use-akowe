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
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '100');
    const skip = parseInt(searchParams.get('skip') || '0');

    // Build filter
    const filter: Record<string, unknown> = {};
    if (source) filter.source = source;
    if (converted === 'true') filter.convertedAt = { $exists: true };
    if (converted === 'false') filter.convertedAt = { $exists: false };
    
    // Date range filtering (on capturedAt)
    if (startDate || endDate) {
      filter.capturedAt = {};
      
      if (startDate) {
        // Validate date format (YYYY-MM-DD)
        if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
          return NextResponse.json(
            { error: 'Invalid start date format. Use YYYY-MM-DD' },
            { status: 400 }
          );
        }
        const start = new Date(startDate);
        // Check if date is valid
        if (isNaN(start.getTime())) {
          return NextResponse.json(
            { error: 'Invalid start date' },
            { status: 400 }
          );
        }
        start.setUTCHours(0, 0, 0, 0);
        filter.capturedAt.$gte = start;
      }
      
      if (endDate) {
        // Validate date format (YYYY-MM-DD)
        if (!/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
          return NextResponse.json(
            { error: 'Invalid end date format. Use YYYY-MM-DD' },
            { status: 400 }
          );
        }
        const end = new Date(endDate);
        // Check if date is valid
        if (isNaN(end.getTime())) {
          return NextResponse.json(
            { error: 'Invalid end date' },
            { status: 400 }
          );
        }
        end.setUTCHours(23, 59, 59, 999);
        filter.capturedAt.$lte = end;
      }
      
      // Validate date range (start should not be after end)
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (start > end) {
          return NextResponse.json(
            { error: 'Start date must be before or equal to end date' },
            { status: 400 }
          );
        }
      }
    }
    
    // Email search (case-insensitive partial match)
    if (search && search.trim().length > 0) {
      const trimmedSearch = search.trim();
      
      // Prevent extremely long search queries
      if (trimmedSearch.length > 100) {
        return NextResponse.json(
          { error: 'Search query is too long. Maximum 100 characters.' },
          { status: 400 }
        );
      }
      
      // Escape special regex characters to prevent regex injection
      // This ensures the search is treated as a literal string match
      const escapedSearch = trimmedSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.email = new RegExp(escapedSearch, 'i');
    }

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

    // Get conversion stats (apply same filter for consistency, but exclude search for stats)
    const statsFilter: Record<string, unknown> = {};
    if (source) statsFilter.source = source;
    if (converted === 'true') statsFilter.convertedAt = { $exists: true };
    if (converted === 'false') statsFilter.convertedAt = { $exists: false };
    
    // Include date range in stats filter (only if dates are valid)
    if (startDate || endDate) {
      statsFilter.capturedAt = {};
      if (startDate && /^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
        const start = new Date(startDate);
        if (!isNaN(start.getTime())) {
          start.setUTCHours(0, 0, 0, 0);
          statsFilter.capturedAt.$gte = start;
        }
      }
      if (endDate && /^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
        const end = new Date(endDate);
        if (!isNaN(end.getTime())) {
          end.setUTCHours(23, 59, 59, 999);
          statsFilter.capturedAt.$lte = end;
        }
      }
    }
    // Note: We exclude search from stats filter to show overall stats for the date range
    
    const statsPipeline: Array<Record<string, unknown>> = [];
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
    
    const stats = await LeadCapture.aggregate(statsPipeline, { maxTimeMS: 30000 }); // 30 second timeout

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
