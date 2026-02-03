import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Activation from '@/models/Activation';
import User from '@/models/User';

/**
 * GET /api/admin/landing-pages
 * Returns landing page performance metrics by channel/variant
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const searchParams = request.nextUrl.searchParams;
    const variant = searchParams.get('variant') as string | null;
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    
    // Build query for activation records with landing page data
    const query: any = {};
    
    if (variant) {
      // Map variant to channel or tool entry point
      if (variant === 'plagiarism') {
        query.toolEntryPoint = 'plagiarism';
      } else if (variant === 'import') {
        query.toolEntryPoint = 'import';
      } else if (variant === 'topic') {
        query.toolEntryPoint = 'topic';
      } else {
        query.channel = variant;
      }
    }
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }
    
    // Get overall metrics
    const totalVisits = await Activation.countDocuments(query);
    const activated = await Activation.countDocuments({ ...query, isActivated: true });
    const activationRate = totalVisits > 0 ? (activated / totalVisits) * 100 : 0;
    
    // Get signup rate (users who created first project)
    const signedUp = await Activation.countDocuments({ ...query, firstProjectCreatedAt: { $ne: null } });
    const signupRate = totalVisits > 0 ? (signedUp / totalVisits) * 100 : 0;
    
    // Get paywall reach rate (users who hit limits - approximate by checking users with projects but no activation)
    const hitPaywall = await Activation.countDocuments({
      ...query,
      firstProjectCreatedAt: { $ne: null },
      isActivated: false,
    });
    const paywallRate = signedUp > 0 ? (hitPaywall / signedUp) * 100 : 0;
    
    // Get breakdown by channel if no specific variant requested
    let breakdown = null;
    if (!variant) {
      breakdown = await Activation.aggregate([
        {
          $group: {
            _id: {
              channel: { $ifNull: ['$channel', 'direct'] },
              toolEntryPoint: { $ifNull: ['$toolEntryPoint', 'direct'] },
            },
            total: { $sum: 1 },
            activated: {
              $sum: { $cond: [{ $eq: ['$isActivated', true] }, 1, 0] }
            },
            signedUp: {
              $sum: { $cond: [{ $ne: ['$firstProjectCreatedAt', null] }, 1, 0] }
            },
            hitPaywall: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $ne: ['$firstProjectCreatedAt', null] },
                      { $eq: ['$isActivated', false] }
                    ]
                  },
                  1,
                  0
                ]
              }
            },
          },
        },
        {
          $project: {
            channel: '$_id.channel',
            toolEntryPoint: '$_id.toolEntryPoint',
            total: 1,
            activated: 1,
            signedUp: 1,
            hitPaywall: 1,
            activationRate: {
              $cond: [
                { $eq: ['$total', 0] },
                0,
                { $multiply: [{ $divide: ['$activated', '$total'] }, 100] }
              ],
            },
            signupRate: {
              $cond: [
                { $eq: ['$total', 0] },
                0,
                { $multiply: [{ $divide: ['$signedUp', '$total'] }, 100] }
              ],
            },
            paywallRate: {
              $cond: [
                { $eq: ['$signedUp', 0] },
                0,
                { $multiply: [{ $divide: ['$hitPaywall', '$signedUp'] }, 100] }
              ],
            },
          },
        },
        {
          $sort: { total: -1 },
        },
      ]);
    }
    
    return NextResponse.json({
      variant: variant || 'all',
      metrics: {
        totalVisits,
        signedUp,
        signupRate: Math.round(signupRate * 100) / 100,
        activated,
        activationRate: Math.round(activationRate * 100) / 100,
        hitPaywall,
        paywallRate: Math.round(paywallRate * 100) / 100,
      },
      ...(breakdown && { breakdown }),
    });
  } catch (error) {
    console.error('Error fetching landing page metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch landing page metrics' },
      { status: 500 }
    );
  }
}
