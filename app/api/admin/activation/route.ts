import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Activation from '@/models/Activation';

/**
 * GET /api/admin/activation
 * Returns activation metrics aggregated by various dimensions
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const searchParams = request.nextUrl.searchParams;
    const dimension = searchParams.get('dimension') as 'channel' | 'source' | 'country' | 'toolEntryPoint' | null;
    
    // Get overall activation rate
    const total = await Activation.countDocuments({});
    const activated = await Activation.countDocuments({ isActivated: true });
    const overallRate = total > 0 ? (activated / total) * 100 : 0;
    
    // Get average time to activation
    const activatedRecords = await Activation.find({ isActivated: true, timeToActivation: { $ne: null } });
    const avgTimeToActivation = activatedRecords.length > 0
      ? activatedRecords.reduce((sum, record) => sum + (record.timeToActivation || 0), 0) / activatedRecords.length
      : null;
    
    // If dimension is specified, return breakdown by that dimension
    if (dimension && ['channel', 'source', 'country', 'toolEntryPoint'].includes(dimension)) {
      const breakdown = await Activation.aggregate([
        {
          $group: {
            _id: `$${dimension}`,
            total: { $sum: 1 },
            activated: {
              $sum: { $cond: [{ $eq: ['$isActivated', true] }, 1, 0] }
            },
          },
        },
        {
          $project: {
            value: { $ifNull: ['$_id', 'unknown'] },
            total: 1,
            activated: 1,
            activationRate: {
              $cond: [
                { $eq: ['$total', 0] },
                0,
                { $multiply: [{ $divide: ['$activated', '$total'] }, 100] }
              ],
            },
          },
        },
        {
          $sort: { total: -1 },
        },
      ], { maxTimeMS: 30000 }); // 30 second timeout
      
      return NextResponse.json({
        overall: {
          total,
          activated,
          activationRate: overallRate,
          avgTimeToActivation,
        },
        breakdown: {
          dimension,
          data: breakdown,
        },
      });
    }
    
    // Return overall metrics
    return NextResponse.json({
      overall: {
        total,
        activated,
        activationRate: overallRate,
        avgTimeToActivation,
      },
    });
  } catch (error) {
    console.error('Error fetching activation metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activation metrics' },
      { status: 500 }
    );
  }
}
