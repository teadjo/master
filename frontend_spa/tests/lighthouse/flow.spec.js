import puppeteer from 'puppeteer';
import { writeFileSync, mkdirSync } from 'fs';
import path from 'path';
import { startFlow } from 'lighthouse';

const REPORT_DIR='./tests/lighthouse/reports';
mkdirSync(REPORT_DIR,{recursive:true});

const APP_URL="https://master-azure-two.vercel.app/competition/12/27/myprofile";

const sleep=(ms)=>
   new Promise(resolve=>setTimeout(resolve,ms));

const NETWORKS={

   fast4g:{
      name:'Fast4G',
      throttling:{
         rttMs:50,
         throughputKbps:10240,
         cpuSlowdownMultiplier:1,
         downloadThroughputKbps:10240,
         uploadThroughputKbps:5120
      }
   },

   slow4g:{
      name:'Slow4G',

      throttling:{
         rttMs:150,
         throughputKbps:1638,
         cpuSlowdownMultiplier:4,
         downloadThroughputKbps:1638,
         uploadThroughputKbps:750
      }
   }
};

function getConfig(network){
   return {

      extends:'lighthouse:default',
      settings:{
         onlyCategories:[
            'performance',
            'accessibility',
            'best-practices',
            'seo'
         ],
         formFactor:'mobile',
         throttling:NETWORKS[network].throttling,
         throttlingMethod:'devtools',
         screenEmulation:{
            mobile:true,
            width:412,
            height:823,
            deviceScaleFactor:1.75,
            disabled:false
         },
         output:[
            'html',
            'json'
         ],
         disableStorageReset:false
      }
   }
}

async function clearEverything(page){

   const client=await page.target().createCDPSession();
   const origin=new URL(APP_URL).origin;

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
         storageTypes:'all'
      }
   );

   console.log('Cache/storage obrisani');
}

async function waitForSW(page){
   try{
      await page.evaluate(async()=>{
         if('serviceWorker'in navigator){
            await navigator.serviceWorker.ready;
         }
      });
      console.log('SW aktivan');
   }
   catch{
      console.log('SW nije spreman');
   }
}

function saveReport(report,type,network,timestamp){
   const file=path.join(REPORT_DIR,`report-${type}-${network}-${timestamp}.html`);
   writeFileSync(file,report);
   console.log(`${file}`);
}

async function runTest(networkType){
   console.log(`${NETWORKS[networkType].name}`);

   const browser=await puppeteer.launch({
      headless:'new',
      args:[
         '--no-sandbox',
         '--disable-setuid-sandbox'
      ]
   });

   const page=await browser.newPage();
   const timestamp=new Date().toISOString().replace(/[:.]/g,'-');

   // COLD

   console.log('\nCOLD START');

   await clearEverything(page);

   const coldFlow=await startFlow(page,{
         name:`COLD-${networkType}`,
         config:getConfig(networkType)
      }
   );

   await coldFlow.navigate(APP_URL,{
         stepName:'Cold start'
      }
   );

   await page.waitForSelector('#root');

   await sleep(3000);

   const coldReport=await coldFlow.generateReport();

   saveReport(coldReport,'cold',networkType,timestamp);

   // WARM

   console.log('\nWARM START');
   console.log('Warmup visit');

   await page.goto(APP_URL, {
         waitUntil:'networkidle0'}
   );

   await waitForSW(page);

   console.log(' punim cache');

   await sleep(5000);

   await page.goto( 'about:blank');

   await sleep(2000);

   console.log('Returning visit');

   const warmFlow=await startFlow(page,{
         name:`WARM-${networkType}`,
         config: getConfig(networkType)
      }
   );

   await warmFlow.navigate(APP_URL,{
         stepName:'Warm start',
         configContext:{
            settingsOverrides:{
               disableStorageReset:true
            }
         }
      }
   );

   await page.waitForSelector('#root');

   await sleep(3000);
   const warmReport=await warmFlow.generateReport();
   saveReport(warmReport,'warm',networkType,timestamp);
   await browser.close();
}

(async()=>{
   try{
      await runTest('fast4g');
      await sleep(5000);
      await runTest('slow4g');
      console.log('\n✅ GOTOVO');
   }
   catch(error){
      console.error(error);
   }
})();