/**
 * Activation tracking utilities
 *
 * Activation Definition: User has (1) created a project, (2) generated 300+
 * cumulative AI words, AND (3) been active on 2+ different calendar days.
 * This captures engagement depth and retention, not just acquisition speed.
 */

import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import Activation, { IActivation } from '@/models/Activation';
import DailyUsage from '@/models/DailyUsage';
import User from '@/models/User';

const ACTIVATION_WORD_THRESHOLD = 300;
const ACTIVATION_ACTIVE_DAYS_THRESHOLD = 2;

export interface ActivationAttribution {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  channel?: string;
  source?: string;
  country?: string;
  landingPage?: string;
  toolEntryPoint?: 'plagiarism' | 'import' | 'topic' | 'direct';
}

/**
 * Derives channel from UTM medium
 */
export function deriveChannel(utmMedium?: string): string {
  if (!utmMedium) return 'direct';

  const medium = utmMedium.toLowerCase();
  if (medium.includes('referral') || medium.includes('affiliate')) return 'referral';
  if (medium.includes('organic') || medium.includes('search')) return 'organic';
  // Check for exact "social" match or standalone "social" word, but not "paid_social"
  if (medium === 'social' || (medium.includes('social') && !medium.includes('paid'))) return 'social';
  if (medium.includes('paid') || medium.includes('cpc')) return 'paid';
  if (medium.includes('email')) return 'email';

  return medium;
}

/**
 * Gets or creates activation record for a user
 */
async function getOrCreateActivationRecord(userId: string): Promise<mongoose.Document & IActivation> {
  await connectDB();

  let activation: (mongoose.Document & IActivation) | null = await Activation.findOne({ userId }) as (mongoose.Document & IActivation) | null;

  if (!activation) {
    // Try to get attribution from user's signup data
    const user = await User.findOne({ email: userId });

    // Determine source from referral data
    let source = 'direct';
    let channel = 'direct';

    if (user?.referredBy) {
      source = 'user_referral';
      channel = 'referral';
    } else if (user?.referredByInfluencer) {
      source = 'influencer_referral';
      channel = 'referral';
    }

    activation = await Activation.create({
      userId,
      source,
      channel,
      isActivated: false,
    }) as mongoose.Document & IActivation;
  }

  return activation;
}

/**
 * Applies attribution data to an activation record
 */
function applyAttribution(activation: mongoose.Document & IActivation, attribution?: ActivationAttribution): void {
  if (!attribution) return;
  if (attribution.utmSource) activation.utmSource = attribution.utmSource;
  if (attribution.utmMedium) {
    activation.utmMedium = attribution.utmMedium;
    activation.channel = deriveChannel(attribution.utmMedium);
  }
  if (attribution.utmCampaign) activation.utmCampaign = attribution.utmCampaign;
  if (attribution.source) activation.source = attribution.source;
  if (attribution.country) activation.country = attribution.country;
  if (attribution.landingPage) activation.landingPage = attribution.landingPage;
  if (attribution.toolEntryPoint) activation.toolEntryPoint = attribution.toolEntryPoint;
}

/**
 * Checks all three activation conditions and marks user as activated if met.
 * Conditions: (1) project created, (2) 300+ AI words, (3) 2+ active days.
 * Safe to call repeatedly — returns early if already activated.
 */
export async function checkAndUpdateActivation(userId: string): Promise<boolean> {
  await connectDB();

  const activation = await Activation.findOne({ userId }) as (mongoose.Document & IActivation) | null;
  if (!activation || activation.isActivated) return activation?.isActivated ?? false;

  // Condition 1: project created
  if (!activation.firstProjectCreatedAt) return false;

  // Condition 2: 300+ cumulative AI words
  const usageRecords = await DailyUsage.find({ userId }).select('aiWordsGenerated date').lean();
  const totalAIWords = usageRecords.reduce((sum, r) => sum + (r.aiWordsGenerated || 0), 0);
  if (totalAIWords < ACTIVATION_WORD_THRESHOLD) return false;

  // Condition 3: active on 2+ different calendar days
  const distinctDays = new Set(usageRecords.map(r => r.date));
  if (distinctDays.size < ACTIVATION_ACTIVE_DAYS_THRESHOLD) return false;

  // All conditions met — activate
  const now = new Date();
  activation.isActivated = true;
  activation.activatedAt = now;
  activation.timeToActivation = Math.round(
    (now.getTime() - activation.firstProjectCreatedAt.getTime()) / (1000 * 60)
  );
  await activation.save();

  return true;
}

/**
 * Records first project creation
 */
export async function recordFirstProjectCreated(
  userId: string,
  attribution?: ActivationAttribution
): Promise<{ activated: boolean; timeToActivation?: number }> {
  await connectDB();

  const activation = await getOrCreateActivationRecord(userId);

  // Only record if this is the first project
  if (!activation.firstProjectCreatedAt) {
    activation.firstProjectCreatedAt = new Date();
    applyAttribution(activation, attribution);
    await activation.save();
  }

  // Check activation conditions
  const activated = await checkAndUpdateActivation(userId);
  if (activated) {
    const updated = await Activation.findOne({ userId });
    return { activated: true, timeToActivation: updated?.timeToActivation ?? undefined };
  }

  return { activated: false };
}

/**
 * Records first output generation
 */
