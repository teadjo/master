// tests/lighthouse/flow.spec.js
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';
import path from 'path';
import { startFlow } from 'lighthouse';
import { desktopConfig } from './config.js';

// Kreiraj folder za izveštaje ako ne postoji
const REPORT_DIR = './tests/lighthouse/reports';
mkdirSync(REPORT_DIR, { recursive: true });

// URL vaše aplikacije - može se podesiti preko env varijable
const APP_URL = process.env.APP_URL || 'http://localhost:5173';

/**
 * Glavna funkcija koja pokreće test
 */
async function simulateReturningUser() {
  console.log('\n🚀 Pokrećem Lighthouse User Flow test...');
  console.log(`📍 Testiram: ${APP_URL}`);
  console.log('👥 Scenarij: Returning user (warm cache)\n');
  
  // 1. Pokreni Playwright browser
  const browser = await chromium.launch({
    headless: false, // Promeni u true ako želiš headless mod
    args: ['--disable-dev-shm-usage'],
  });
  
  // 2. Napravi novi context
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  });
  
  const page = await context.newPage();
  
  // 3. Kreiraj UserFlow
  const flow = await startFlow(page, {
    name: 'Art Competition App - Returning User Flow',
    config: desktopConfig,
  });
  
  // 📊 PRVI KORAK: Cold load (prvi put - bez keša)
  console.log('📊 1/3: Cold navigation (first visit - no cache)...');
  await flow.navigate(APP_URL, {
    stepName: '🏠 Home page - First visit (cold)',
  });
  
  // Sačekaj malo da se sve učita
  await page.waitForTimeout(2000);
  
  // 📊 DRUGI KORAK: Simuliramo returning user (warm load)
  console.log('📊 2/3: Warm navigation (returning user - warm cache)...');
  
  // Idemo na about:blank pa se vraćamo (čuvamo keš)
  await page.goto('about:blank');
  await page.waitForTimeout(1000);
  
  // 🔥 OVO JE RETURNING USER SCENARIO - keš je još uvek tu!
  await flow.navigate(APP_URL, {
    stepName: '🏠 Home page - Returning visit (WARM CACHE) ✨',
    configContext: {
      settingsOverrides: {
        disableStorageReset: true, // 🔥 KLJUČNO - ne brišemo keš!
      },
    },
  });
  
  // 📊 TREĆI KORAK: Navigacija na takmičenja (warm cache)
  console.log('📊 3/3: Competitions page - returning user...');
  
  // Pokušaj da klikneš na link, ako ne postoji - idi direktno
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
  
  // 4. Generiši izveštaj
  console.log('\n📝 Generišem Lighthouse izveštaj...');
  const report = await flow.generateReport();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  // Sačuvaj HTML izveštaj
  const htmlPath = path.join(REPORT_DIR, `lighthouse-returning-user-${timestamp}.html`);
  writeFileSync(htmlPath, report);
  console.log(`✅ HTML izveštaj sačuvan: ${htmlPath}`);
  
  // 5. Zatvori browser
  await browser.close();
  
  console.log('\n✨ Test završen!');
  console.log(`📂 Izveštaji se nalaze u: ${REPORT_DIR}`);
  
  return { htmlPath };
}

// Pokreni test
simulateReturningUser().catch(console.error);