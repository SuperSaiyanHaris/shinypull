// Google Analytics event tracking utility

export const trackEvent = (eventName, eventParams = {}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, eventParams);
  }
};

// Specific event trackers
export const analytics = {
  // Generic event tracker
  event: (eventName, eventParams = {}) => {
    trackEvent(eventName, eventParams);
  },

  // Page view (automatically tracked, but can manually trigger)
  pageView: (pageName) => {
    trackEvent('page_view', {
      page_title: pageName,
    });
  },

  // Creator profile view
  viewProfile: (platform, username, displayName) => {
    trackEvent('view_profile', {
      platform,
      username,
      display_name: displayName,
    });
  },

  // Live counter view
  viewLiveCount: (platform, username, displayName, currentCount) => {
    trackEvent('view_live_count', {
      platform,
      username,
      display_name: displayName,
      subscriber_count: currentCount,
    });
  },

  // Share action
  share: (platform, username, displayName, shareMethod = 'unknown') => {
    trackEvent('share', {
      platform,
      username,
      display_name: displayName,
      method: shareMethod, // 'native' or 'copy_link'
    });
  },

  // Search action
  search: (query) => {
    trackEvent('search', {
      search_term: query,
    });
  },

  // Compare creators
  compare: (creator1Platform, creator1Username, creator2Platform, creator2Username) => {
    trackEvent('compare_creators', {
      creator1_platform: creator1Platform,
      creator1_username: creator1Username,
      creator2_platform: creator2Platform,
      creator2_username: creator2Username,
    });
  },

  // Platform switch (Rankings, Compare, etc.)
  switchPlatform: (page, platform) => {
    trackEvent('switch_platform', {
      page,
      platform,
    });
  },

  // Chart metric change
  changeChartMetric: (metric) => {
    trackEvent('change_chart_metric', {
      metric,
    });
  },

  // Contact form submission
  contactSubmit: (success) => {
    trackEvent('contact_form', {
      success,
    });
  },
};
