import mongoose from 'mongoose';

const REFERRAL_CODE_LENGTH = 8;

/**
 * Generates a URL-friendly referral code
 * Format: 8 alphanumeric characters (lowercase letters + numbers)
 * 36^8 ≈ 2.8 trillion possible combinations
 */
function generateReferralCodeString(length: number = REFERRAL_CODE_LENGTH): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Checks if a referral code exists in either User or Influencer collection
 * Uses a single aggregation query across both collections for efficiency
 */
async function isReferralCodeTaken(code: string): Promise<boolean> {
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Database not connected');
  }
  
  // Use $unionWith to check both collections in a single query
  const result = await db.collection('users').aggregate([
    { $match: { referralCode: code } },
    { $limit: 1 },
    { $project: { _id: 1 } },
    {
      $unionWith: {
        coll: 'influencers',
        pipeline: [
          { $match: { referralCode: code } },
          { $limit: 1 },
          { $project: { _id: 1 } }
        ]
      }
    },
    { $limit: 1 }
  ]).toArray();
  
  return result.length > 0;
}

/**
 * Checks if an error is a MongoDB duplicate key error for referralCode
 */
export function isDuplicateReferralCodeError(error: unknown): boolean {
  if (error && typeof error === 'object' && 'code' in error) {
    const mongoError = error as { code: number; keyPattern?: Record<string, unknown> };
    return mongoError.code === 11000 && !!mongoError.keyPattern?.referralCode;
  }
  return false;
}

/**
 * Generates a unique referral code
 * 
 * Strategy:
 * 1. Generate a random 8-char code (36^8 ≈ 2.8 trillion combinations)
 * 2. Verify uniqueness with a single DB query across both collections
 * 3. Retry up to 5 times (should almost never need retries)
 * 4. Fallback to timestamp-based code for guaranteed uniqueness
 * 
 * Note: The unique indexes on referralCode in both User and Influencer schemas
 * provide the ultimate guarantee - if a duplicate somehow slips through,
 * MongoDB will reject the insert with a duplicate key error.
 */
export async function generateUniqueReferralCode(): Promise<string> {
  const maxAttempts = 5;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const code = generateReferralCodeString();
    
    // Single query to check both collections
    const isTaken = await isReferralCodeTaken(code);
    
    if (!isTaken) {
      return code;
    }
    
    // Log collision for monitoring (should be extremely rare)
    console.warn(`Referral code collision detected (attempt ${attempt + 1}): ${code}`);
  }
  
  // Fallback: timestamp + random suffix for guaranteed uniqueness
  const timestamp = Date.now().toString(36).slice(-4);
  const randomPart = generateReferralCodeString(4);
  return `${randomPart}${timestamp}`;
}

/**
 * Looks up a referral code and returns the referrer info
 * Returns null if code doesn't exist
 */
export async function lookupReferralCode(code: string): Promise<{
  type: 'user' | 'influencer';
  id: mongoose.Types.ObjectId;
} | null> {
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Database not connected');
  }
  
  // Check User collection first
  const user = await db.collection('users').findOne({ referralCode: code });
  if (user) {
    return {
      type: 'user',
      id: user._id as mongoose.Types.ObjectId,
    };
  }
  
  // Check Influencer collection
  const influencer = await db.collection('influencers').findOne({ referralCode: code });
  if (influencer) {
    return {
      type: 'influencer',
      id: influencer._id as mongoose.Types.ObjectId,
    };
  }
  
  return null;
}

/**
 * Ensures a user has a referral code, generating one if they don't
 * Returns the user's referral code (existing or newly created)
 * Handles duplicate key errors by retrying with a new code
 */
export async function ensureUserReferralCode(userId: string): Promise<string> {
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Database not connected');
  }
  
  const user = await db.collection('users').findOne({ 
    _id: new mongoose.Types.ObjectId(userId) 
  });
  
  if (!user) {
    throw new Error('User not found');
  }
  
  // If user already has a referral code, return it
  if (user.referralCode) {
    return user.referralCode;
  }
  
  // Try to set a referral code, with retry on duplicate key error
  const maxRetries = 3;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const newCode = await generateUniqueReferralCode();
    
    try {
      const result = await db.collection('users').updateOne(
        { _id: new mongoose.Types.ObjectId(userId), referralCode: { $exists: false } },
        { $set: { referralCode: newCode } }
      );
      
      if (result.modifiedCount > 0) {
        return newCode;
      }
      
      // If not modified, check if another process already set a code
      const updatedUser = await db.collection('users').findOne({ 
        _id: new mongoose.Types.ObjectId(userId) 
      });
      if (updatedUser?.referralCode) {
        return updatedUser.referralCode;
      }
    } catch (error) {
      if (isDuplicateReferralCodeError(error)) {
        console.warn(`Duplicate referral code on update (attempt ${attempt + 1}), retrying...`);
        continue;
      }
      throw error;
    }
  }
  
  throw new Error('Failed to generate unique referral code after multiple attempts');
}

/**
 * Helper to create a document with a referral code, retrying on duplicate key errors
 * Use this wrapper when creating Users or Influencers to handle race conditions
 */
export async function createWithReferralCode<T>(
  createFn: (referralCode: string) => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const referralCode = await generateUniqueReferralCode();
    
    try {
      return await createFn(referralCode);
    } catch (error) {
      if (isDuplicateReferralCodeError(error)) {
        console.warn(`Duplicate referral code on create (attempt ${attempt + 1}), retrying...`);
        continue;
      }
      throw error;
    }
  }
  
  throw new Error('Failed to create document with unique referral code after multiple attempts');
}
