// tests/lighthouse/flow-puppeteer.js
import puppeteer from 'puppeteer';
import { writeFileSync, mkdirSync } from 'fs';
import path from 'path';
import { startFlow, desktopConfig } from 'lighthouse';

const REPORT_DIR = './tests/lighthouse/reports';
mkdirSync(REPORT_DIR, { recursive: true });

const APP_URL = process.env.VITE_URL;

async function simulateReturningUser() {
  console.log('\n🚀 Pokrećem Lighthouse User Flow test sa Puppeteer...');
  console.log(`📍 Testiram: ${APP_URL}`);
  console.log('👥 Scenarij: Returning user (warm cache)\n');

  // 🔥 Pokrećemo browser sa Puppeteer (LIGHTHOUSE GA OVO OČEKUJE!)
  const browser = await puppeteer.launch({
    headless: false, // 'new' za headless, false da vidimo šta se dešava
    defaultViewport: null, // Koristi puni viewport
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  // 🔥 START FLOW - OVAKO RADI SA PUPPETEER
  const flow = await startFlow(page, {
    name: 'Art Competition App - Returning User Flow',
    config: desktopConfig,
  });

  // 📊 PRVI KORAK: Cold load (prvi put - nema keša)
  console.log('📊 1/3: Cold navigation (first visit - no cache)...');
  await flow.navigate(APP_URL, {
    stepName: '🏠 Home page - First visit (cold)',
  });

  await page.waitForTimeout(2000);

  // 📊 DRUGI KORAK: Warm load (returning user)
  console.log('📊 2/3: Warm navigation (returning user - warm cache)...');
  
  // Idemo na about:blank pa se vraćamo (čuvamo keš)
  await page.goto('about:blank');
  await page.waitForTimeout(1000);

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
  
  // Pokušaj da klikneš na link
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

  const htmlPath = path.join(REPORT_DIR, `lighthouse-puppeteer-${timestamp}.html`);
  writeFileSync(htmlPath, report);
  console.log(`✅ HTML izveštaj sačuvan: ${htmlPath}`);

  await browser.close();

  console.log('\n✨ Test završen!');
  console.log(`📂 Izveštaji se nalaze u: ${REPORT_DIR}`);
  console.log('\n💡 Otvori HTML fajl u browseru da vidiš poređenje Cold vs Warm!');
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