/**
 * Fraud prevention utilities for referral system
 * 
 * Prevents fraudulent referral signups through:
 * - Rate limiting by IP and device fingerprint
 * - Duplicate signup detection
 * - Suspicious pattern detection
 */

import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import ReferralClick from '@/models/ReferralClick';
import User from '@/models/User';

export interface FraudCheckResult {
  isFraud: boolean;
  reason?: string;
  riskScore: number; // 0-100, higher = more suspicious
}

/**
 * Generates a simple device fingerprint from request headers
 * This is a basic implementation - can be enhanced with more sophisticated fingerprinting
 */
export function generateDeviceFingerprint(request: NextRequest): string {
  const userAgent = request.headers.get('user-agent') || '';
  const acceptLanguage = request.headers.get('accept-language') || '';
  const acceptEncoding = request.headers.get('accept-encoding') || '';
  
  // Simple fingerprint: combine key headers
  const fingerprint = `${userAgent}|${acceptLanguage}|${acceptEncoding}`;
  
  // Hash it (simple hash for basic fingerprinting)
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(36);
}

/**
 * Gets IP address from request headers
 */
export function getIpAddress(request: NextRequest): string | null {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwardedFor.split(',')[0].trim();
  }
  
  return realIp || null;
}

/**
 * Checks for rate limiting violations
 * Returns true if rate limit is exceeded
 */
async function checkRateLimit(
  ipAddress: string | null,
  deviceFingerprint: string,
  referralCode: string,
  windowMinutes: number = 60,
  maxClicks: number = 10
): Promise<{ exceeded: boolean; count: number }> {
  await connectDB();
  
  if (!ipAddress) {
    // Can't rate limit without IP
    return { exceeded: false, count: 0 };
  }
  
  const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);
  
  // Check clicks from same IP for same referral code
  const ipClicks = await ReferralClick.countDocuments({
    ipAddress,
    referralCode,
    clickedAt: { $gte: windowStart },
  });
  
  // Check clicks from same device fingerprint
  // Note: We'd need to store device fingerprint in ReferralClick model for this
  // For now, we'll rely on IP-based rate limiting
  
  return {
    exceeded: ipClicks >= maxClicks,
    count: ipClicks,
  };
}

/**
 * Checks for duplicate signups from same IP/device
 */
async function checkDuplicateSignup(
  email: string,
  ipAddress: string | null,
  _deviceFingerprint: string
): Promise<{ isDuplicate: boolean; existingUser?: any; recentSignupsFromIp?: number }> {
  await connectDB();

  // Check if email already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return { isDuplicate: true, existingUser };
  }

  // Check for recent signups from same IP (within last 24 hours)
  let recentSignupsFromIp = 0;
  if (ipAddress) {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    recentSignupsFromIp = await User.countDocuments({
      signupIp: ipAddress,
      createdAt: { $gte: oneDayAgo },
    });
  }

  return { isDuplicate: false, recentSignupsFromIp };
}

/**
 * Checks for suspicious patterns in referral clicks
 */
async function checkSuspiciousPatterns(
  referralCode: string,
  ipAddress: string | null
): Promise<{ isSuspicious: boolean; patterns: string[] }> {
  await connectDB();
  
  const patterns: string[] = [];
  let isSuspicious = false;
  
  if (!ipAddress) {
    return { isSuspicious: false, patterns: [] };
  }
  
  // Pattern 1: Too many clicks from same IP in short time
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentClicks = await ReferralClick.countDocuments({
    ipAddress,
    referralCode,
    clickedAt: { $gte: oneHourAgo },
  });
  
  if (recentClicks > 20) {
    patterns.push(`Too many clicks from same IP (${recentClicks} in last hour)`);
    isSuspicious = true;
  }
  
  // Pattern 2: Many clicks but low conversion rate
  const totalClicks = await ReferralClick.countDocuments({ referralCode });
  const convertedClicks = await ReferralClick.countDocuments({
    referralCode,
    converted: true,
  });
  
  if (totalClicks > 50) {
    const conversionRate = (convertedClicks / totalClicks) * 100;
    if (conversionRate < 5) {
      patterns.push(`Low conversion rate (${conversionRate.toFixed(1)}% with ${totalClicks} clicks)`);
      isSuspicious = true;
    }
  }
  
  // Pattern 3: Same IP clicking multiple referral codes
  const differentCodes = await ReferralClick.distinct('referralCode', {
    ipAddress,
    clickedAt: { $gte: oneHourAgo },
  });
  
  if (differentCodes.length > 5) {
    patterns.push(`Same IP clicking multiple referral codes (${differentCodes.length} codes)`);
    isSuspicious = true;
  }
  
  return { isSuspicious, patterns };
}

