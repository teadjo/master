// tests/lighthouse/cold-vs-warm.js
import { startFlow } from 'lighthouse';
import puppeteer from 'puppeteer';

const FRONTEND_URL = 'https://master-azure-two.vercel.app';
const RUNS = 5;

async function testReturningUser() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const results = { cold: [], warm: [] };
  
  for (let i = 0; i < RUNS; i++) {
    const page = await browser.newPage();
    const flow = await startFlow(page);
    
    // 🔥 COLD - prvi put, nema keša
    await flow.navigate(FRONTEND_URL, {
      stepName: `Cold run ${i + 1}`
    });
    
    // Zabeleži metrike
    const coldReport = await flow.generateReport();
    results.cold.push(extractMetrics(coldReport));
    
    // 🔥 WARM - vraćamo se na istu stranicu, čuvamo keš
    await flow.navigate(FRONTEND_URL, {
      stepName: `Warm run ${i + 1}`,
      configContext: {
        settingsOverrides: { disableStorageReset: true }
      }
    });
    
    const warmReport = await flow.generateReport();
    results.warm.push(extractMetrics(warmReport));
    
    await page.close();
  }
  
  await browser.close();
  
  // Izračunaj medijanu
  return {
    cold: calculateMedian(results.cold),
    warm: calculateMedian(results.warm),
    improvement: calculateImprovement(results.cold, results.warm)
  };
}