import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import DailyUsage from '@/models/DailyUsage';
import User from '@/models/User';
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
      startDate = new Date(startParam);
      endDate = new Date(endParam);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    } else {
      const days = daysParam ? parseInt(daysParam, 10) : 30;
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
      startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      startDate.setHours(0, 0, 0, 0);
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

