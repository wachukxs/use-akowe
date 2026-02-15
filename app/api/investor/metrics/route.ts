import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getPublicMetrics } from '@/lib/admin/public-metrics';

export async function GET() {
  try {
    // Ensure database connection is established before running queries
    await connectDB();
    
    const metrics = await getPublicMetrics();
    
    return NextResponse.json(metrics, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Error fetching public investor metrics:', error);
    
    // Check if it's a timeout error
    const isTimeout = error instanceof Error && (
      error.message.includes('buffering timed out') ||
      error.message.includes('operation timed out') ||
      error.message.includes('maxTimeMS')
    );
    
    if (isTimeout) {
      console.error('Metrics query timed out - this may indicate database performance issues or missing indexes');
    }
    
    // Return a safe fallback shape so consumers can still render
    return NextResponse.json(
      {
        users: {
          total: 0,
          newInPeriod: 0,
          newLast7Days: 0,
          wau: 0,
          wauChange: 0,
        },
        projects: {
          total: 0,
          createdInPeriod: 0,
          avgProjectsPerUser: 0,
        },
        usage: {
          aiWordsInPeriod: 0,
          plagiarismChecksInPeriod: 0,
          citationAdoption: 0,
          plagiarismAdoption: 0,
        },
        productHealth: {
          activeUsers: 0,
          powerUsers: 0,
          consistentUsers: 0,
        },
        revenue: {
          totalRevenue: 0,
          monthlyRecurringRevenue: 0,
          annualRecurringRevenue: 0,
          activeSubscriptions: 0,
        },
        error: 'unavailable',
      },
      { status: 503 },
    );
  }
}

