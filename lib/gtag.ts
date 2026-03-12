// GA4 event tracking helper

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

/**
 * Sets the user_id for GA4 tracking
 * This should be called after successful login to link GA sessions to internal user IDs
 * @param userId - The internal user ID from the database
 */
export const setUserId = (userId: string) => {
  if (typeof window !== 'undefined' && window.gtag && userId) {
    try {
      window.gtag('set', { user_id: userId });
      // Also set in config for persistence across page loads
      window.gtag('config', 'G-KRXGBZVQ8Y', {
        user_id: userId,
      });
    } catch (error) {
      // Silently fail - analytics shouldn't break user experience
      console.error('Failed to set GA user_id:', error);
    }
  }
};

/**
 * Clears the user_id from GA4 tracking
 * Should be called on logout
 */
export const clearUserId = () => {
  if (typeof window !== 'undefined' && window.gtag) {
    try {
      window.gtag('set', { user_id: null });
      window.gtag('config', 'G-KRXGBZVQ8Y', {
        user_id: null,
      });
    } catch (error) {
      console.error('Failed to clear GA user_id:', error);
    }
  }
};

export const trackEvent = (eventName: string, params: Record<string, any> = {}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, {
      ...params,
      timestamp: Date.now(),
    });
  }
};

// Lead magnet specific events
export const trackLeadMagnet = {
  view: (magnetType: 'plagiarism' | 'import' | 'topic', variant: string) => {
    trackEvent('lead_magnet_view', { magnet_type: magnetType, variant });
  },
  
  textPasted: (magnetType: 'plagiarism' | 'import' | 'topic', charCount: number) => {
    trackEvent('text_pasted', { magnet_type: magnetType, char_count: charCount });
  },
  
  fileUploaded: (magnetType: 'plagiarism' | 'import' | 'topic', fileType: string) => {
    trackEvent('file_uploaded', { magnet_type: magnetType, file_type: fileType });
  },
  
  scanStarted: (magnetType: 'plagiarism' | 'import' | 'topic') => {
    trackEvent('scan_started', { magnet_type: magnetType });
  },
  
  emailCaptured: (magnetType: 'plagiarism' | 'import' | 'topic') => {
    trackEvent('email_captured', { magnet_type: magnetType });
  },
  
  resultViewed: (magnetType: 'plagiarism' | 'import' | 'topic', score?: number) => {
    trackEvent('result_viewed', { magnet_type: magnetType, risk_score: score, uniqueness_score: score });
  },
  
  signupClicked: (magnetType: 'plagiarism' | 'import' | 'topic') => {
    trackEvent('signup_clicked', { magnet_type: magnetType });
  },
};

// Editor behaviour events
export const trackEditor = {
  textCopied: (wordCount: number, sectionTitle?: string) => {
    trackEvent('editor_text_copied', {
      word_count: wordCount,
      section_title: sectionTitle || 'unknown',
    });
  },
};

// pSEO page tracking events
export const trackPseo = {
  pageView: (pageType: string, slug: string) => {
    trackEvent('pseo_page_view', { page_type: pageType, slug });
  },
  ctaClicked: (pageType: string, slug: string, position: 'header' | 'inline' | 'bottom') => {
    trackEvent('pseo_cta_clicked', { page_type: pageType, slug, position });
  },
};

// Feedback nudge tracking events
export const trackFeedback = {
  nudgeShown: () => {
    trackEvent('feedback_nudge_shown');
  },
  nudgeClicked: () => {
    trackEvent('feedback_nudge_clicked');
  },
  nudgeDismissed: () => {
    trackEvent('feedback_nudge_dismissed');
  },
};

// Funnel tracking events
export const trackFunnel = {
  /**
   * Track when user starts the signup process (form viewed/focused)
   */
  signupStart: (source?: string) => {
    trackEvent('signup_start', {
      source: source || 'direct',
      timestamp: Date.now(),
    });
  },

  /**
   * Track when user completes signup
   */
  signupComplete: (userId: string, method: 'credentials' | 'google', source?: string) => {
    trackEvent('signup_complete', {
      user_id: userId,
      method,
      source: source || 'direct',
      timestamp: Date.now(),
    });
  },

  /**
   * Track when user creates their first project
   */
  firstProjectCreated: (userId: string, projectType: string) => {
    trackEvent('first_project_created', {
      user_id: userId,
      project_type: projectType,
      timestamp: Date.now(),
    });
  },

  /**
   * Track when user generates their first AI output
   */
  firstOutputGenerated: (userId: string, outputType: 'write' | 'assistant' | 'integrate' | 'outline') => {
    trackEvent('first_output_generated', {
      user_id: userId,
      output_type: outputType,
      timestamp: Date.now(),
    });
  },

  /**
   * Track when paywall/upgrade prompt is shown
   */
  paywallView: (paywallType: 'project_limit' | 'word_limit' | 'check_limit' | 'feature_upgrade', context?: string, paywallVariant?: 'variant_a' | 'variant_b') => {
    trackEvent('paywall_view', {
      paywall_type: paywallType,
      context: context || 'unknown',
      paywall_variant: paywallVariant || 'unknown',
      timestamp: Date.now(),
    });
  },

  /**
   * Track when user starts checkout process
   */
  checkoutStart: (userId: string, billingCycle: 'monthly' | 'annual', planType: string) => {
    trackEvent('checkout_start', {
      user_id: userId,
      billing_cycle: billingCycle,
      plan_type: planType,
      timestamp: Date.now(),
    });
  },

  /**
   * Track successful purchase
   */
  purchase: (userId: string, billingCycle: 'monthly' | 'annual', planType: string, value: number, currency: string = 'USD') => {
    trackEvent('purchase', {
      user_id: userId,
      billing_cycle: billingCycle,
      plan_type: planType,
      value,
      currency,
      timestamp: Date.now(),
    });
  },
};
