// tests/lighthouse/flow.spec.js
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';
import path from 'path';
import { startFlow } from 'lighthouse';
import { desktopConfig } from './config.js';

const REPORT_DIR = './tests/lighthouse/reports';
mkdirSync(REPORT_DIR, { recursive: true });

const APP_URL = process.env.APP_URL || 'http://localhost:5173';

async function simulateReturningUser() {
  console.log('\n🚀 Pokrećem Lighthouse User Flow test...');
  console.log(`📍 Testiram: ${APP_URL}`);
  console.log('👥 Scenarij: Returning user (warm cache)\n');

  // 🔥 Povezivanje Playwright-a sa Lighthouse-om - ISPRAVNA SINTARKSA
  const browser = await chromium.launch({
    headless: false,
    args: ['--remote-debugging-port=9222'], // 🔥 KLJUČNO za Lighthouse
  });

  const page = await browser.newPage();
  
  // 🔥 Lighthouse zahteva CDP (Chrome DevTools Protocol) sesiju
  const session = await page.context().newCDPSession(page);
  
  // Kreiraj flow sa CDP sesijom
  const flow = await startFlow(page, {
    name: 'Art Competition App - Returning User Flow',
    config: desktopConfig,
    driver: session, // 🔥 Prosledi CDP sesiju
  });

  // 📊 PRVI KORAK: Cold load
  console.log('📊 1/3: Cold navigation (first visit - no cache)...');
  await flow.navigate(APP_URL, {
    stepName: '🏠 Home page - First visit (cold)',
  });

  await page.waitForTimeout(2000);

  // 📊 DRUGI KORAK: Warm load (returning user)
  console.log('📊 2/3: Warm navigation (returning user - warm cache)...');
  
  // Idi na about:blank pa se vrati (čuvamo keš)
  await page.goto('about:blank');
  await page.waitForTimeout(1000);

  await flow.navigate(APP_URL, {
    stepName: '🏠 Home page - Returning visit (WARM CACHE) ✨',
    configContext: {
      settingsOverrides: {
        disableStorageReset: true, // 🔥 Čuvamo keš
      },
    },
  });

  // 📊 TREĆI KORAK: Navigacija na takmičenja
  console.log('📊 3/3: Competitions page - returning user...');
  
  const competitionsLink = await page.$('a[href="/competitions"], [data-testid="competitions-link"]');
  if (competitionsLink) {
    await competitionsLink.click();
  } else {
    await page.goto(`${APP_URL}/competitions`);
  }

  await page.waitForTimeout(2000);
  await flow.snapshot({
    stepName: '🏆 Competitions page - Warm navigation',
  });

  // Generiši izveštaj
  console.log('\n📝 Generišem Lighthouse izveštaj...');
  const report = await flow.generateReport();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  const htmlPath = path.join(REPORT_DIR, `lighthouse-returning-user-${timestamp}.html`);
  writeFileSync(htmlPath, report);
  console.log(`✅ HTML izveštaj sačuvan: ${htmlPath}`);

  await browser.close();

  console.log('\n✨ Test završen!');
  console.log(`📂 Izveštaji se nalaze u: ${REPORT_DIR}`);
}

// Pokretanje
(async () => {
  try {
    await simulateReturningUser();
  } catch (error) {
    console.error('❌ Greška:', error);
    process.exit(1);
  }
})();