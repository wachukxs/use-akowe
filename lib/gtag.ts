// GA4 event tracking helper

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

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
  view: (magnetType: 'plagiarism' | 'import', variant: string) => {
    trackEvent('lead_magnet_view', { magnet_type: magnetType, variant });
  },
  
  textPasted: (magnetType: 'plagiarism' | 'import', charCount: number) => {
    trackEvent('text_pasted', { magnet_type: magnetType, char_count: charCount });
  },
  
  fileUploaded: (magnetType: 'plagiarism' | 'import', fileType: string) => {
    trackEvent('file_uploaded', { magnet_type: magnetType, file_type: fileType });
  },
  
  scanStarted: (magnetType: 'plagiarism' | 'import') => {
    trackEvent('scan_started', { magnet_type: magnetType });
  },
  
  emailCaptured: (magnetType: 'plagiarism' | 'import') => {
    trackEvent('email_captured', { magnet_type: magnetType });
  },
  
  resultViewed: (magnetType: 'plagiarism' | 'import', score?: number) => {
    trackEvent('result_viewed', { magnet_type: magnetType, risk_score: score });
  },
  
  signupClicked: (magnetType: 'plagiarism' | 'import') => {
    trackEvent('signup_clicked', { magnet_type: magnetType });
  },
};
