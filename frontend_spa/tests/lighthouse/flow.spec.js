// tests/lighthouse/flow-puppeteer.js
import puppeteer from 'puppeteer';
import { writeFileSync, mkdirSync } from 'fs';
import path from 'path';
import { startFlow } from 'lighthouse';
import { desktopConfig } from './config.js';

const REPORT_DIR = './tests/lighthouse/reports';
mkdirSync(REPORT_DIR, { recursive: true });

const APP_URL = "https://master-azure-two.vercel.app";


// Helper funkcija za sleep (zamena za waitForTimeout)
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function simulateReturningUser() {
  console.log('\n🚀 Pokrećem Lighthouse User Flow test sa Puppeteer...');
  console.log(`📍 Testiram: ${APP_URL}`);
  console.log('👥 Scenarij: Returning user (warm cache)\n');

  // Pokrećemo browser sa Puppeteer
  const browser = await puppeteer.launch({
    headless: 'new', 
    defaultViewport: null,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  // Start Flow
  const flow = await startFlow(page, {
    name: 'Art Competition App - Returning User Flow',
    config: desktopConfig,
  });

  // 📊 PRVI KORAK: Cold load (prvi put - nema keša)
  console.log('📊 1/3: Cold navigation (first visit - no cache)...');
  const client = await page.target().createCDPSession();

    await client.send('Network.clearBrowserCache');
    await client.send('Network.clearBrowserCookies');

    await client.send('Storage.clearDataForOrigin',{
    origin:APP_URL,
    storageTypes:'all'
    });
    await flow.navigate(APP_URL, {
        stepName: '🏠 Home page - First visit (cold)',
    });

  // 🔥 waitForTimeout ne postoji u Puppeteer, koristimo sleep
  await page.waitForNetworkIdle({
    idleTime:1500
    });

  // 📊 DRUGI KORAK: Warm load (returning user)
  console.log('📊 2/3: Warm navigation (returning user - warm cache)...');
  
  // Idemo na about:blank pa se vraćamo (čuvamo keš)
  await page.goto('about:blank');

  await flow.navigate(APP_URL, {
    stepName: '🏠 Home page - Returning visit (WARM CACHE) ✨',
    configContext: {
      settingsOverrides: {
        disableStorageReset: true, // 🔥 KLJUČNO - ne brišemo keš!
      },
    },
  });

  await page.waitForNetworkIdle();
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
