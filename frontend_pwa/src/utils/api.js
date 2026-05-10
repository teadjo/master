import axios from 'axios';
import { incrementMetric } from './analyticsStore';

const API = import.meta.env.VITE_API_URL;

export const api = axios.create({
  baseURL: API,
  timeout: 10000,
});

// samo UX fallback (bez IndexedDB queue)
api.interceptors.response.use(
  response => response,
  async error => {
    if (!navigator.onLine && error.config) {
      const method = error.config.method?.toLowerCase();
      incrementMetric('offlineRequests');
      if (['post', 'put', 'patch', 'delete'].includes(method)) {
        console.log('📱 Offline - request će Workbox cache-irati');


        localStorage.setItem(
          'offline-requests',
          String(Number(localStorage.getItem('offline-requests') || 0) + 1)
        );
        return Promise.resolve({
          data: {
            success: true,
            message: 'Sačuvano offline (Workbox sync)',
            queued: true
          },
          status: 202,
          statusText: 'Queued',
          config: error.config
        });
      }
    }

    return Promise.reject(error);
  }
);