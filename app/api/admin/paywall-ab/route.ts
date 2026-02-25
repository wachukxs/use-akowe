import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/admin-auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import DailyUsage from '@/models/DailyUsage';
import Project from '@/models/Project';
import PaywallEvent from '@/models/PaywallEvent';

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
    // Check admin session using cookie-based auth
    const { authenticated: isAdmin } = await verifyAdminSession();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build date filter for PaywallEvent queries
    interface EventDateFilter {
      createdAt?: {
        $gte?: Date;
        $lte?: Date;
      };
    }
    const eventDateFilter: EventDateFilter = {};
    if (startDate || endDate) {
      const createdAtFilter: { $gte?: Date; $lte?: Date } = {};
      if (startDate) {
        createdAtFilter.$gte = new Date(startDate);
      }
      if (endDate) {
        createdAtFilter.$lte = new Date(endDate);
      }
      eventDateFilter.createdAt = createdAtFilter;
    }

    // Build date filter for User/Project queries
    interface DateFilter {
      createdAt?: {
        $gte?: Date;
        $lte?: Date;
      };
    }
    const dateFilter: DateFilter = {};
    if (startDate || endDate) {
      const createdAtFilter: { $gte?: Date; $lte?: Date } = {};
      if (startDate) {
        createdAtFilter.$gte = new Date(startDate);
      }
      if (endDate) {
        createdAtFilter.$lte = new Date(endDate);
      }
      dateFilter.createdAt = createdAtFilter;
    }

    // Query PaywallEvent collection for actual tracking data
    const [variantAEvents, variantBEvents, allPaywallViews, allConversions] = await Promise.all([
      // Variant A events
      PaywallEvent.find({
        variant: 'variant_a',
        ...eventDateFilter,
      }).lean(),
      
      // Variant B events
      PaywallEvent.find({
        variant: 'variant_b',
        ...eventDateFilter,
      }).lean(),
      
      // All paywall views (for summary)
      PaywallEvent.find({
        eventType: 'paywall_view',
        ...eventDateFilter,
      }).lean(),
      
      // All conversions (for summary)
      PaywallEvent.find({
        eventType: 'conversion',
        ...eventDateFilter,
      }).lean(),
    ]);

    // Calculate Variant A metrics
    const variantAPaywallViews = variantAEvents.filter(e => e.eventType === 'paywall_view').length;
    const variantAConversions = variantAEvents.filter(e => e.eventType === 'conversion').length;
    const variantAConversionRate = variantAPaywallViews > 0 
      ? (variantAConversions / variantAPaywallViews) * 100 
      : 0;

    // Calculate Variant B metrics
    const variantBPaywallViews = variantBEvents.filter(e => e.eventType === 'paywall_view').length;
    const variantBPreviewViews = variantBEvents.filter(e => e.eventType === 'preview_view').length;
    const variantBExportAttempts = variantBEvents.filter(e => e.eventType === 'export_attempt').length;
    const variantBConversions = variantBEvents.filter(e => e.eventType === 'conversion').length;
    // For Variant B, conversion rate is based on export attempts (more relevant metric)
    const variantBConversionRate = variantBExportAttempts > 0 
      ? (variantBConversions / variantBExportAttempts) * 100 
      : (variantBPaywallViews > 0 ? (variantBConversions / variantBPaywallViews) * 100 : 0);

    // Get basic summary metrics
    const upgradedUsers = await User.find({
      plan: { $in: ['pro', 'pro_annual'] },
      ...dateFilter,
    }).lean();

    const projectsWithAI = await Project.find({
      wordCount: { $gt: 0 },
      ...dateFilter,
    }).lean();

    // DailyUsage uses a 'date' string field (YYYY-MM-DD), not createdAt
    const usageDateFilter: Record<string, unknown> = {};
    if (startDate || endDate) {
      const dateRange: { $gte?: string; $lte?: string } = {};
      if (startDate) {
        dateRange.$gte = new Date(startDate).toISOString().split('T')[0];
      }
      if (endDate) {
        dateRange.$lte = new Date(endDate).toISOString().split('T')[0];
      }
      usageDateFilter.date = dateRange;
    }

    const usageRecords = await DailyUsage.find({
      aiWordsGenerated: { $gte: 500 }, // Hit the free limit
      ...usageDateFilter,
    }).lean();

    const results = {
      summary: {
        totalUsers: await User.countDocuments(dateFilter),
        upgradedUsers: upgradedUsers.length,
        projectsWithAI: projectsWithAI.length,
        usersWhoHitLimit: usageRecords.length,
      },
      variantA: {
        description: 'Paywall before output (block generation)',
        paywallViews: variantAPaywallViews,
        conversions: variantAConversions,
        conversionRate: Math.round(variantAConversionRate * 100) / 100,
      },
      variantB: {
        description: 'Output preview then paywall before export',
        paywallViews: variantBPaywallViews,
        previewViews: variantBPreviewViews,
        exportAttempts: variantBExportAttempts,
        exportConversions: variantBConversions,
        conversionRate: Math.round(variantBConversionRate * 100) / 100,
      },
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
