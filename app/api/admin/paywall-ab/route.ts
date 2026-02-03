import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import DailyUsage from '@/models/DailyUsage';
import Project from '@/models/Project';

/**
 * Admin API endpoint to analyze Paywall A/B test results
 * 
 * Returns metrics comparing:
 * - Variant A: Paywall before output (block generation)
 * - Variant B: Output preview then paywall before export (let them see, block export)
 * 
 * Metrics:
 * - Paywall views (by variant)
 * - Conversion rates (paywall view -> upgrade)
 * - Export attempts (variant B only)
 * - Export conversions (variant B only)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    await connectDB();
    const adminUser = await User.findOne({ email: session.user.email }).lean();
    if (!adminUser || (adminUser as any).role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build date filter
    const dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) {
        dateFilter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        dateFilter.createdAt.$lte = new Date(endDate);
      }
    }

    // Get all users with their paywall variant assignments
    // Note: Variant is stored in cookies, so we'll infer from behavior
    // For accurate tracking, we'd need to store variant in User model or separate tracking table
    
    // Get paywall view events from GA4 (would need to query GA4 API)
    // For now, we'll analyze based on:
    // 1. Users who hit 429 errors (Variant A)
    // 2. Users who have projects but haven't exported (potential Variant B)
    // 3. Users who upgraded after hitting limits

    // Get users who upgraded (conversions)
    const upgradedUsers = await User.find({
      plan: { $in: ['pro', 'pro_annual'] },
      ...dateFilter,
    }).lean();

    // Get projects with AI-generated content
    const projectsWithAI = await Project.find({
      wordCount: { $gt: 0 },
      ...dateFilter,
    }).lean();

    // Get daily usage records to identify users who hit limits
    const usageRecords = await DailyUsage.find({
      aiWordsUsed: { $gte: 500 }, // Hit the free limit
      ...dateFilter,
    }).lean();

    // Analyze patterns
    // Variant A users: Hit 429 errors (we can't directly track this without logs)
    // Variant B users: Have projects with content but may not have exported
    
    // For now, return basic metrics
    // In production, you'd want to:
    // 1. Store paywall variant in User model or separate PaywallAssignment model
    // 2. Track paywall views via GA4 events with variant parameter
    // 3. Track export attempts and conversions

    const results = {
      summary: {
        totalUsers: await User.countDocuments(dateFilter),
        upgradedUsers: upgradedUsers.length,
        projectsWithAI: projectsWithAI.length,
        usersWhoHitLimit: usageRecords.length,
      },
      variantA: {
        description: 'Paywall before output (block generation)',
        // Would need actual tracking data
        paywallViews: 0, // From GA4 events
        conversions: 0, // Users who upgraded after seeing paywall
        conversionRate: 0,
      },
      variantB: {
        description: 'Output preview then paywall before export',
        // Would need actual tracking data
        paywallViews: 0, // From GA4 events
        previewViews: 0, // Users who saw preview
        exportAttempts: 0, // Users who tried to export
        exportConversions: 0, // Users who upgraded to export
        conversionRate: 0,
      },
      note: 'This endpoint requires GA4 integration or database tracking of paywall variant assignments and events. Currently returns basic user metrics.',
    };

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error analyzing paywall A/B test:', error);
    return NextResponse.json(
      { error: 'Failed to analyze paywall A/B test results' },
      { status: 500 }
    );
  }
}
