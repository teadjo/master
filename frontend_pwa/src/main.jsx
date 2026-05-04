import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import '@fortawesome/fontawesome-free/css/all.min.css';
import { ToastProvider } from './ToastContext.jsx';
import { onCLS, onLCP, onTTFB, onINP } from 'web-vitals';

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
      }
    })
  })
}

performance.mark('app-start');

window.addEventListener('load', () => {
  performance.mark('app-loaded');
  performance.measure('app-load-time', 'app-start', 'app-loaded');

  const measures = performance.getEntriesByName('app-load-time');

  const existing = JSON.parse(localStorage.getItem('metrics') || '[]')
  existing.push(measures[0])
  localStorage.setItem('metrics', JSON.stringify(existing))
});

performance.mark('sw-installed')

navigator.serviceWorker.ready.then(() => {
  performance.mark('sw-ready')
  performance.measure('sw-activation', 'app-start', 'sw-ready')
})
performance.mark(navigator.onLine ? 'online-load' : 'offline-load')

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </StrictMode>
)