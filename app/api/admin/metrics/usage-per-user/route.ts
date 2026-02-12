import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import DailyUsage from '@/models/DailyUsage';
import User from '@/models/User';
import Project from '@/models/Project';

export async function GET(request: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const daysParam = searchParams.get('days');
    const startParam = searchParams.get('start');
    const endParam = searchParams.get('end');
    const search = searchParams.get('search')?.trim() || '';
    
    let startDate: Date;
    let endDate: Date;
    
    if (startParam && endParam) {
      // Parse date strings ensuring UTC representation
      // If date-only (YYYY-MM-DD), append T00:00:00.000Z
      // If has T but no timezone indicator (Z, +, or -), append Z to ensure UTC parsing
      const normalizeDateString = (dateStr: string, defaultTime: string) => {
        if (!dateStr.includes('T')) {
          // Date-only: append default time with Z
          return dateStr + defaultTime;
        }
        // Has time component - check for timezone indicator
        // Match ISO 8601 timezone formats: Z, ±HH:MM, or ±HHMM
        if (!dateStr.endsWith('Z') && !dateStr.match(/[+-]\d{2}:?\d{2}$/)) {
          // Has T but no timezone indicator - append Z for UTC
          return dateStr + 'Z';
        }
        return dateStr;
      };
      
      const startStr = normalizeDateString(startParam, 'T00:00:00.000Z');
      const endStr = normalizeDateString(endParam, 'T23:59:59.999Z');
      startDate = new Date(startStr);
      endDate = new Date(endStr);
      startDate.setUTCHours(0, 0, 0, 0);
      endDate.setUTCHours(23, 59, 59, 999);
    } else {
      const days = daysParam ? parseInt(daysParam, 10) : 30;
      endDate = new Date();
      endDate.setUTCHours(23, 59, 59, 999);
      
      if (days === 0) {
        // All time: get the earliest date from the database
        const [earliestUser, earliestProject, earliestUsage] = await Promise.all([
          User.findOne().sort({ createdAt: 1 }).select('createdAt').lean(),
          Project.findOne().sort({ createdAt: 1 }).select('createdAt').lean(),
          DailyUsage.findOne().sort({ date: 1 }).select('date').lean(),
        ]);

        const dates: Date[] = [];
        if (earliestUser?.createdAt) dates.push(new Date(earliestUser.createdAt));
        if (earliestProject?.createdAt) dates.push(new Date(earliestProject.createdAt));
        if (earliestUsage?.date) {
          // DailyUsage.date is a string (YYYY-MM-DD format) - parse as UTC to avoid timezone issues
          const dateStr = earliestUsage.date as string;
          dates.push(new Date(dateStr + 'T00:00:00.000Z'));
        }

        if (dates.length > 0) {
          startDate = new Date(Math.min(...dates.map(d => d.getTime())));
        } else {
          // Fallback if no data exists
          startDate = new Date();
        }
        startDate.setUTCHours(0, 0, 0, 0);
      } else {
        startDate = new Date();
        startDate.setUTCDate(startDate.getUTCDate() - days);
        startDate.setUTCHours(0, 0, 0, 0);
      }
    }

    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];

    // Aggregate usage for all users in the period
    const [usageAggregation, citationAggregation] = await Promise.all([
      DailyUsage.aggregate([
        {
          $match: {
            date: { $gte: startStr, $lte: endStr }
          }
        },
        {
          $group: {
            _id: '$userId',
            totalAIWords: { $sum: '$aiWordsGenerated' },
            totalPlagiarismChecks: { $sum: '$plagiarismChecks' },
            totalTopicFinderSearches: { $sum: '$topicFinderSearches' },
            totalParaphraseUses: { $sum: '$paraphraseUses' },
            activeDays: { $sum: 1 }
          }
        }
      ], { maxTimeMS: 30000 }),
      // Aggregate citations per user from Projects
      Project.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            citations: { $exists: true, $ne: [] }
          }
        },
        {
          $group: {
            _id: '$userId',
            totalCitations: { $sum: { $size: '$citations' } },
            projectsWithCitations: { $sum: 1 }
          }
        }
      ], { maxTimeMS: 30000 }),
    ]);

    // Build a citation map keyed by userId (string)
    const citationMap = new Map<string, { totalCitations: number; projectsWithCitations: number }>();
    citationAggregation.forEach(
      (entry: { _id: string; totalCitations: number; projectsWithCitations: number }) => {
        citationMap.set(entry._id, {
          totalCitations: entry.totalCitations,
          projectsWithCitations: entry.projectsWithCitations,
        });
      },
    );

    // Build a usage map keyed by userId (string)
    const usageMap = new Map<
      string,
      { totalAIWords: number; totalPlagiarismChecks: number; totalTopicFinderSearches: number; totalParaphraseUses: number; activeDays: number }
    >();
    usageAggregation.forEach(
      (usage: {
        _id: string;
        totalAIWords: number;
        totalPlagiarismChecks: number;
        totalTopicFinderSearches: number;
        totalParaphraseUses: number;
        activeDays: number;
      }) => {
        usageMap.set(usage._id, {
          totalAIWords: usage.totalAIWords,
          totalPlagiarismChecks: usage.totalPlagiarismChecks,
          totalTopicFinderSearches: usage.totalTopicFinderSearches,
          totalParaphraseUses: usage.totalParaphraseUses,
          activeDays: usage.activeDays,
        });
      },
    );

    // Build user filter for search
    const userFilter: Record<string, unknown> = {};
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
      const escapedSearch = trimmedSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escapedSearch, 'i');
      userFilter.$or = [{ email: regex }, { name: regex }];
    }
    
    // Fetch all users so that export truly includes every account,
    // even users with zero usage in the selected period.
    const allUsers = await User.find(userFilter)
      .select('email name plan _id')
      .lean();

    const usersWithUsage = allUsers.map((user: { _id: { toString: () => string }; email?: string; name?: string; plan?: string }) => {
      const userId = user._id.toString();
      const usage = usageMap.get(userId) || {
        totalAIWords: 0,
        totalPlagiarismChecks: 0,
        totalTopicFinderSearches: 0,
        totalParaphraseUses: 0,
        activeDays: 0,
      };
      const citations = citationMap.get(userId) || {
        totalCitations: 0,
        projectsWithCitations: 0,
      };

      return {
        userId,
        email: user.email || 'Unknown',
        name: user.name || 'Unknown',
        plan: user.plan || 'free',
        totalAIWords: usage.totalAIWords,
        totalPlagiarismChecks: usage.totalPlagiarismChecks,
        totalTopicFinderSearches: usage.totalTopicFinderSearches,
        totalParaphraseUses: usage.totalParaphraseUses,
        totalCitations: citations.totalCitations,
        projectsWithCitations: citations.projectsWithCitations,
        activeDays: usage.activeDays,
      };
    });

    // Sort by total AI words (descending) to keep behavior consistent
    usersWithUsage.sort((a, b) => b.totalAIWords - a.totalAIWords);

    return NextResponse.json({
      users: usersWithUsage,
      totalUsers: usersWithUsage.length,
      dateRange: {
        start: startStr,
        end: endStr,
      },
    });
  } catch (error) {
    console.error('Error fetching usage per user:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      {
        error: 'Failed to fetch usage per user',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}

