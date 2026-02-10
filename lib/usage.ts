import { format } from 'date-fns';
import DailyUsage from '@/models/DailyUsage';
import User from '@/models/User';
import { PLAN_LIMITS, UsageLimits, PlanType } from '@/types';
import connectDB from './mongodb';

export async function getUserUsageToday(userEmail: string) {
  await connectDB();
  
  // Get user by email to get their ID
  const user = await User.findOne({ email: userEmail });
  if (!user) {
    throw new Error('User not found');
  }
  
  const userId = user._id.toString();
  const today = format(new Date(), 'yyyy-MM-dd');
  
  let usage = await DailyUsage.findOne({ userId, date: today });
  
  if (!usage) {
    usage = await DailyUsage.create({
      userId,
      date: today,
      aiWordsGenerated: 0,
      plagiarismChecks: 0,
    });
  }
  
  return usage;
}

export async function getUserUsageTodayByUserId(userId: string) {
  await connectDB();
  
  const today = format(new Date(), 'yyyy-MM-dd');
  
  let usage = await DailyUsage.findOne({ userId, date: today });
  
  if (!usage) {
    usage = await DailyUsage.create({
      userId,
      date: today,
      aiWordsGenerated: 0,
      plagiarismChecks: 0,
    });
  }
  
  return usage;
}

export async function checkAIWordLimit(userId: string, wordsToGenerate: number): Promise<{ allowed: boolean; remaining: number; limit: number }> {
  await connectDB();
  
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }
  
  const limits = PLAN_LIMITS[user.plan as PlanType];
  
  // Pro and Team plans have unlimited words
  if (limits.aiWordsPerDay === Infinity) {
    return { allowed: true, remaining: Infinity, limit: Infinity };
  }
  
  // Use userId directly instead of looking up user again by email
  const usage = await getUserUsageTodayByUserId(userId);
  const remaining = limits.aiWordsPerDay - usage.aiWordsGenerated;
  
  return {
    allowed: remaining >= wordsToGenerate,
    remaining,
    limit: limits.aiWordsPerDay,
  };
}

export async function incrementParaphraseUses(userId: string, words: number) {
  await connectDB();

  const today = format(new Date(), 'yyyy-MM-dd');

  await DailyUsage.findOneAndUpdate(
    { userId, date: today },
    { $inc: { paraphraseUses: 1, aiWordsGenerated: words } },
    { upsert: true, new: true }
  );
}

export async function incrementAIWords(userId: string, words: number) {
  await connectDB();
  
  const today = format(new Date(), 'yyyy-MM-dd');
  
  await DailyUsage.findOneAndUpdate(
    { userId, date: today },
    { $inc: { aiWordsGenerated: words } },
    { upsert: true, new: true }
  );
}

export async function checkPlagiarismLimit(userEmail: string): Promise<{ allowed: boolean; remaining: number; limit: number }> {
  await connectDB();
  
  // Get user by email to get their ID and plan
  const user = await User.findOne({ email: userEmail });
  if (!user) {
    throw new Error('User not found');
  }
  
  const limits = PLAN_LIMITS[user.plan as PlanType];
  
  // Pro and Team plans have unlimited checks
  if (limits.plagiarismChecksPerDay === Infinity) {
    return { allowed: true, remaining: Infinity, limit: Infinity };
  }
  
  // Get today's usage
  const usage = await getUserUsageToday(userEmail);
  const remaining = limits.plagiarismChecksPerDay - usage.plagiarismChecks;
  
  return {
    allowed: remaining > 0,
    remaining,
    limit: limits.plagiarismChecksPerDay,
  };
}

/**
 * Atomically checks and increments plagiarism checks count.
 * This prevents race conditions where multiple concurrent requests could exceed the limit.
 * 
 * @param userEmail - User's email address
 * @returns Object with success status, remaining checks, and limit, or null if limit reached
 */
