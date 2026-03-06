import { format, subDays } from 'date-fns';
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

export async function checkParaphraseLimit(userId: string): Promise<{ allowed: boolean; remaining: number; limit: number }> {
  await connectDB();

  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  const limits = PLAN_LIMITS[user.plan as PlanType];

  if (limits.paraphrasePerDay === Infinity) {
    return { allowed: true, remaining: Infinity, limit: Infinity };
  }

  const usage = await getUserUsageTodayByUserId(userId);
  const used = usage.paraphraseUses || 0;
  const remaining = limits.paraphrasePerDay - used;

  return {
    allowed: remaining > 0,
    remaining: Math.max(0, remaining),
    limit: limits.paraphrasePerDay,
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

  const user = await User.findOne({ email: userEmail });
  if (!user) {
    throw new Error('User not found');
  }

  const limits = PLAN_LIMITS[user.plan as PlanType];

  // Weekly limit (free plan)
  if (limits.plagiarismChecksPerWeek !== undefined) {
    const userId = user._id.toString();
    const weeklyLimit = limits.plagiarismChecksPerWeek;
    const sevenDaysAgo = format(subDays(new Date(), 6), 'yyyy-MM-dd');
    const weeklyDocs = await DailyUsage.find({ userId, date: { $gte: sevenDaysAgo } });
    const weeklyTotal = weeklyDocs.reduce((sum, doc) => sum + (doc.plagiarismChecks || 0), 0);
    const remaining = weeklyLimit - weeklyTotal;
    return { allowed: remaining > 0, remaining: Math.max(0, remaining), limit: weeklyLimit };
  }

  // Unlimited plans
  if (limits.plagiarismChecksPerDay === Infinity) {
    return { allowed: true, remaining: Infinity, limit: Infinity };
  }

  // Daily limit
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

  const user = await User.findOne({ email: userEmail });
  if (!user) {
    throw new Error('User not found');
  }

  const userId = user._id.toString();
  const limits = PLAN_LIMITS[user.plan as PlanType];

  // Weekly limit (free plan) — checked before the Infinity gate below
  if (limits.plagiarismChecksPerWeek !== undefined) {
    const weeklyLimit = limits.plagiarismChecksPerWeek;
    const sevenDaysAgo = format(subDays(new Date(), 6), 'yyyy-MM-dd');
    const weeklyDocs = await DailyUsage.find({ userId, date: { $gte: sevenDaysAgo } });
    const weeklyTotal = weeklyDocs.reduce((sum, doc) => sum + (doc.plagiarismChecks || 0), 0);

    if (weeklyTotal >= weeklyLimit) {
      return { success: false, remaining: 0, limit: weeklyLimit, newCount: weeklyTotal };
    }

    const today = format(new Date(), 'yyyy-MM-dd');
    const updated = await DailyUsage.findOneAndUpdate(
      { userId, date: today },
      { $inc: { plagiarismChecks: 1 } },
      { upsert: true, new: true }
    );
    const newWeeklyTotal = weeklyTotal + 1;
    return {
      success: true,
      remaining: Math.max(0, weeklyLimit - newWeeklyTotal),
      limit: weeklyLimit,
      newCount: updated.plagiarismChecks,
    };
  }

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

  // Daily limit (standard plan)
  const today = format(new Date(), 'yyyy-MM-dd');
  const limit = limits.plagiarismChecksPerDay;

  // First, ensure the document exists (create if needed with 0 count)
  await DailyUsage.findOneAndUpdate(
    { userId, date: today },
    { $setOnInsert: { userId, date: today, aiWordsGenerated: 0, plagiarismChecks: 0 } },
    { upsert: true }
  );

  // Atomically increment only if count is below limit
  const updated = await DailyUsage.findOneAndUpdate(
    {
      userId,
      date: today,
      plagiarismChecks: { $lt: limit },
    },
    { $inc: { plagiarismChecks: 1 } },
    { new: true }
  );

  if (updated) {
    const remaining = limit - updated.plagiarismChecks;
    return {
      success: true,
      remaining: Math.max(0, remaining),
      limit,
      newCount: updated.plagiarismChecks,
    };
  }

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

export async function checkLitReviewLimit(userId: string): Promise<{ allowed: boolean; remaining: number; limit: number }> {
  await connectDB();

  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  const limits = PLAN_LIMITS[user.plan as PlanType];

  if (limits.litReviewAnalysesPerDay === Infinity) {
    return { allowed: true, remaining: Infinity, limit: Infinity };
  }

  const usage = await getUserUsageTodayByUserId(userId);
  const used = usage.litReviewAnalyses || 0;
  const remaining = limits.litReviewAnalysesPerDay - used;

  return {
    allowed: remaining > 0,
    remaining: Math.max(0, remaining),
    limit: limits.litReviewAnalysesPerDay,
  };
}

export async function incrementLitReviewUses(userId: string, words: number) {
  await connectDB();

  const today = format(new Date(), 'yyyy-MM-dd');

  await DailyUsage.findOneAndUpdate(
    { userId, date: today },
    { $inc: { litReviewAnalyses: 1, aiWordsGenerated: words } },
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

