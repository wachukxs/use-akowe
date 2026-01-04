import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import DailyUsage from '@/models/DailyUsage';
import User from '@/models/User';
import Project from '@/models/Project';
import mongoose from 'mongoose';

export async function GET(request: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const daysParam = searchParams.get('days');
    const startParam = searchParams.get('start');
    const endParam = searchParams.get('end');
    
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

    // Get all users with usage in the period (not just top 20)
    const usageAggregation = await DailyUsage.aggregate([
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
          activeDays: { $sum: 1 }
        }
      },
      {
        $sort: { totalAIWords: -1 }
      }
    ]);

    // Batch fetch all user details
    const userIds = usageAggregation
      .map((u: { _id: string }) => u._id)
      .filter((id: string) => mongoose.Types.ObjectId.isValid(id))
      .map((id: string) => new mongoose.Types.ObjectId(id));
    
    const usersMap = new Map<string, any>();
    if (userIds.length > 0) {
      const users = await User.find({ _id: { $in: userIds } })
        .select('email name plan _id')
        .lean();
      
      users.forEach((user: any) => {
        usersMap.set(user._id.toString(), user);
      });
    }

    // Combine usage data with user details
    const usersWithUsage = usageAggregation.map((usage: { _id: string; totalAIWords: number; totalPlagiarismChecks: number; activeDays: number }) => {
      const user = usersMap.get(usage._id) || null;
      return {
        userId: usage._id,
        email: user?.email || 'Unknown',
        name: user?.name || 'Unknown',
        plan: user?.plan || 'free',
        totalAIWords: usage.totalAIWords,
        totalPlagiarismChecks: usage.totalPlagiarismChecks,
        activeDays: usage.activeDays,
      };
    });

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