export async function tryIncrementPlagiarismChecks(userEmail: string): Promise<{ 
  success: boolean; 
  remaining: number; 
  limit: number;
  newCount: number;
} | null> {
  await connectDB();
  
  // Get user by email to get their ID and plan
  const user = await User.findOne({ email: userEmail });
  if (!user) {
    throw new Error('User not found');
  }
  
  const userId = user._id.toString();
  const limits = PLAN_LIMITS[user.plan as PlanType];
  
  // Pro and Team plans have unlimited checks - increment without limit check
  if (limits.plagiarismChecksPerDay === Infinity) {
    const today = format(new Date(), 'yyyy-MM-dd');
    const updated = await DailyUsage.findOneAndUpdate(
      { userId, date: today },
      { $inc: { plagiarismChecks: 1 } },
      { upsert: true, new: true }
    );
    return {
      success: true,
      remaining: Infinity,
      limit: Infinity,
      newCount: updated.plagiarismChecks,
    };
  }
  
  const today = format(new Date(), 'yyyy-MM-dd');
  const limit = limits.plagiarismChecksPerDay;
  
  // Atomically check and increment: only increment if current count is less than limit
  // This prevents race conditions where multiple requests check the limit simultaneously
  // Strategy: Try to increment, but only if count is below limit OR document doesn't exist
  // MongoDB's $lt operator returns false for non-existent fields, so we need to handle that
  
  // First, ensure the document exists (create if needed with 0 count)
  await DailyUsage.findOneAndUpdate(
    { userId, date: today },
    { $setOnInsert: { userId, date: today, aiWordsGenerated: 0, plagiarismChecks: 0 } },
    { upsert: true }
  );
  
  // Now atomically increment only if count is below limit
  const updated = await DailyUsage.findOneAndUpdate(
    {
      userId,
      date: today,
      plagiarismChecks: { $lt: limit }, // Only match if current count is below limit
    },
    { $inc: { plagiarismChecks: 1 } },
    { new: true }
  );
  
  // If update succeeded, we got a document back and the increment happened
  if (updated) {
    const remaining = limit - updated.plagiarismChecks;
    return {
      success: true,
      remaining: Math.max(0, remaining), // Ensure non-negative
      limit,
      newCount: updated.plagiarismChecks,
    };
  }
  
  // Update failed because limit was reached - get current usage for error message
  const currentUsage = await getUserUsageToday(userEmail);
  return {
    success: false,
    remaining: 0,
    limit,
    newCount: currentUsage.plagiarismChecks,
  };
}

export async function incrementPlagiarismChecks(userEmail: string) {
  await connectDB();
  
  // Get user by email to get their ID
  const user = await User.findOne({ email: userEmail });
  if (!user) {
    throw new Error('User not found');
  }
  
  const userId = user._id.toString();
  const today = format(new Date(), 'yyyy-MM-dd');
  
  await DailyUsage.findOneAndUpdate(
    { userId, date: today },
    { $inc: { plagiarismChecks: 1 } },
    { upsert: true, new: true }
  );
}

export async function checkAILimit(userEmail: string): Promise<{ allowed: boolean; remaining: number; limit: number }> {
  await connectDB();
  
  // Get user by email to get their ID and plan
  const user = await User.findOne({ email: userEmail });
  if (!user) {
    throw new Error('User not found');
  }
  
  const limits = PLAN_LIMITS[user.plan as PlanType];
  
  // Pro and Team plans have unlimited AI usage
  if (limits.aiWordsPerDay === Infinity) {
    return { allowed: true, remaining: Infinity, limit: Infinity };
  }
  
  // Get today's usage
  const usage = await getUserUsageToday(userEmail);
  const remaining = limits.aiWordsPerDay - usage.aiWordsGenerated;
  
  return {
    allowed: remaining > 0,
    remaining,
    limit: limits.aiWordsPerDay,
  };
}

export async function incrementAIUsage(userEmail: string) {
  await connectDB();
  
  // Get user by email to get their ID
  const user = await User.findOne({ email: userEmail });
  if (!user) {
    throw new Error('User not found');
  }
  
  const userId = user._id.toString();
  const today = format(new Date(), 'yyyy-MM-dd');
  
  // Increment by 1 for each autocomplete suggestion
  await DailyUsage.findOneAndUpdate(
    { userId, date: today },
    { $inc: { aiWordsGenerated: 1 } },
    { upsert: true, new: true }
  );
}

export async function getUserLimits(userEmail: string): Promise<UsageLimits> {
  await connectDB();
  
  const user = await User.findOne({ email: userEmail });
  if (!user) {
    throw new Error('User not found');
  }
  
  return PLAN_LIMITS[user.plan as PlanType];
}

