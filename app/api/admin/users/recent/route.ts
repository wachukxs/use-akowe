import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import DailyUsage from '@/models/DailyUsage';

export async function GET(request: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const pageParam = searchParams.get('page');
    const limitParam = searchParams.get('limit');
    const search = searchParams.get('search')?.trim() || '';

    const page = Math.max(1, parseInt(pageParam || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(limitParam || '20', 10)));

    const filter: Record<string, any> = {};
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
      const regex = new RegExp(escapedSearch, 'i');
      filter.$or = [{ email: regex }, { name: regex }];
    }

    const total = await User.countDocuments(filter);

    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('name email plan createdAt stripeSubscriptionId _id')
      .lean();

    const userIds = users.map((u: any) => u._id.toString());

    // All-time usage for these users (no date filter)
    const usageAggregation = await DailyUsage.aggregate([
      {
        $match: {
          userId: { $in: userIds },
        },
      },
      {
        $group: {
          _id: '$userId',
          totalAIWords: { $sum: '$aiWordsGenerated' },
          totalPlagiarismChecks: { $sum: '$plagiarismChecks' },
          activeDays: { $sum: 1 },
        },
      },
    ]);

    const usageMap = new Map<
      string,
      { totalAIWords: number; totalPlagiarismChecks: number; activeDays: number }
    >();
    usageAggregation.forEach(
      (usage: {
        _id: string;
        totalAIWords: number;
        totalPlagiarismChecks: number;
        activeDays: number;
      }) => {
        usageMap.set(usage._id, {
          totalAIWords: usage.totalAIWords,
          totalPlagiarismChecks: usage.totalPlagiarismChecks,
          activeDays: usage.activeDays,
        });
      },
    );

    const usersWithUsage = users.map((user: any) => {
      const userId = user._id.toString();
      const usage = usageMap.get(userId) || {
        totalAIWords: 0,
        totalPlagiarismChecks: 0,
        activeDays: 0,
      };

      return {
        _id: userId,
        name: user.name || 'N/A',
        email: user.email,
        plan: user.plan,
        createdAt: user.createdAt,
        stripeSubscriptionId: user.stripeSubscriptionId,
        totalAIWords: usage.totalAIWords,
        totalPlagiarismChecks: usage.totalPlagiarismChecks,
        activeDays: usage.activeDays,
      };
    });

    return NextResponse.json({
      users: usersWithUsage,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching recent users:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        error: 'Failed to fetch recent users',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 },
    );
  }
}

