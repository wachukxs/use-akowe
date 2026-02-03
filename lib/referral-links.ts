/**
 * Utility functions for creating referral links with UTM parameters
 * Ensures all referral links have proper attribution to fix "Unassigned" traffic
 */

const DEFAULT_BASE_URL = 'https://useakowe.com';

/**
 * Builds a referral link with default UTM parameters
 * @param referralCode - The referral code to include
 * @param baseUrl - Optional base URL (defaults to https://useakowe.com)
 * @param options - Optional UTM overrides
 * @returns Complete referral URL with UTMs
 */
export function buildReferralLink(
  referralCode: string,
  baseUrl: string = DEFAULT_BASE_URL,
  options?: {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_content?: string;
  }
): string {
  const url = new URL(baseUrl);
  
  // Add referral code
  url.searchParams.set('ref', referralCode);
  
  // Add default UTM parameters (can be overridden)
  url.searchParams.set('utm_source', options?.utm_source || 'referral');
  url.searchParams.set('utm_medium', options?.utm_medium || 'referral');
  url.searchParams.set('utm_campaign', options?.utm_campaign || 'referral');
  
  if (options?.utm_content) {
    url.searchParams.set('utm_content', options.utm_content);
  }
  
  return url.toString();
}

/**
 * Builds a signup link with referral code and UTMs
 * @param referralCode - The referral code to include
 * @param baseUrl - Optional base URL
 * @param options - Optional UTM overrides
 * @returns Complete signup URL with referral code and UTMs
 */
export function buildSignupLink(
  referralCode: string,
  baseUrl: string = DEFAULT_BASE_URL,
  options?: {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_content?: string;
  }
): string {
  const url = new URL(`${baseUrl}/auth/signup`);
  
  // Add referral code
  url.searchParams.set('ref', referralCode);
  
  // Add default UTM parameters
  url.searchParams.set('utm_source', options?.utm_source || 'referral');
  url.searchParams.set('utm_medium', options?.utm_medium || 'referral');
  url.searchParams.set('utm_campaign', options?.utm_campaign || 'referral');
  
  if (options?.utm_content) {
    url.searchParams.set('utm_content', options.utm_content);
  }
  
  return url.toString();
}

/**
 * Builds an influencer referral link with specific UTMs
 * @param referralCode - The influencer's referral code
 * @param baseUrl - Optional base URL
 * @returns Complete referral URL with influencer-specific UTMs
 */
export function buildInfluencerLink(
  referralCode: string,
  baseUrl: string = DEFAULT_BASE_URL
): string {
  return buildReferralLink(referralCode, baseUrl, {
    utm_source: 'influencer',
    utm_medium: 'referral',
    utm_campaign: 'influencer',
  });
}

/**
 * Builds a partner referral link with specific UTMs
 * @param referralCode - The partner's referral code
 * @param partnerName - Name of the partner (for utm_content)
 * @param baseUrl - Optional base URL
 * @returns Complete referral URL with partner-specific UTMs
 */
export function buildPartnerLink(
  referralCode: string,
  partnerName: string,
  baseUrl: string = DEFAULT_BASE_URL
): string {
  return buildReferralLink(referralCode, baseUrl, {
    utm_source: 'partner',
    utm_medium: 'referral',
    utm_campaign: 'partner',
    utm_content: partnerName,
  });
}

/**
 * Normalizes UTM parameters from a URL
 * Ensures default values are set if missing
 * @param url - The URL to normalize
 * @returns URL with normalized UTMs
 */
export function normalizeUTMParams(url: string | URL): string {
  const urlObj = typeof url === 'string' ? new URL(url) : url;
  
  // If no UTMs exist and there's a ref parameter, add default UTMs
  const hasRef = urlObj.searchParams.has('ref');
  const hasUTM = urlObj.searchParams.has('utm_source') || 
                 urlObj.searchParams.has('utm_medium') || 
                 urlObj.searchParams.has('utm_campaign');
  
  if (hasRef && !hasUTM) {
    urlObj.searchParams.set('utm_source', 'referral');
    urlObj.searchParams.set('utm_medium', 'referral');
    urlObj.searchParams.set('utm_campaign', 'referral');
  }
  
  return urlObj.toString();
}
