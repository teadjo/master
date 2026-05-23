// tests/lighthouse/config.js
export const desktopConfig = {
  extends: 'lighthouse:default',
  settings: {
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    
    // 🔥 OVO JE KLJUČNO - ne resetujemo storage između navigacija
    disableStorageReset: false,
    
    // Output formats
    output: ['html', 'json'],
    
    // Isključi throttling da dobiješ realne metrike
    throttling: {
      rttMs: 0,
      throughputKbps: 0,
      cpuSlowdownMultiplier: 1,
    },
    
    formFactor: 'desktop',
    screenEmulation: {
      disabled: true,
    },
  },
};

export const mobileConfig = {
  extends: 'lighthouse:default',
  settings: {
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    disableStorageReset: false,
    formFactor: 'mobile',
    throttling: {
      rttMs: 0,
      throughputKbps: 0,
      cpuSlowdownMultiplier: 1,
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