/**
 * Main fraud check function
 * Checks for various fraud indicators and returns a risk assessment
 */
export async function checkReferralFraud(
  request: NextRequest,
  referralCode: string,
  email?: string
): Promise<FraudCheckResult> {
  await connectDB();
  
  const ipAddress = getIpAddress(request);
  const deviceFingerprint = generateDeviceFingerprint(request);
  
  let riskScore = 0;
  const reasons: string[] = [];
  
  // Check 1: Rate limiting
  const rateLimit = await checkRateLimit(ipAddress, deviceFingerprint, referralCode);
  if (rateLimit.exceeded) {
    riskScore += 50;
    reasons.push(`Rate limit exceeded: ${rateLimit.count} clicks in last hour`);
  } else if (rateLimit.count > 5) {
    riskScore += 20;
    reasons.push(`High click volume: ${rateLimit.count} clicks in last hour`);
  }
  
  // Check 2: Duplicate signup (if email provided)
  if (email) {
    const duplicateCheck = await checkDuplicateSignup(email, ipAddress, deviceFingerprint);
    if (duplicateCheck.isDuplicate) {
      riskScore += 100; // Maximum risk - duplicate signup
      reasons.push('Duplicate email signup detected');
    }
    // Flag multiple signups from same IP in 24 hours
    if (duplicateCheck.recentSignupsFromIp && duplicateCheck.recentSignupsFromIp >= 3) {
      riskScore += 40;
      reasons.push(`Multiple signups from same IP (${duplicateCheck.recentSignupsFromIp} in last 24h)`);
    }
  }
  
  // Check 3: Suspicious patterns
  const suspicious = await checkSuspiciousPatterns(referralCode, ipAddress);
  if (suspicious.isSuspicious) {
    riskScore += 30;
    reasons.push(...suspicious.patterns);
  }
  
  // Check 4: No IP address (suspicious but not necessarily fraud)
  if (!ipAddress) {
    riskScore += 10;
    reasons.push('No IP address detected');
  }
  
  // Determine if fraud based on risk score
  const isFraud = riskScore >= 70; // Threshold for blocking
  
  return {
    isFraud,
    reason: reasons.length > 0 ? reasons.join('; ') : undefined,
    riskScore: Math.min(riskScore, 100), // Cap at 100
  };
}

/**
 * Checks if a referral click should be blocked due to fraud
 */
export async function shouldBlockReferralClick(
  request: NextRequest,
  referralCode: string
): Promise<{ block: boolean; reason?: string }> {
  const fraudCheck = await checkReferralFraud(request, referralCode);
  
  if (fraudCheck.isFraud) {
    return {
      block: true,
      reason: fraudCheck.reason,
    };
  }
  
  return { block: false };
}

/**
 * Checks if a signup should be blocked due to fraud
 */
export async function shouldBlockSignup(
  request: NextRequest,
  email: string,
  referralCode?: string
): Promise<{ block: boolean; reason?: string }> {
  // Always check for duplicate email (already handled in signup route, but double-check)
  await connectDB();
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return {
      block: true,
      reason: 'Email already registered',
    };
  }
  
  // If referral code provided, check for fraud
  if (referralCode) {
    const fraudCheck = await checkReferralFraud(request, referralCode, email);
    if (fraudCheck.isFraud) {
      return {
        block: true,
        reason: fraudCheck.reason,
      };
    }
  }
  
  return { block: false };
}
