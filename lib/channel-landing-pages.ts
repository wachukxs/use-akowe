/**
 * Channel-specific landing page utilities
 * 
 * Determines which landing page variant to show based on UTM parameters and channel
 * Different channels get different messaging and CTAs optimized for their intent
 */

/**
 * Derives channel from UTM medium (duplicated here to avoid MongoDB import in tests)
 */
function deriveChannel(utmMedium?: string): string {
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

export type LandingPageVariant = 'default' | 'plagiarism' | 'import' | 'topic' | 'referral' | 'organic' | 'paid';

export interface ChannelLandingPageConfig {
  variant: LandingPageVariant;
  heroHeadline: string;
  heroSubheadline: string;
  primaryCTA: string;
  secondaryCTA?: string;
  focusTool?: 'plagiarism' | 'import' | 'topic';
}

/**
 * Determines landing page variant based on UTM parameters and channel
 */
export function getLandingPageVariant(
  utmSource?: string | null,
  utmMedium?: string | null,
  utmCampaign?: string | null,
  utmContent?: string | null
): LandingPageVariant {
  // Check for explicit tool intent in UTM content
  if (utmContent) {
    const content = utmContent.toLowerCase();
    if (content.includes('plagiarism') || content.includes('check')) {
      return 'plagiarism';
    }
    if (content.includes('import') || content.includes('rewrite')) {
      return 'import';
    }
    if (content.includes('topic') || content.includes('outline') || content.includes('essay')) {
      return 'topic';
    }
  }

  // Check campaign for tool intent
  if (utmCampaign) {
    const campaign = utmCampaign.toLowerCase();
    if (campaign.includes('plagiarism') || campaign.includes('check')) {
      return 'plagiarism';
    }
    if (campaign.includes('import') || campaign.includes('rewrite')) {
      return 'import';
    }
    if (campaign.includes('topic') || campaign.includes('outline')) {
      return 'topic';
    }
  }

  // Determine by channel
  const channel = deriveChannel(utmMedium || undefined);
  
  if (channel === 'referral') {
    return 'referral';
  }
  
  if (channel === 'organic') {
    return 'organic';
  }
  
  if (channel === 'paid') {
    return 'paid';
  }

  // Default fallback
  return 'default';
}

/**
 * Gets landing page configuration for a specific variant
 */
export function getLandingPageConfig(variant: LandingPageVariant): ChannelLandingPageConfig {
  switch (variant) {
    case 'plagiarism':
      return {
        variant: 'plagiarism',
        heroHeadline: 'Check Your Work for Plagiarism',
        heroSubheadline: 'Get instant plagiarism detection with AI-powered analysis. Ensure your academic work is original and properly cited.',
        primaryCTA: 'Check for Plagiarism',
        secondaryCTA: 'See How It Works',
        focusTool: 'plagiarism',
      };

    case 'import':
      return {
        variant: 'import',
        heroHeadline: 'Import and Rewrite Your Documents',
        heroSubheadline: 'Upload your existing work and let AI help you improve it. Rewrite, enhance, and cite properly—all in one place.',
        primaryCTA: 'Import Document',
        secondaryCTA: 'View Templates',
        focusTool: 'import',
      };

    case 'topic':
      return {
        variant: 'topic',
        heroHeadline: 'Find Your Research Topic',
        heroSubheadline: 'Discover trending research topics and generate essay outlines. Get AI-powered suggestions tailored to your field of study.',
        primaryCTA: 'Find Topics',
        secondaryCTA: 'Browse Examples',
        focusTool: 'topic',
      };

    case 'referral':
      return {
        variant: 'referral',
        heroHeadline: 'Academic Writing Without Risk or Chaos',
        heroSubheadline: 'Join thousands of students using Akowe to write better papers. Get started with tools trusted by your peers.',
        primaryCTA: 'Get Started Free',
        secondaryCTA: 'See Features',
      };

    case 'organic':
      return {
        variant: 'organic',
        heroHeadline: 'Academic Writing Without Risk or Chaos',
        heroSubheadline: 'Write theses, papers, and research with real sources, plagiarism checks, and AI that respects university policies.',
        primaryCTA: 'Start Free',
        secondaryCTA: 'See How It Works',
      };

    case 'paid':
      return {
        variant: 'paid',
        heroHeadline: 'Write Better Academic Papers',
        heroSubheadline: 'Professional-grade tools for students and researchers. Plagiarism checks, AI writing assistance, and proper citations—all in one platform.',
        primaryCTA: 'Try Free',
        secondaryCTA: 'View Pricing',
      };

    default:
      return {
        variant: 'default',
        heroHeadline: 'Academic Writing Without Risk or Chaos',
        heroSubheadline: 'Write theses, papers, and research with real sources, plagiarism checks, and AI that respects university policies.',
        primaryCTA: 'Start Free',
        secondaryCTA: 'See How It Works',
      };
  }
}

/**
 * Gets the landing page URL for a specific tool/channel
 */
export function getLandingPageUrl(
  tool: 'plagiarism' | 'import' | 'topic',
  baseUrl: string = 'https://useakowe.com'
): string {
  const urls = {
    plagiarism: `${baseUrl}/tools/plagiarism-check`,
    import: `${baseUrl}/dashboard/import`,
    topic: `${baseUrl}/topics`,
  };
  
  return urls[tool];
}
