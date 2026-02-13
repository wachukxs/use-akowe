import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import DailyUsage from '@/models/DailyUsage';
import Project from '@/models/Project';

export async function GET(request: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const pageParam = searchParams.get('page');
    const limitParam = searchParams.get('limit');
    const search = searchParams.get('search')?.trim() || '';
    const daysParam = searchParams.get('days');
    const startParam = searchParams.get('start');
    const endParam = searchParams.get('end');

    const page = Math.max(1, parseInt(pageParam || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(limitParam || '20', 10)));

    // Build date filter for usage aggregation
    let usageDateFilter: Record<string, string> | null = null;
    if (startParam && endParam) {
      usageDateFilter = { $gte: startParam, $lte: endParam };
    } else if (daysParam && parseInt(daysParam, 10) > 0) {
      const days = parseInt(daysParam, 10);
      const startDate = new Date();
      startDate.setUTCDate(startDate.getUTCDate() - days);
      startDate.setUTCHours(0, 0, 0, 0);
      const endDate = new Date();
      endDate.setUTCHours(23, 59, 59, 999);
      usageDateFilter = {
        $gte: startDate.toISOString().split('T')[0],
        $lte: endDate.toISOString().split('T')[0],
      };
    }

    const filter: Record<string, unknown> = {};
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

    interface UserDocument {
      _id: mongoose.Types.ObjectId | { toString(): string };
    }
    const userIds = users.map((u: UserDocument) => u._id.toString());

    // Usage for these users (respects date filter if provided) + citations from projects
    const usageMatch: Record<string, unknown> = { userId: { $in: userIds } };
    if (usageDateFilter) {
      usageMatch.date = usageDateFilter;
    }

    // Build citation date filter (uses Date objects for createdAt, not strings)
    const citationMatch: Record<string, unknown> = {
      userId: { $in: userIds },
      citations: { $exists: true, $ne: [] },
    };
    if (startParam && endParam) {
      const citStart = new Date(startParam + 'T00:00:00.000Z');
      citStart.setUTCHours(0, 0, 0, 0);
      const citEnd = new Date(endParam + 'T23:59:59.999Z');
      citEnd.setUTCHours(23, 59, 59, 999);
      citationMatch.createdAt = { $gte: citStart, $lte: citEnd };
    } else if (daysParam && parseInt(daysParam, 10) > 0) {
      const days = parseInt(daysParam, 10);
      const citStart = new Date();
      citStart.setUTCDate(citStart.getUTCDate() - days);
      citStart.setUTCHours(0, 0, 0, 0);
      const citEnd = new Date();
      citEnd.setUTCHours(23, 59, 59, 999);
      citationMatch.createdAt = { $gte: citStart, $lte: citEnd };
    }

    const [usageAggregation, citationAggregation] = await Promise.all([
      DailyUsage.aggregate([
        {
          $match: usageMatch,
        },
        {
          $group: {
            _id: '$userId',
            totalAIWords: { $sum: '$aiWordsGenerated' },
            totalPlagiarismChecks: { $sum: '$plagiarismChecks' },
            totalTopicFinderSearches: { $sum: '$topicFinderSearches' },
            totalParaphraseUses: { $sum: '$paraphraseUses' },
            totalLitReviewAnalyses: { $sum: '$litReviewAnalyses' },
            activeDays: { $sum: 1 },
          },
        },
      ], { maxTimeMS: 30000 }),
      Project.aggregate([
        {
          $match: citationMatch,
        },
        {
          $group: {
            _id: '$userId',
            totalCitations: { $sum: { $size: '$citations' } },
            projectsWithCitations: { $sum: 1 },
          },
        },
      ], { maxTimeMS: 30000 }),
    ]);

    const citationMap = new Map<string, { totalCitations: number; projectsWithCitations: number }>();
    citationAggregation.forEach(
      (entry: { _id: string; totalCitations: number; projectsWithCitations: number }) => {
        citationMap.set(entry._id, {
          totalCitations: entry.totalCitations,
          projectsWithCitations: entry.projectsWithCitations,
        });
      },
    );

    const usageMap = new Map<
      string,
      { totalAIWords: number; totalPlagiarismChecks: number; totalTopicFinderSearches: number; totalParaphraseUses: number; totalLitReviewAnalyses: number; activeDays: number }
    >();
    usageAggregation.forEach(
      (usage: {
        _id: string;
        totalAIWords: number;
        totalPlagiarismChecks: number;
        totalTopicFinderSearches: number;
        totalParaphraseUses: number;
        totalLitReviewAnalyses: number;
        activeDays: number;
      }) => {
        usageMap.set(usage._id, {
          totalAIWords: usage.totalAIWords,
          totalPlagiarismChecks: usage.totalPlagiarismChecks,
          totalTopicFinderSearches: usage.totalTopicFinderSearches,
          totalParaphraseUses: usage.totalParaphraseUses,
          totalLitReviewAnalyses: usage.totalLitReviewAnalyses,
          activeDays: usage.activeDays,
        });
      },
    );

    interface UserWithId {
      _id: mongoose.Types.ObjectId | { toString(): string };
      name?: string;
      email: string;
      plan?: string;
      createdAt: Date;
      stripeSubscriptionId?: string;
    }
    const usersWithUsage = users.map((user: UserWithId) => {
      const userId = user._id.toString();
      const usage = usageMap.get(userId) || {
        totalAIWords: 0,
        totalPlagiarismChecks: 0,
        totalTopicFinderSearches: 0,
        totalParaphraseUses: 0,
        totalLitReviewAnalyses: 0,
        activeDays: 0,
      };
      const citations = citationMap.get(userId) || {
        totalCitations: 0,
        projectsWithCitations: 0,
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
        totalTopicFinderSearches: usage.totalTopicFinderSearches,
        totalParaphraseUses: usage.totalParaphraseUses,
        totalLitReviewAnalyses: usage.totalLitReviewAnalyses,
        totalCitations: citations.totalCitations,
        projectsWithCitations: citations.projectsWithCitations,
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

