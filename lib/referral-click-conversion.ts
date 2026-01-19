import connectDB from './mongodb';
import ReferralClick from '@/models/ReferralClick';

/**
 * Marks referral clicks as converted when a user signs up with a referral code
 * This should be called after a user is created with referredBy or referredByInfluencer
 */
export async function markReferralClicksAsConverted(referralCode: string, convertedAt: Date): Promise<void> {
  try {
    await connectDB();
    
    // Normalize referral code (trim whitespace) to match how clicks are stored
    const normalizedCode = referralCode.trim();
    
    // Mark all unconverted clicks for this referral code as converted
    await ReferralClick.updateMany(
      { 
        referralCode: normalizedCode,
        converted: { $ne: true } // Not already converted
      },
      {
        $set: {
          converted: true,
          convertedAt,
        },
      }
    );
  } catch (error) {
    // Don't throw - conversion tracking shouldn't break signup flow
    console.error('Error marking referral clicks as converted:', error);
  }
}
