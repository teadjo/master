import puppeteer from 'puppeteer';
import { writeFileSync, mkdirSync } from 'fs';
import path from 'path';
import { startFlow } from 'lighthouse';

const REPORT_DIR = './tests/lighthouse/reports';

mkdirSync(REPORT_DIR, { recursive: true });

const APP_URL = 'https://master-spa2.vercel.app/competition/34';

const sleep = (ms) =>
new Promise(resolve => setTimeout(resolve, ms));

// ============================================================
// MREŽNI SCENARIJI
// ============================================================

const NETWORKS = {

fast4g: {
name: 'Fast4G',

throttling: {
  rttMs: 50,
  throughputKbps: 10240,
  downloadThroughputKbps: 10240,
  uploadThroughputKbps: 5120
}


},

slow4g: {
name: 'Slow4G',

throttling: {
  rttMs: 150,
  throughputKbps: 1638,
  downloadThroughputKbps: 1638,
  uploadThroughputKbps: 750
}
}

};

// ============================================================
// LIGHTHOUSE KONFIGURACIJA
// ============================================================

function getConfig(network, cpuSlowdownMultiplier) {

return {
extends: 'lighthouse:default',

settings: {

  onlyCategories: [
    'performance',
    'accessibility',
    'best-practices',
    'seo'
  ],

  formFactor: 'mobile',

  throttling: {
    ...NETWORKS[network].throttling,
    cpuSlowdownMultiplier
  },

  throttlingMethod: 'devtools',

  screenEmulation: {
    mobile: true,
    width: 412,
    height: 823,
    deviceScaleFactor: 1.75,
    disabled: false
  },

  output: [
    'html',
    'json'
  ],

  disableStorageReset: false
}

};
}

// ============================================================
// BRISANJE KEŠA, KOLAČIĆA I STORAGE-A
// ============================================================

async function clearEverything(page) {

const client = await page.target().createCDPSession();

const origin = new URL(APP_URL).origin;

await client.send(
'Network.clearBrowserCache'
);

await client.send(
'Network.clearBrowserCookies'
);

await client.send(
'Storage.clearDataForOrigin',
{
origin,
storageTypes: 'all'
}
);

console.log('Cache/storage obrisani');
}

// ============================================================
// ČEKANJE SERVICE WORKER-A
// ============================================================

async function waitForSW(page) {

try {
await page.evaluate(async () => {

  if ('serviceWorker' in navigator) {
    await navigator.serviceWorker.ready;
  }

});

console.log('SW aktivan');
} catch {

console.log('SW nije spreman');
}
}

// ============================================================
// ČUVANJE IZVJEŠTAJA
// ============================================================

function saveReport(
report,
type,
network,
cpuSlowdown,
timestamp
) {

const file = path.join(
REPORT_DIR,
`report-${type}-${network}-cpu${cpuSlowdown}-${timestamp}.html`
);

writeFileSync(file, report);

console.log(file);
}

// ============================================================
// TESTIRANJE JEDNE KOMBINACIJE
// ============================================================

async function runTest(networkType, cpuSlowdown) {

console.log('\n========================================');
console.log(
`${NETWORKS[networkType].name} | CPU ${cpuSlowdown}x`
);
console.log('========================================');

const browser = await puppeteer.launch({

headless: 'new',

args: [
  '--no-sandbox',
  '--disable-setuid-sandbox'
]

});

const page = await browser.newPage();

const timestamp =
new Date().toISOString().replace(/[:.]/g, '-');

// ==========================================================
// COLD START
// ==========================================================

console.log('\nCOLD START');

await clearEverything(page);

const coldFlow = await startFlow(page, {

name: `COLD-${networkType}-CPU${cpuSlowdown}`,

config: getConfig(
  networkType,
  cpuSlowdown
)

});

await coldFlow.navigate(APP_URL, { stepName: 'Cold start'});

await page.waitForSelector('#root');

await sleep(3000);

const coldReport = await coldFlow.generateReport();

saveReport(
coldReport,
'cold',
networkType,
cpuSlowdown,
timestamp
);

// ==========================================================
// WARM START
// ==========================================================

console.log('\nWARM START');

console.log('Warmup visit');

await page.goto(APP_URL, { waitUntil: 'networkidle0' });

await waitForSW(page);

console.log('Punim cache');

await page.goto(APP_URL, { waitUntil: 'networkidle0'});

await waitForSW(page);

await sleep(5000);

console.log('Returning visit');

const warmFlow = await startFlow(page, {

name: `WARM-${networkType}-CPU${cpuSlowdown}`,

config: getConfig(
  networkType,
  cpuSlowdown
)

});

await warmFlow.navigate(APP_URL, {
stepName: 'Warm start',
configContext: {
  settingsOverrides: {
    disableStorageReset: true
  }
}

});

await page.waitForSelector('#root');

await sleep(3000);

const warmReport = await warmFlow.generateReport();

saveReport(
warmReport,
'warm',
networkType,
cpuSlowdown,
timestamp
);

await browser.close();

}

// ============================================================
// POKRETANJE SVIH SCENARIJA
// ============================================================

(async () => {

try {

// --------------------------------------------------------
// FAST 4G — CPU 1x
// --------------------------------------------------------

await runTest('fast4g', 1);
await sleep(5000);

// --------------------------------------------------------
// FAST 4G — CPU 4x
// --------------------------------------------------------

await runTest('fast4g', 4);
await sleep(5000);

// --------------------------------------------------------
// SLOW 4G — CPU 1x
// --------------------------------------------------------

await runTest('slow4g', 1);
await sleep(5000);

// --------------------------------------------------------
// SLOW 4G — CPU 4x
// --------------------------------------------------------

await runTest('slow4g', 4);
console.log('\nGOTOVO');

} catch (error) {

console.error(error);

}

})();