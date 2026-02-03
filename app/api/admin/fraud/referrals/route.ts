import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ReferralClick from '@/models/ReferralClick';
import User from '@/models/User';
import { checkReferralFraud } from '@/lib/fraud-prevention';

/**
 * GET /api/admin/fraud/referrals
 * Returns fraud analysis for referrals
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const searchParams = request.nextUrl.searchParams;
    const referralCode = searchParams.get('referral_code');
    const ipAddress = searchParams.get('ip_address');
    
    if (referralCode) {
      // Analyze specific referral code
      const totalClicks = await ReferralClick.countDocuments({ referralCode });
      const convertedClicks = await ReferralClick.countDocuments({
        referralCode,
        converted: true,
      });
      const conversionRate = totalClicks > 0 ? (convertedClicks / totalClicks) * 100 : 0;
      
      // Get unique IPs and user agents
      const uniqueIPs = await ReferralClick.distinct('ipAddress', { referralCode });
      const uniqueUserAgents = await ReferralClick.distinct('userAgent', { referralCode });
      
      // Check for suspicious patterns
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentClicks = await ReferralClick.countDocuments({
        referralCode,
        clickedAt: { $gte: oneHourAgo },
      });
      
      // Get IPs with high click counts
      const ipClickCounts = await ReferralClick.aggregate([
        { $match: { referralCode } },
        { $group: { _id: '$ipAddress', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ], { maxTimeMS: 30000 }); // 30 second timeout
      
      return NextResponse.json({
        referralCode,
        metrics: {
          totalClicks,
          convertedClicks,
          conversionRate: Math.round(conversionRate * 100) / 100,
          uniqueIPs: uniqueIPs.filter(ip => ip).length,
          uniqueUserAgents: uniqueUserAgents.filter(ua => ua).length,
          recentClicks,
        },
        suspiciousIPs: ipClickCounts.filter(ip => ip.count > 10).map(ip => ({
          ip: ip._id,
          clicks: ip.count,
        })),
        riskLevel: conversionRate < 5 && totalClicks > 50 ? 'high' : 
                  conversionRate < 10 && totalClicks > 20 ? 'medium' : 'low',
      });
    }
    
    if (ipAddress) {
      // Analyze specific IP address
      const clicksFromIP = await ReferralClick.countDocuments({ ipAddress });
      const differentCodes = await ReferralClick.distinct('referralCode', { ipAddress });
      const convertedClicks = await ReferralClick.countDocuments({
        ipAddress,
        converted: true,
      });
      
      return NextResponse.json({
        ipAddress,
        metrics: {
          totalClicks: clicksFromIP,
          convertedClicks,
          differentReferralCodes: differentCodes.length,
          conversionRate: clicksFromIP > 0 ? (convertedClicks / clicksFromIP) * 100 : 0,
        },
        referralCodes: differentCodes,
        riskLevel: differentCodes.length > 5 || clicksFromIP > 20 ? 'high' : 
                  differentCodes.length > 2 || clicksFromIP > 10 ? 'medium' : 'low',
      });
    }
    
    // Return overall fraud summary
    const totalClicks = await ReferralClick.countDocuments({});
    const convertedClicks = await ReferralClick.countDocuments({ converted: true });
    const overallConversionRate = totalClicks > 0 ? (convertedClicks / totalClicks) * 100 : 0;
    
    // Find referral codes with suspicious patterns
    const suspiciousCodes = await ReferralClick.aggregate([
      {
        $group: {
          _id: '$referralCode',
          totalClicks: { $sum: 1 },
          convertedClicks: {
            $sum: { $cond: [{ $eq: ['$converted', true] }, 1, 0] }
          },
          uniqueIPs: { $addToSet: '$ipAddress' },
        },
      },
      {
        $project: {
          referralCode: '$_id',
          totalClicks: 1,
          convertedClicks: 1,
          uniqueIPs: { $size: '$uniqueIPs' },
          conversionRate: {
            $cond: [
              { $eq: ['$totalClicks', 0] },
              0,
              { $multiply: [{ $divide: ['$convertedClicks', '$totalClicks'] }, 100] }
            ],
          },
        },
      },
      {
        $match: {
          $or: [
            { totalClicks: { $gt: 50 }, conversionRate: { $lt: 5 } },
            { totalClicks: { $gt: 20 }, conversionRate: { $lt: 10 } },
            { uniqueIPs: { $lt: 3 }, totalClicks: { $gt: 10 } },
          ],
        },
      },
      {
        $sort: { totalClicks: -1 },
      },
      {
        $limit: 20,
      },
    ], { maxTimeMS: 30000 }); // 30 second timeout
    
    return NextResponse.json({
      overall: {
        totalClicks,
        convertedClicks,
        conversionRate: Math.round(overallConversionRate * 100) / 100,
      },
      suspiciousReferralCodes: suspiciousCodes,
    });
  } catch (error) {
    console.error('Error fetching fraud analysis:', error);
    return NextResponse.json(
      { error: 'Failed to fetch fraud analysis' },
      { status: 500 }
    );
  }
}
