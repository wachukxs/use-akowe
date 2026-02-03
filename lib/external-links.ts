/**
 * Utility functions for enforcing UTM parameters on external links
 * Ensures all outbound links have proper attribution to fix "Unassigned" traffic
 */

const AKOWE_DOMAINS = ['useakowe.com', 'www.useakowe.com', 'localhost', 'localhost:3000'];

/**
 * Checks if a URL is external (not on Akowe domain)
 * @param url - The URL to check (can be string or URL object)
 * @returns true if the URL is external
 */
export function isExternalUrl(url: string | URL): boolean {
  try {
    const urlObj = typeof url === 'string' ? new URL(url) : url;
    const hostname = urlObj.hostname.toLowerCase();
    
    // Check if it's an internal link (relative or same domain)
    if (!hostname) {
      return false; // Relative URL, not external
    }
    
    // Check if it's one of our domains
    return !AKOWE_DOMAINS.some(domain => hostname === domain || hostname.endsWith(`.${domain}`));
  } catch {
    // Invalid URL, treat as internal
    return false;
  }
}

/**
 * Adds UTM parameters to an external URL
 * Preserves existing UTMs if present, otherwise adds defaults based on context
 * @param url - The URL to add UTMs to
 * @param options - UTM parameter options
 * @returns URL string with UTM parameters
 */
export function addUTMToExternalLink(
  url: string | URL,
  options?: {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_content?: string;
  }
): string {
  try {
    const urlObj = typeof url === 'string' ? new URL(url) : new URL(url.toString());
    
    // Only add UTMs to external links
    if (!isExternalUrl(urlObj)) {
      return urlObj.toString();
    }
    
    // Preserve existing UTMs or add defaults
    const source = options?.utm_source || urlObj.searchParams.get('utm_source') || 'akowe';
    const medium = options?.utm_medium || urlObj.searchParams.get('utm_medium') || 'referral';
    const campaign = options?.utm_campaign || urlObj.searchParams.get('utm_campaign') || 'external_link';
    const content = options?.utm_content || urlObj.searchParams.get('utm_content') || undefined;
    
    // Set UTM parameters
    urlObj.searchParams.set('utm_source', source);
    urlObj.searchParams.set('utm_medium', medium);
    urlObj.searchParams.set('utm_campaign', campaign);
    
    if (content) {
      urlObj.searchParams.set('utm_content', content);
    }
    
    return urlObj.toString();
  } catch {
    // If URL parsing fails, return as-is
    return typeof url === 'string' ? url : url.toString();
  }
}

/**
 * Creates an external link with UTM parameters for educational resources
 * @param url - The external URL
 * @param resourceName - Name of the resource (for utm_content)
 * @returns URL string with educational resource UTMs
 */
export function buildEducationalResourceLink(
  url: string,
  resourceName?: string
): string {
  return addUTMToExternalLink(url, {
    utm_source: 'akowe',
    utm_medium: 'referral',
    utm_campaign: 'educational_resource',
    utm_content: resourceName,
  });
}

/**
 * Creates an external link with UTM parameters for forms
 * @param url - The external URL (e.g., Google Form)
 * @param formName - Name of the form (for utm_content)
 * @returns URL string with form UTMs
 */
export function buildFormLink(
  url: string,
  formName?: string
): string {
  return addUTMToExternalLink(url, {
    utm_source: 'akowe',
    utm_medium: 'referral',
    utm_campaign: 'form',
    utm_content: formName,
  });
}

/**
 * Creates an external link with UTM parameters for social media
 * @param url - The external URL
 * @param platform - Social media platform name (for utm_content)
 * @returns URL string with social media UTMs
 */
export function buildSocialMediaLink(
  url: string,
  platform?: string
): string {
  return addUTMToExternalLink(url, {
    utm_source: 'akowe',
    utm_medium: 'social',
    utm_campaign: 'social_share',
    utm_content: platform,
  });
}

/**
 * Creates an external link with UTM parameters for documentation/external docs
 * @param url - The external URL
 * @param docName - Name of the documentation (for utm_content)
 * @returns URL string with documentation UTMs
 */
export function buildDocumentationLink(
  url: string,
  docName?: string
): string {
  return addUTMToExternalLink(url, {
    utm_source: 'akowe',
    utm_medium: 'referral',
    utm_campaign: 'documentation',
    utm_content: docName,
  });
}
