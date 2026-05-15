import { clientsClaim } from 'workbox-core';
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';

import { registerRoute } from 'workbox-routing';

import {
  CacheFirst,
  NetworkFirst,
  NetworkOnly,
  StaleWhileRevalidate
} from 'workbox-strategies';

import { ExpirationPlugin } from 'workbox-expiration';

import { CacheableResponsePlugin } from 'workbox-cacheable-response';

import { BackgroundSyncPlugin } from 'workbox-background-sync';

self.skipWaiting();
clientsClaim();

self.__WB_DISABLE_DEV_LOGS = true;
// ✅ ISPRAVAN REDOSLIJED: precache se registruje PRIJE cleanupOutdatedCaches
precacheAndRoute(self.__WB_MANIFEST);
// ✅ cleanupOutdatedCaches() se poziva ODMAH NAKON precacheAndRoute// jer sada Workbox interno zna koji su manifest hashevi validni
cleanupOutdatedCaches();


const VALID_CACHE_NAMES = [  'api-cache',  'image-cache',  'backend-images',  'static-resources',  'pages'];
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();

      const workboxCaches = cacheNames.filter(name =>        
        name.startsWith('workbox-precache')      
      );
      const workboxToDelete = workboxCaches.slice(0, -1);
      const deletePromises = cacheNames  
        .filter((cacheName) => {
            const isValidCustomCache = VALID_CACHE_NAMES.some(name =>
                cacheName === name // EGZAKTNO poklapanje, ne includes()!         
             );
             const isCurrentWorkbox = workboxCaches[workboxCaches.length - 1] === cacheName;
             const isOldWorkbox = workboxToDelete.includes(cacheName);
             if (isOldWorkbox) return true;
             if (isCurrentWorkbox) return false;
             if (isValidCustomCache) return false;
            return true;
          })
          .map(cacheName => {
            console.log('[SW] Brisem stari kes:', cacheName);
            return caches.delete(cacheName)
          });

          await Promise.all(deletePromises);

        })()
      );
    });


/* =========================================================
   BACKEND SLIKE
========================================================= */

registerRoute(
  ({ url }) =>
    url.origin === 'https://master-4-xbzp.onrender.com' &&
    url.pathname.startsWith('/uploads'),

  new CacheFirst({
    cacheName: 'backend-images',

    plugins: [
      new ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 60 * 60 * 24 * 30,
        purgeOnQuotaError: true
      }),

      new CacheableResponsePlugin({
        statuses: [0, 200]
      })
    ]
  })
);





/* =========================================================
   OSTALE SLIKE
========================================================= */

registerRoute(
  ({ request }) => request.destination === 'image' && 
  url.origin !== 'https://master-4-xbzp.onrender.com',

  new CacheFirst({
    cacheName: 'image-cache',

    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 60 * 24 * 7,
        purgeOnQuotaError: true
      }),
      new CacheableResponsePlugin({        
        statuses: [0, 200]      
      })
    ]
  })
);





/* =========================================================
   JS + CSS
========================================================= */

// registerRoute(
//   ({ request }) =>
//     request.destination === 'script' ||
//     request.destination === 'style',

//   new StaleWhileRevalidate({
//     cacheName: 'static-resources',
//   })
// );





/* =========================================================
   API GET
========================================================= */

registerRoute(
  ({ url, request }) =>
    url.origin === 'https://master-4-xbzp.onrender.com' &&
    !url.pathname.startsWith('/uploads') &&
    request.method === 'GET',

    new NetworkFirst({
    cacheName: 'api-cache',
    networkTimeoutSeconds: 5,

    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 60 * 5
      }),
      new CacheableResponsePlugin({        
        statuses: [0, 200]      
      })
    ]
  })
);




/* =========================================================
   PAGE NAVIGATION
========================================================= */

