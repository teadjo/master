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

cleanupOutdatedCaches();

precacheAndRoute(self.__WB_MANIFEST);

console.log('✅ Custom SW učitan');





/* =========================================================
   BACKEND SLIKE
========================================================= */

registerRoute(
  ({ url }) =>
    url.origin === 'https://master-azure-two.vercel.app/' &&
    url.pathname.startsWith('/uploads'),

  new CacheFirst({
    cacheName: 'backend-images',

    plugins: [
      new ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 60 * 60 * 24 * 30
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
  ({ request }) => request.destination === 'image',

  new CacheFirst({
    cacheName: 'image-cache',

    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 60 * 24 * 7
      })
    ]
  })
);





/* =========================================================
   JS + CSS
========================================================= */

registerRoute(
  ({ request }) =>
    request.destination === 'script' ||
    request.destination === 'style',

  new StaleWhileRevalidate({
    cacheName: 'static-resources',
    plugins: [
  {
    cachedResponseWillBeUsed: async ({ cachedResponse }) => {

      const clients = await self.clients.matchAll();

      clients.forEach(client => {
        client.postMessage({
          type: cachedResponse
            ? 'CACHE_HIT'
            : 'CACHE_MISS'
        });
      });

      return cachedResponse;
    }
  }
]
  })
);





/* =========================================================
   API GET
========================================================= */

registerRoute(
  ({ url, request }) =>
    url.origin === 'https://master-azure-two.vercel.app/' &&
    request.method === 'GET',

    new StaleWhileRevalidate({
  cacheName: 'api-cache',

  plugins: [
    {
      cachedResponseWillBeUsed: async ({ cachedResponse }) => {
        if (cachedResponse) {
          sendMetricToClient({
            type: 'CACHE_HIT'
          });
        }

        return cachedResponse;
      }
    },
    {
    cachedResponseWillBeUsed: async ({ cachedResponse }) => {

      const clients = await self.clients.matchAll();

      clients.forEach(client => {
        client.postMessage({
          type: cachedResponse
            ? 'CACHE_HIT'
            : 'CACHE_MISS'
        });
      });

      return cachedResponse;
    }
  }
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
    networkTimeoutSeconds: 3,

    plugins: [
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
    console.log('🔄 Replay queued requests...');

    let entry;

    while ((entry = await queue.shiftRequest())) {
      try {
        const request = entry.request.clone();

        const response = await fetch(request);

        if (!response.ok) {
          throw new Error('Request failed');
        }

        console.log('✅ Request replayovan');

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

        console.error('❌ Replay failed:', error);

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
    url.origin === 'https://master-azure-two.vercel.app/' &&
    request.method === 'POST',

  new NetworkOnly({
    plugins: [postBgSync]
  }),

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
    url.origin === 'https://master-azure-two.vercel.app/' &&
    ['PUT', 'PATCH', 'DELETE'].includes(request.method),

  new NetworkOnly({
    plugins: [mutateBgSync]
  })
);





/* =========================================================
   PUSH NOTIFICATIONS
========================================================= */

self.addEventListener('push', (event) => {
  console.log('📨 Push received');

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
    clients.matchAll({
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

console.log('✅ SW READY');

/* =========================================================
   METRICS COMMUNICATION
========================================================= */

function sendMetricToClient(data) {
  clients.matchAll({
    includeUncontrolled: true,
    type: 'window'
  }).then((clientList) => {
    clientList.forEach(client => {
      client.postMessage(data);
    });
  });
}