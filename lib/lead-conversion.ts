import connectDB from './mongodb';
import LeadCapture from '@/models/LeadCapture';
import User from '@/models/User';

/**
 * Marks a lead as converted when a user signs up
 * This should be called after a user is created
 */
export async function markLeadAsConverted(userEmail: string, userId: string, convertedAt: Date): Promise<void> {
  try {
    await connectDB();
    
    // Find all leads with this email that haven't been converted yet
    const unconvertedLeads = await LeadCapture.find({
      email: userEmail.toLowerCase(),
      convertedAt: { $exists: false },
    });

    // Update all unconverted leads for this email
    if (unconvertedLeads.length > 0) {
      await LeadCapture.updateMany(
        { email: userEmail.toLowerCase(), convertedAt: { $exists: false } },
        {
          $set: {
            convertedAt,
            userId,
          },
        }
      );
    }
  } catch (error) {
    // Don't throw - conversion tracking shouldn't break signup flow
    console.error('Error marking lead as converted:', error);
  }
}

/**
 * Checks if a user email has any unconverted leads
 * Useful for determining if we should track conversion
 */
export async function hasUnconvertedLeads(userEmail: string): Promise<boolean> {
  try {
    await connectDB();
    const count = await LeadCapture.countDocuments({
      email: userEmail.toLowerCase(),
      convertedAt: { $exists: false },
    });
    return count > 0;
  } catch (error) {
    console.error('Error checking unconverted leads:', error);
    return false;
  }
}