export async function recordFirstOutputGenerated(
  userId: string,
  attribution?: ActivationAttribution
): Promise<{ activated: boolean; timeToActivation?: number }> {
  await connectDB();

  const activation = await getOrCreateActivationRecord(userId);

  // Only record if this is the first output
  if (!activation.firstOutputGeneratedAt) {
    activation.firstOutputGeneratedAt = new Date();
    applyAttribution(activation, attribution);
    await activation.save();
  }

  // Check activation conditions
  const activated = await checkAndUpdateActivation(userId);
  if (activated) {
    const updated = await Activation.findOne({ userId });
    return { activated: true, timeToActivation: updated?.timeToActivation ?? undefined };
  }

  return { activated: false };
}

/**
 * Gets activation status for a user
 */
export async function getActivationStatus(userId: string): Promise<{
  isActivated: boolean;
  firstProjectCreatedAt: Date | null;
  firstOutputGeneratedAt: Date | null;
  activatedAt: Date | null;
  timeToActivation: number | null;
}> {
  await connectDB();

  const activation = await Activation.findOne({ userId });

  if (!activation) {
    return {
      isActivated: false,
      firstProjectCreatedAt: null,
      firstOutputGeneratedAt: null,
      activatedAt: null,
      timeToActivation: null,
    };
  }

  return {
    isActivated: activation.isActivated,
    firstProjectCreatedAt: activation.firstProjectCreatedAt,
    firstOutputGeneratedAt: activation.firstOutputGeneratedAt,
    activatedAt: activation.activatedAt,
    timeToActivation: activation.timeToActivation,
  };
}

/**
 * Updates attribution data for a user's activation record
 * Useful for capturing attribution data that wasn't available at signup
 */
export async function updateActivationAttribution(
  userId: string,
  attribution: ActivationAttribution
): Promise<void> {
  await connectDB();

  const activation = await getOrCreateActivationRecord(userId);

  if (attribution.utmSource && !activation.utmSource) {
    activation.utmSource = attribution.utmSource;
  }
  if (attribution.utmMedium && !activation.utmMedium) {
    activation.utmMedium = attribution.utmMedium;
    activation.channel = deriveChannel(attribution.utmMedium);
  }
  if (attribution.utmCampaign && !activation.utmCampaign) {
    activation.utmCampaign = attribution.utmCampaign;
  }
  if (attribution.source && !activation.source) {
    activation.source = attribution.source;
  }
  if (attribution.country && !activation.country) {
    activation.country = attribution.country;
  }
  if (attribution.landingPage && !activation.landingPage) {
    activation.landingPage = attribution.landingPage;
  }
  if (attribution.toolEntryPoint && !activation.toolEntryPoint) {
    activation.toolEntryPoint = attribution.toolEntryPoint;
  }

  await activation.save();
}

/**
 * Gets activation rate by dimension
 */
export async function getActivationRateByDimension(
  dimension: 'channel' | 'source' | 'country' | 'toolEntryPoint',
  value?: string
): Promise<{
  total: number;
  activated: number;
  activationRate: number;
}> {
  await connectDB();

  const query: any = {};
  if (value) {
    query[dimension] = value;
  }

  const total = await Activation.countDocuments(query);
  const activated = await Activation.countDocuments({ ...query, isActivated: true });

  return {
    total,
    activated,
    activationRate: total > 0 ? (activated / total) * 100 : 0,
  };
}

/**
 * Extracts attribution data from a NextRequest
 */
export function extractAttributionFromRequest(request: NextRequest): ActivationAttribution {
  const url = new URL(request.url);
  const searchParams = url.searchParams;

  const utmSource = searchParams.get('utm_source') || undefined;
  const utmMedium = searchParams.get('utm_medium') || undefined;
  const utmCampaign = searchParams.get('utm_campaign') || undefined;

  // Get country from headers (Vercel provides this)
  const country = request.headers.get('x-vercel-ip-country') ||
                  request.headers.get('cf-ipcountry') ||
                  undefined;

  // Get landing page from referer or origin
  const referer = request.headers.get('referer');
  const origin = request.headers.get('origin');
  let landingPage: string | undefined = undefined;
  if (referer) {
    try {
      landingPage = new URL(referer).pathname;
    } catch {
      // Invalid referer URL, ignore
    }
  } else if (origin) {
    try {
      landingPage = new URL(origin).pathname;
    } catch {
      // Invalid origin URL, ignore
    }
  }

  // Determine tool entry point from referer or pathname
  let toolEntryPoint: 'plagiarism' | 'import' | 'topic' | 'direct' | undefined = undefined;
  const pathname = url.pathname;
  if (pathname.includes('/tools/plagiarism') || referer?.includes('/tools/plagiarism')) {
    toolEntryPoint = 'plagiarism';
  } else if (pathname.includes('/dashboard/import') || referer?.includes('/dashboard/import')) {
    toolEntryPoint = 'import';
  } else if (pathname.includes('/topics') || referer?.includes('/topics')) {
    toolEntryPoint = 'topic';
  } else {
    toolEntryPoint = 'direct';
  }

  return {
    utmSource,
    utmMedium,
    utmCampaign,
    channel: utmMedium ? deriveChannel(utmMedium) : undefined,
    source: utmSource,
    country,
    landingPage,
    toolEntryPoint,
  };
}
