import { useEffect } from 'react';

export function PWAHead() {
  useEffect(() => {
    // Add manifest link
    const manifestLink = document.createElement('link');
    manifestLink.rel = 'manifest';
    manifestLink.href = '/manifest.json';
    document.head.appendChild(manifestLink);

    // Add theme color (read stored brand accent)
    const accentMap = { 'dark-blue': '#003883', olive: '#6a8519', amber: '#d97706', teal: '#008671', 'burnt-orange': '#C46A14' };
    const storedAccent = typeof window !== 'undefined' ? localStorage.getItem('lowkey-accent') : null;
    const themeColor = document.createElement('meta');
    themeColor.name = 'theme-color';
    themeColor.content = storedAccent && accentMap[storedAccent] ? accentMap[storedAccent] : '#970747';
    document.head.appendChild(themeColor);

    // iOS specific meta tags
    const appleMobileWebAppCapable = document.createElement('meta');
    appleMobileWebAppCapable.name = 'apple-mobile-web-app-capable';
    appleMobileWebAppCapable.content = 'yes';
    document.head.appendChild(appleMobileWebAppCapable);

    const appleMobileWebAppStatusBarStyle = document.createElement('meta');
    appleMobileWebAppStatusBarStyle.name = 'apple-mobile-web-app-status-bar-style';
    appleMobileWebAppStatusBarStyle.content = 'black-translucent';
    document.head.appendChild(appleMobileWebAppStatusBarStyle);

    const appleMobileWebAppTitle = document.createElement('meta');
    appleMobileWebAppTitle.name = 'apple-mobile-web-app-title';
    appleMobileWebAppTitle.content = 'Lowkey Gem';
    document.head.appendChild(appleMobileWebAppTitle);

    // Apple touch icons
    const appleTouchIcon = document.createElement('link');
    appleTouchIcon.rel = 'apple-touch-icon';
    appleTouchIcon.href = '/apple-touch-icon.png';
    document.head.appendChild(appleTouchIcon);

    const appleTouchIcon180 = document.createElement('link');
    appleTouchIcon180.rel = 'apple-touch-icon';
    appleTouchIcon180.sizes = '180x180';
    appleTouchIcon180.href = '/apple-touch-icon-180.png';
    document.head.appendChild(appleTouchIcon180);

    // Viewport meta tag (ensure it's set correctly for PWA)
    let viewportMeta = document.querySelector('meta[name="viewport"]');
    if (!viewportMeta) {
      viewportMeta = document.createElement('meta');
      viewportMeta.setAttribute('name', 'viewport');
      document.head.appendChild(viewportMeta);
    }
    viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes, viewport-fit=cover');

    // Description
    let descriptionMeta = document.querySelector('meta[name="description"]');
    if (!descriptionMeta) {
      descriptionMeta = document.createElement('meta');
      descriptionMeta.setAttribute('name', 'description');
      document.head.appendChild(descriptionMeta);
    }
    descriptionMeta.setAttribute('content', 'Nigeria\'s first freelancer marketplace designed for equal discovery. No ranking bias. No pay-to-win. Just pure talent, fairly showcased.');

    // Service worker: ONLY in production. In dev it caches stale builds and
    // hijacks the page, so we proactively tear down any existing registration
    // and its caches (this is why local edits stopped showing up).
    if ('serviceWorker' in navigator) {
      if (import.meta.env.DEV) {
        navigator.serviceWorker.getRegistrations()
          .then((regs) => regs.forEach((r) => r.unregister()))
          .catch(() => {});
        if (typeof caches !== 'undefined') {
          caches.keys().then((keys) => keys.forEach((k) => caches.delete(k))).catch(() => {});
        }
      } else {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('/service-worker.js')
            .then((registration) => console.log('SW registered:', registration))
            .catch((error) => console.log('SW registration failed:', error));
        });
      }
    }

    return () => {
      // Cleanup if needed
    };
  }, []);

  return null;
}
