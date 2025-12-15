import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getAllMetrics } from '@/lib/admin/metrics';
import { adaptMetricsForFrontend } from '@/lib/admin/metrics/adapter';

export async function GET(request: Request) {
  try {
    // MongoDB connection is REQUIRED - fail if not available
    await connectDB();

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const daysParam = searchParams.get('days');
    const startParam = searchParams.get('start');
    const endParam = searchParams.get('end');
    
    let validDays: number;
    
    // If custom date range provided, calculate days from it
    if (startParam && endParam) {
      const start = new Date(startParam);
      const end = new Date(endParam);
      const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      validDays = Math.max(1, Math.min(365, daysDiff));
    } else {
      const days = daysParam ? parseInt(daysParam, 10) : 30;
      validDays = Math.max(1, Math.min(365, days));
    } // Between 1 and 365 days

    // Get all metrics using the new service layer
    const metrics = await getAllMetrics(validDays, startParam || undefined, endParam || undefined);

    // Adapt to frontend-compatible format (includes both new and legacy structures)
    const frontendMetrics = adaptMetricsForFrontend(metrics);

    return NextResponse.json(frontendMetrics);
  } catch (error) {
    console.error('Error fetching admin metrics:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Check if it's a MongoDB connection error
    if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('MongoNetworkError')) {
      return NextResponse.json(
        { 
          error: 'MongoDB connection failed',
          message: 'Please ensure MongoDB is running on localhost:27017',
          details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
        },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch admin metrics',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}
