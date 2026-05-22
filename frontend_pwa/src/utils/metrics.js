export class PWAMetrics {
  constructor() {
    this.metrics = {
      loadTime: {},
      offlineRequests: 0,
      cacheHits: 0,
      backgroundSyncs: 0,
      pushNotifications: 0,
      installs: 0
    };
    
    this.init();
  }
  
  init() {
    // Prati load time
    this.measureLoadTime();
    
    // Prati offline requeste
    this.trackOfflineRequests();
    
    // Prati cache hitove
    this.trackCacheHits();
    
    // Prati background sync
    this.trackBackgroundSync();
  }
  
  measureLoadTime() {
    const paintObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          this.metrics.loadTime.firstContentfulPaint = entry.startTime;
        }
      }
    });
    
    paintObserver.observe({ type: 'paint', buffered: true });
    
    window.addEventListener('load', () => {
      const navigationEntry = performance.getEntriesByType('navigation')[0];
      this.metrics.loadTime.domContentLoaded = navigationEntry.domContentLoadedEventEnd;
      this.metrics.loadTime.loadComplete = navigationEntry.loadEventEnd;
    });
  }
  
  trackOfflineRequests() {
    window.addEventListener('offline', () => {
      const observer = new PerformanceObserver((list) => {
        this.metrics.offlineRequests += list.getEntries().length;
      });
      observer.observe({ type: 'resource', buffered: false });
    });
  }
  
  trackCacheHits() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'CACHE_HIT') {
          this.metrics.cacheHits++;
        }
      });
    }
  }
  
  trackBackgroundSync() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        registration.addEventListener('sync', () => {
          this.metrics.backgroundSyncs++;
        });
      });
    }
  }
  
  getReport() {
    return {
      ...this.metrics,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      connection: navigator.connection?.effectiveType || 'unknown',
      isOnline: navigator.onLine,
      isStandalone: window.matchMedia('(display-mode: standalone)').matches
    };
  }
  
  downloadReport() {
    const report = this.getReport();
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pwa-metrics-${Date.now()}.json`;
    a.click();
    
    return report;
  }
}

export const pwaMetrics = new PWAMetrics();