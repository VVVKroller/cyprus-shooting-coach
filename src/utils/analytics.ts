// Google Analytics Utility Functions
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

// Initialize Google Analytics
export const initializeGA = (measurementId: string) => {
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };
  window.gtag("js", new Date());
  window.gtag("config", measurementId, {
    send_page_view: false, // We'll handle this manually
  });
};

// Track Page View
export const trackPageView = (path: string) => {
  window.gtag("event", "page_view", {
    page_path: path,
  });
};

// Track Custom Event
export const trackEvent = (eventName: string, eventParams = {}) => {
  window.gtag("event", eventName, eventParams);
};
