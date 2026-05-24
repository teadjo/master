import puppeteer from 'puppeteer';
import { writeFileSync, mkdirSync } from 'fs';
import path from 'path';
import { startFlow } from 'lighthouse';

const REPORT_DIR = './tests/lighthouse/reports';
mkdirSync(REPORT_DIR, { recursive: true });

const APP_URL = "https://master-azure-two.vercel.app";

// Helper funkcija za sleep
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Konfiguracija za različite mrežne uslove
const NETWORK_CONFIGS = {
  'fast4g': {
    name: 'Fast 4G',
    throttling: {
      rttMs: 50,
      throughputKbps: 10240,  // 10 Mbps
      cpuSlowdownMultiplier: 1,
      requestLatencyMs: 0,
      downloadThroughputKbps: 10240,
      uploadThroughputKbps: 5120,
    },
    formFactor: 'mobile',
    screenEmulation: {
      mobile: true,
      width: 412,
      height: 823,
      deviceScaleFactor: 1.75,
      disabled: false,
    },
  },
  'slow4g': {
    name: 'Slow 4G',
    throttling: {
      rttMs: 150,
      throughputKbps: 1638,   // 1.6 Mbps (typical 3G/4G)
      cpuSlowdownMultiplier: 4,
      requestLatencyMs: 0,
      downloadThroughputKbps: 1638,
      uploadThroughputKbps: 750,
    },
    formFactor: 'mobile',
    screenEmulation: {
      mobile: true,
      width: 412,
      height: 823,
      deviceScaleFactor: 1.75,
      disabled: false,
    },
  }
};

// Helper za kreiranje config-a za Lighthouse
function getLighthouseConfig(networkType) {
  const network = NETWORK_CONFIGS[networkType];
  
  return {
    extends: 'lighthouse:default',
    settings: {
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      formFactor: network.formFactor,
      throttling: network.throttling,
      throttlingMethod: 'simulate',
      screenEmulation: network.screenEmulation,
      output: ['html', 'json'],
      disableStorageReset: false,
    },
  };
}

// 🔥 ISPRAVLJENA funkcija za brisanje keša
async function clearAllCache(page, origin) {
  const client = await page.target().createCDPSession();
  
  // Brišemo browser cache
  await client.send('Network.clearBrowserCache');
  await client.send('Network.clearBrowserCookies');
  
  // Brišemo sve storage podatke za origin (localStorage, IndexedDB, itd.)
  await client.send('Storage.clearDataForOrigin', {
    origin: origin,
    storageTypes: 'all'
  });
  
  console.log('   🧹 Cache cleared');
}

// Helper za čuvanje izveštaja
function saveReport(report, startType, networkType, timestamp) {
  const filename = `lighthouse-${startType}-${networkType}-${timestamp}.html`;
  const filepath = path.join(REPORT_DIR, filename);
  writeFileSync(filepath, report);
  console.log(`   ✅ Izveštaj sačuvan: ${filename}`);
  return filepath;
}

// Glavna funkcija za pokretanje jednog testa
async function runSingleTest(networkType, startType, timestamp) {
  const network = NETWORK_CONFIGS[networkType];
  const config = getLighthouseConfig(networkType);
  
  console.log(`\n🚀 Pokrećem test: ${startType.toUpperCase()} start na ${network.name}`);
  console.log(`   Throttling: RTT=${network.throttling.rttMs}ms, Throughput=${network.throttling.throughputKbps}Kbps`);
  
  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: null,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  // 🔥 Ako je COLD start, očisti keš PRE nego što se stranica učita
  if (startType === 'cold') {
    await clearAllCache(page, APP_URL);
  }
  
  // Start Flow
  const flow = await startFlow(page, {
    name: `${APP_URL} - ${startType.toUpperCase()} start on ${network.name}`,
    config: config,
  });
  
  // Navigacija
  console.log(`   🌐 Navigating to ${APP_URL}...`);
  
  const flowOptions = {
    stepName: `${APP_URL} - ${startType.toUpperCase()} start on ${network.name}`,
  };
  
  // Ako je WARM start, čuvamo keš
  if (startType === 'warm') {
    flowOptions.configContext = {
      settingsOverrides: {
        disableStorageReset: true, // 🔥 Čuvamo keš za WARM start
      },
    };
  }
  
  await flow.navigate(APP_URL, flowOptions);
  
  // Sačekaj da se stranica učita
  try {
    await page.waitForNetworkIdle({ idleTime: 2000 });
  } catch (e) {
    console.log('   ⚠️ Network idle timeout, nastavljam...');
  }
  
  // Generiši izveštaj
  const report = await flow.generateReport();
  const filepath = saveReport(report, startType, networkType, timestamp);
  
  await browser.close();
  
  return filepath;
}

// Glavna funkcija koja pokreće sve 4 testa
async function runAllTests() {
  console.log('\n' + '='.repeat(70));
  console.log('🚀 LIGHTHOUSE MULTI-TEST: COLD vs WARM on Different Networks');
  console.log('='.repeat(70));
  console.log(`📍 Testiram: ${APP_URL}`);
  console.log('\n📋 Test plan:');
  console.log('   1. COLD start on Fast 4G   (first visit, no cache)');
  console.log('   2. COLD start on Slow 4G   (first visit, no cache)');
  console.log('   3. WARM start on Fast 4G  (returning user, with cache)');
  console.log('   4. WARM start on Slow 4G  (returning user, with cache)');
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const results = {};
  
  // Redosled testova
  const testOrder = [
    { startType: 'cold', networkType: 'fast4g', label: 'COLD Fast 4G' },
    { startType: 'cold', networkType: 'slow4g', label: 'COLD Slow 4G' },
    { startType: 'warm', networkType: 'fast4g', label: 'WARM Fast 4G' },
    { startType: 'warm', networkType: 'slow4g', label: 'WARM Slow 4G' },
  ];
  
  for (const test of testOrder) {
    try {
      const filepath = await runSingleTest(test.networkType, test.startType, timestamp);
      
      results[`${test.startType}_${test.networkType}`] = {
        filepath,
        network: NETWORK_CONFIGS[test.networkType].name,
        startType: test.startType.toUpperCase(),
        label: test.label
      };
      
      console.log('   ⏳ Pauza 3 sekunde pre sledećeg testa...');
      await sleep(3000);
      
    } catch (error) {
      console.error(`   ❌ Greška pri testu ${test.label}:`, error.message);
    }
  }
  
  // Sažetak
  console.log('\n' + '='.repeat(70));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(70));
  
  for (const [key, value] of Object.entries(results)) {
    console.log(`   📄 ${value.label}: ${value.filepath}`);
  }
  
  console.log('\n📁 Svi izveštaji su u folderu: ' + REPORT_DIR);
  console.log('\n💡 Savjet: Otvorite HTML fajlove i uporedite LCP, FCP, TTI metrike');
  console.log('   - COLD start: prvi put, nema keša (treba da bude sporiji)');
  console.log('   - WARM start: returning user, keš je topao (treba da bude brži)');
  console.log('   - Fast 4G vs Slow 4G: pokazuje uticaj mreže na performanse\n');
  
  // 🔥 Dodatna analiza - pokušaj da izvučeš metrike iz fajlova
  console.log('📈 Analiza rezultata (preporučujem da pokrenete Python skriptu za detaljnu analizu):');
  console.log('   python analyze_lighthouse.py\n');
  
  return results;
}

// Pokretanje
(async () => {
  try {
    await runAllTests();
  } catch (error) {
    console.error('❌ Greška:', error);
    process.exit(1);
  }
})();