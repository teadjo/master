// tests/lighthouse/config.js
export const desktopConfig = {
  extends: 'lighthouse:default',
  settings: {
    // Only audits, ne koristimo emulaciju (Playwright će to raditi)
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    
    // 🔥 OVO JE KLJUČNO - ne resetujemo storage između navigacija
    disableStorageReset: false,  // false = čuvamo keš, indexDB, localStorage
    
    // Throttling settings (opciono - simulira slabiju mrežu)
    throttling: {
      rttMs: 150,           // Kašnjenje od 150ms (3G/4G)
      throughputKbps: 1638, // 1.6 Mbps (3G)
      cpuSlowdownMultiplier: 4,
      requestLatencyMs: 0,
      downloadThroughputKbps: 0,
      uploadThroughputKbps: 0,
    },
    
    // Form factors
    formFactor: 'desktop',
    screenEmulation: {
      disabled: true,  // Playwright će kontrolisati veličinu
    },
    
    // Output formats
    output: ['html', 'json'],
  },
};

export const mobileConfig = {
  extends: 'lighthouse:default',
  settings: {
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    disableStorageReset: false,  // 🔥 KLJUČNO ZA RETURNING USER
    formFactor: 'mobile',
    throttling: {
      rttMs: 150,
      throughputKbps: 1638,
      cpuSlowdownMultiplier: 4,
    },
    screenEmulation: {
      mobile: true,
      width: 375,
      height: 667,
      deviceScaleFactor: 2,
      disabled: false,
    },
  },
};