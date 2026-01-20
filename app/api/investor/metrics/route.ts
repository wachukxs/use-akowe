import { NextResponse } from 'next/server';
import { getPublicMetrics } from '@/lib/admin/public-metrics';

export async function GET() {
  try {
    const metrics = await getPublicMetrics();
    return NextResponse.json(metrics, {
      headers: {
        'Cache-Control': 's-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Error fetching public investor metrics:', error);
    // Return a safe fallback shape so consumers can still render
    return NextResponse.json(
      {
        users: {
          total: 0,
          newInPeriod: 0,
          newLast7Days: 0,
          dau: 0,
          mau: 0,
          stickiness: 0,
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
        error: 'unavailable',
      },
      { status: 503 },
    );
  }
}