registerRoute(
  ({ request }) => request.mode === 'navigate',

  new NetworkFirst({
    cacheName: 'pages',
    networkTimeoutSeconds: 5,

    plugins: [
      new ExpirationPlugin({        
        maxEntries: 20,        
        maxAgeSeconds: 60 * 60 * 24      
      }),
      {
        handlerDidError: async () => {
          const cache = await caches.open('pages');

          const cached = await cache.match('/index.html');

          return (
            cached ||
            new Response('Offline', {
              status: 503,
              headers: {
                'Content-Type': 'text/html'
              }
            })
          );
        }
      }
    ]
  })
);





/* =========================================================
   BACKGROUND SYNC
========================================================= */

const postBgSync = new BackgroundSyncPlugin('postQueue', {
  maxRetentionTime: 24 * 60,

  onSync: async ({ queue }) => {

    let entry;
    while ((entry = await queue.shiftRequest())) {
      try {
        const request = entry.request.clone();
        const response = await fetch(request);

        if (!response.ok) {
          throw new Error('Request failed');
        }


        sendMetricToClient({
          type: 'SYNC_SUCCESS'
        });

        // 🔔 NOTIFIKACIJA
        await self.registration.showNotification(
          '✅ Prijava uspješna! 🎉',
          {
            body: 'Vaš rad je uspješno prijavljen!',
            icon: '/icons/192.png'
          }
        );

        // 📡 POŠALJI FRONTEND-U
        const clients = await self.clients.matchAll();

        clients.forEach(client => {
          client.postMessage({
            type: 'SYNC_COMPLETE',
            url: request.url
          });
        });

      } catch (error) {

        const clients = await self.clients.matchAll();

        clients.forEach(client => {
          client.postMessage({
            type: 'SYNC_FAILED',
            url: entry.request.url
          });
        });

        await queue.unshiftRequest(entry);

        throw error;
      }
    }
  }
});





/* =========================================================
   POST REQUESTS
========================================================= */

registerRoute(
  ({ url, request }) =>
    url.origin === 'https://master-4-xbzp.onrender.com' &&
    request.method === 'POST',

  new NetworkOnly({plugins: [postBgSync]}),
  'POST'
);


/* =========================================================
   PUT / PATCH / DELETE
========================================================= */

const mutateBgSync = new BackgroundSyncPlugin('mutateQueue', {
  maxRetentionTime: 24 * 60
});

registerRoute(
  ({ url, request }) =>
    url.origin === 'https://master-4-xbzp.onrender.com' &&
    ['PUT', 'PATCH', 'DELETE'].includes(request.method),

  new NetworkOnly({
    plugins: [mutateBgSync]
  })
);





/* =========================================================
   PUSH NOTIFICATIONS
========================================================= */

self.addEventListener('push', (event) => {

  let data = {
    title: 'Art Competition',
    body: 'Nova notifikacija',
    icon: '/icons/192.png',
    badge: '/icons/192.png'
  };

  if (event.data) {
    try {
      data = {
        ...data,
        ...event.data.json()
      };
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,

    vibrate: [200, 100, 200],

    data: {
      url: data.url || '/'
    },

    actions: [
      {
        action: 'open',
        title: 'Otvori'
      },
      {
        action: 'close',
        title: 'Zatvori'
      }
    ]
  };

  // const clients = await self.clients.matchAll();

  // clients.forEach(client => {
  //   client.postMessage({
  //     type: 'PUSH_RECEIVED'
  //   });
  // });
  event.waitUntil(    
    self.registration.showNotification(data.title, options)  
  );
});




/* =========================================================
   CLICK ON NOTIFICATION
========================================================= */

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification?.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate(urlToOpen);
          return client.focus();
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

/* =========================================================
   METRICS COMMUNICATION
========================================================= */

function sendMetricToClient(data) {
  self.clients.matchAll({
    includeUncontrolled: true,
    type: 'window'
  }).then((clientList) => {
    clientList.forEach(client => {
      client.postMessage(data);
    });
  });
}