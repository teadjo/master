// tests/lighthouse/flow.spec.js
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';
import path from 'path';
import { startFlow } from 'lighthouse';
import { desktopConfig, mobileConfig } from './config.js';

// Kreiraj folder za izveštaje ako ne postoji
const REPORT_DIR = './tests/lighthouse/reports';
mkdirSync(REPORT_DIR, { recursive: true });

// URL vaše aplikacije (prilagodite!)
const APP_URL = process.env.VITE_URL;

/**
 * 🔥 SIMULACIJA RETURNING USER-A
 * Ovo je ono što vam treba - testira warm cache scenario
 */
async function simulateReturningUser() {
  console.log('\n🚀 Pokrećem Lighthouse User Flow test...');
  console.log(`📍 Testiram: ${APP_URL}`);
  console.log('👥 Scenarij: Returning user (warm cache)\n');
  
  // 1. Pokreni Playwright browser
  const browser = await chromium.launch({
    headless: process.env.CI === 'true', // headless samo u CI-u
    args: ['--disable-dev-shm-usage'],
  });
  
  // 2. Napravi novi context (bez dodatnih opcija - čuvamo storage)
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    // 🔥 NE koristimo storageState - želimo da se keš čuva
  });
  
  const page = await context.newPage();
  
  // 3. Kreiraj UserFlow
  const flow = await startFlow(page, {
    name: 'Art Competition App - Returning User Flow',
    config: desktopConfig,
  });
  
  // 📊 PRVI KORAK: Cold load (prvi put - bez keša)
  console.log('📊 1/4: Cold navigation (first visit - no cache)...');
  await flow.navigate(APP_URL, {
    stepName: '🏠 Home page - First visit (cold)',
    configContext: {
      settingsOverrides: {
        disableStorageReset: false, // Čuvamo storage za sledeći korak
      },
    },
  });
  
  // 📊 DRUGI KORAK: Navigacija na takmičenja
  console.log('📊 2/4: Navigate to competitions page...');
  await page.click('a[href="/competitions"], [data-testid="competitions-link"]').catch(() => {
    console.log('⚠️ Link nije pronađen, koristim direct navigation');
  });
  await flow.snapshot({
    stepName: '🏆 Competitions page',
  });
  
  // 📊 TREĆI KORAK: Simuliramo da korisnik ode i vrati se (warm load)
  console.log('📊 3/4: Simulating returning user (warm navigation)...');
  
  // Idemo na drugu stranicu pa se vraćamo
  await page.goto('about:blank');
  await page.waitForTimeout(1000);
  
  // 🔥 OVO JE RETURNING USER SCENARIO - keš je još uvek tu!
  await flow.navigate(APP_URL, {
    stepName: '🏠 Home page - Returning visit (WARM CACHE) ✨',
    configContext: {
      settingsOverrides: {
        disableStorageReset: false, // 🔥 NE BRIŠEMO KEŠ - ovo je ključno!
      },
    },
  });
  
  // 📊 ČETVRTI KORAK: Ponovo idemo na takmičenja (warm cache)
  console.log('📊 4/4: Competitions page - returning user...');
  await page.click('a[href="/competitions"], [data-testid="competitions-link"]').catch(() => {
    await page.goto(`${APP_URL}/competitions`);
  });
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
  
  // Sačuvaj JSON za dalju analizu
  const jsonPath = path.join(REPORT_DIR, `lighthouse-returning-user-${timestamp}.json`);
  const jsonReport = await flow.generateReport();
  writeFileSync(jsonPath, jsonReport);
  console.log(`✅ JSON izveštaj sačuvan: ${jsonPath}`);
  
  // 5. Zatvori browser
  await browser.close();
  
  console.log('\n✨ Test završen!');
  console.log(`📂 Izveštaji se nalaze u: ${REPORT_DIR}`);
  
  return { htmlPath, jsonPath };
}

/**
 * 📱 Mobile test - isti flow
 */
async function simulateReturningUserMobile() {
  console.log('\n📱 Pokrećem Lighthouse test za MOBILE...');
  
  const browser = await chromium.launch({
    headless: process.env.CI === 'true',
  });
  
  const context = await browser.newContext({
    viewport: { width: 375, height: 667 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
  });
  
  const page = await context.newPage();
  const flow = await startFlow(page, {
    name: 'Art Competition App - Returning User (Mobile)',
    config: mobileConfig,
  });
  
  // Cold load
  console.log('📱 Cold navigation (mobile)...');
  await flow.navigate(APP_URL, {
    stepName: 'Home - First visit (cold)',
  });
  
  // Warm load (returning user)
  console.log('📱 Warm navigation - returning user...');
  await page.goto('about:blank');
  await page.waitForTimeout(500);
  
  await flow.navigate(APP_URL, {
    stepName: 'Home - Returning visit (WARM) ✨',
  });
  
  const report = await flow.generateReport();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const htmlPath = path.join(REPORT_DIR, `lighthouse-mobile-returning-user-${timestamp}.html`);
  writeFileSync(htmlPath, report);
  
  console.log(`✅ Mobile izveštaj: ${htmlPath}`);
  await browser.close();
  
  return htmlPath;
}

/**
 * 🚀 COMPARISON TEST - Poredi cold vs warm direktno
 */
async function compareColdVsWarm() {
  console.log('\n📊 POKREĆEM COMPARISON TEST: Cold vs Warm');
  console.log('━'.repeat(50));
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const flow = await startFlow(page, {
    name: 'Cold vs Warm Comparison',
    config: desktopConfig,
  });
  
  // Prvi put - COLD
  console.log('❄️  Measuring COLD navigation (no cache)...');
  await flow.navigate(APP_URL, {
    stepName: '❄️ COLD load - First visit',
  });
  
  // Drugi put - WARM (koristimo isti context, keš je tu)
  console.log('🔥 Measuring WARM navigation (returning user)...');
  await flow.navigate(APP_URL, {
    stepName: '🔥 WARM load - Returning user',
  });
  
  const report = await flow.generateReport();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const htmlPath = path.join(REPORT_DIR, `lighthouse-comparison-cold-vs-warm-${timestamp}.html`);
  writeFileSync(htmlPath, report);
  
  console.log(`✅ Comparison izveštaj: ${htmlPath}`);
  await browser.close();
  
  return htmlPath;
}

// 🎯 Glavna funkcija - pokreće sve testove
async function runAllTests() {
  console.log('🎯 Lighthouse User Flow Tests');
  console.log('═'.repeat(50));
  
  try {
    // Test 1: Returning user (desktop)
    await simulateReturningUser();
    
    // Test 2: Returning user (mobile)
    await simulateReturningUserMobile();
    
    // Test 3: Cold vs Warm direktno poređenje
    await compareColdVsWarm();
    
    console.log('\n🎉 SVI TESTOVI ZAVRŠENI!');
    console.log(`📂 Otvorite folder ${REPORT_DIR} da vidite izveštaje`);
    
  } catch (error) {
    console.error('❌ Greška u testovima:', error);
    process.exit(1);
  }
}

// Pokreni ako se fajl izvršava direktno
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests();
}

export { simulateReturningUser, simulateReturningUserMobile, compareColdVsWarm };