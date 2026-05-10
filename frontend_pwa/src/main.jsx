import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import '@fortawesome/fontawesome-free/css/all.min.css';
import { ToastProvider } from './ToastContext.jsx';
import { onCLS, onLCP, onTTFB, onINP } from 'web-vitals';
import { pwaMetrics } from './utils/metrics';
import {
  incrementMetric
} from './utils/analyticsStore';


function sendToAnalytics(metric) {
  console.log(metric);

  const existing = JSON.parse(localStorage.getItem('metrics') || '[]')
  existing.push(metric)
  localStorage.setItem('metrics', JSON.stringify(existing))
}

if ('requestIdleCallback' in window) {
  requestIdleCallback(() => {
    onCLS(sendToAnalytics);
    onLCP(sendToAnalytics);
    onTTFB(sendToAnalytics);
    onINP(sendToAnalytics);
  });
}

if ('serviceWorker' in navigator) {
  import('virtual:pwa-register').then(({ registerSW }) => {
    registerSW({
      immediate: true,
      onNeedRefresh() {
        console.log('Nova verzija dostupna');
      },
      onOfflineReady() {
        console.log('App spremna za offline');
      },
      onRegistered(registration) {
        // NOVO: Prati background sync status
        console.log('✅ SW registrovan, provjeravam sync...');
        
        if (registration && 'sync' in registration) {
          // Provjeri ima li pending syncova
          registration.sync.getTags().then(tags => {
            if (tags.length > 0) {
              console.log('📋 Pending sync tags:', tags);
            }
          });
        }
        
        // Periodična provjera sync statusa
        setInterval(async () => {
          if (navigator.onLine && registration && registration.active) {
            try {
              const tags = await registration.sync.getTags();
              if (tags.length > 0) {
                console.log('📋 Aktivni syncovi:', tags);
              }
            } catch (error) {
              // SyncManager možda nije dostupan
            }
          }
        }, 30000); // Svakih 30 sekundi
      }
    })
  })
}

// NOVO: Prati sync poruke od Service Workera
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    console.log('📨 Poruka od SW:', event.data);
    
    if (event.data && event.data.type === 'SYNC_STATUS') {
      console.log('📊 Sync status:', event.data.tags);
      
      if (event.data.tags.length > 0) {
        console.log('🔄 Sinhronizacija u toku...');
      } else {
        console.log('✅ Svi podaci sinhronizovani');
      }
    }
    
    if (event.data && event.data.type === 'SYNC_COMPLETE') {
      console.log('🎉 SYNC_COMPLETE primljeno!');
    }
  });
}

performance.mark('app-start');

window.addEventListener('load', () => {
  performance.mark('app-loaded');
  performance.measure('app-load-time', 'app-start', 'app-loaded');

  const measures = performance.getEntriesByName('app-load-time');

  const existing = JSON.parse(localStorage.getItem('metrics') || '[]')
  existing.push(measures[0])
  localStorage.setItem('metrics', JSON.stringify(existing))
   const allMetrics = JSON.parse(localStorage.getItem('pwa-metrics-history') || '[]');
  allMetrics.push(pwaMetrics.getReport());
  localStorage.setItem('pwa-metrics-history', JSON.stringify(allMetrics));
});

// NOVO: Monitoring online/offline za background sync
window.addEventListener('online', () => {
  console.log('🟢 Online - SW će automatski pokrenuti sync');
  
  // Pošalji poruku SW-u da provjeri sync
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'CHECK_SYNC'
    });
  }
});

window.addEventListener('offline', () => {
  console.log('🔴 Offline - POST zahtjevi će biti sačuvani');
});

performance.mark('sw-installed')

navigator.serviceWorker.ready.then((registration) => {
  performance.mark('sw-ready')
  performance.measure('sw-activation', 'app-start', 'sw-ready')
  
  // NOVO: Provjeri sync pri startu
  if ('sync' in registration) {
    registration.sync.getTags().then(tags => {
      console.log('📋 Sync stanje pri startu:', tags);
    });
  }
})

navigator.serviceWorker.addEventListener('message', (event) => {

  switch (event.data?.type) {

    case 'CACHE_HIT':
      incrementMetric('cacheHits');
      break;

    case 'CACHE_MISS':
      incrementMetric('cacheMisses');
      break;

    case 'SYNC_SUCCESS':
      incrementMetric('syncSuccess');
      break;

    case 'SYNC_FAILED':
      incrementMetric('syncFailed');
      break;
    case 'PUSH_RECEIVED':
      incrementMetric('pushNotifications');
      break;

    default:
      break;
  }
});


navigator.serviceWorker.ready.then(async (registration) => {
  console.log('✅ SW spreman');
  
  if ('periodicSync' in registration) {
    try {
      const status = await navigator.permissions.query({
        name: 'periodic-background-sync',
      });
      
      if (status.state === 'granted') {
        await registration.periodicSync.register('update-competitions', {
          minInterval: 60 * 60 * 1000 // 1 sat
        });
        console.log('✅ Periodic sync registrovan');
      } else {
        console.log('⚠️ Periodic sync nema permisiju:', status.state);
      }
    } catch (error) {
      console.log('ℹ️ Periodic sync nije dostupan:', error.message);
    }
  } else {
    console.log('ℹ️ Periodic sync API nije podržan');
  }
}).catch(error => {
  console.error('❌ Greška pri registraciji periodic sync:', error);
});


performance.mark(navigator.onLine ? 'online-load' : 'offline-load')

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </StrictMode>
)