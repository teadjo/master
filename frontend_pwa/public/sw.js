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
self.__WB_DISABLE_DEV_LOGS = true;
precacheAndRoute(self.__WB_MANIFEST);

// BACKEND SLIKE

registerRoute(
  ({ url }) =>
    url.origin === 'https://master-4-xbzp.onrender.com' &&
    url.pathname.startsWith('/uploads'),

  new CacheFirst({
    cacheName: 'backend-images',

    plugins: [
      new ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 60 * 60 * 24 * 30
      }),

      new CacheableResponsePlugin({
        statuses: [200]
      })
    ]
  })
);

// OSTALE SLIKE

registerRoute(
   ({url,request}) =>
      url.origin !== 'https://master-4-xbzp.onrender.com' &&
      request.destination==="image",

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

// API GET

registerRoute(
 ({url,request}) =>
   url.origin==="https://master-4-xbzp.onrender.com" &&
   !url.pathname.startsWith('/uploads') &&
   request.method==="GET",

 new StaleWhileRevalidate({
   cacheName:'api-cache',

   plugins:[
      new ExpirationPlugin({
         maxEntries:50,
         maxAgeSeconds:60*60
      })
   ]
 })
);

// PAGE NAVIGATION

registerRoute(
  ({ request }) => request.mode === 'navigate',

  new StaleWhileRevalidate({
    cacheName:"pages",
    // networkTimeoutSeconds:2,

    plugins: [
       new CacheableResponsePlugin({
        statuses: [200],
        headers: {
          'Content-Type': 'text/html'
        }
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
      },   
      new ExpirationPlugin({
        maxEntries: 20,
        maxAgeSeconds: 60 * 60 * 24
      }),
    ]
  })
);

// BACKGROUND SYNC

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

        await self.registration.showNotification(
          '✅ Prijava uspješna! 🎉',
          {
            body: 'Vaš rad je uspješno prijavljen!',
            icon: '/icons/192.png'
          }
        );

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

const artworksBgSync = new BackgroundSyncPlugin('artworksQueue', {
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
          type: 'ARTWORK_SYNC_COMPLETE'
        });

        const responseData = await response.clone().json();
        
        // Pošalji notifikaciju o uspjehu
        await self.registration.showNotification(
          '✅ Umjetničko djelo dodano! 🎨',
          {
            body: 'Vaše umjetničko djelo je uspješno dodano!',
            icon: '/icons/192.png',
            badge: '/icons/192.png',
          }
        );
        
        // Obavijesti klijente
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
          client.postMessage({
            type: 'ARTWORK_SYNC_COMPLETE',
            url: request.url
          });
        });
        
      } catch (error) {
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
          client.postMessage({
            type: 'ARTWORK_SYNC_FAILED',
            url: entry.request.url
          });
        });
        
        await queue.unshiftRequest(entry);
        throw error;
      }
    }
  }
});

// SPECIFIČNI PLUGIN ZA PROFILE UPDATE
const profileBgSync = new BackgroundSyncPlugin('profileQueue', {
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
          type: 'PROFILE_SYNC_COMPLETE'
        });

        await self.registration.showNotification(
          '✅ Profil ažuriran! 👤',
          {
            body: 'Vaš profil je uspješno ažuriran!',
            icon: '/icons/192.png',
            badge: '/icons/192.png',
          }
        );
        
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
          client.postMessage({
            type: 'PROFILE_SYNC_COMPLETE',
            url: request.url
          });
        });
        
      } catch (error) {
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
          client.postMessage({
            type: 'PROFILE_SYNC_FAILED',
            url: entry.request.url
          });
        });
        
        await queue.unshiftRequest(entry);
        throw error;
      }
    }
  }
});

// POST REQUESTS
registerRoute(
  ({ url, request }) =>
    url.origin === 'https://master-4-xbzp.onrender.com' &&
    request.method === 'POST' &&
    url.pathname === '/artworks/',

  new NetworkOnly({
    plugins: [artworksBgSync]
  }),
  'POST'
);

// PROFILE UPDATE
registerRoute(
  ({ url, request }) =>
    url.origin === 'https://master-4-xbzp.onrender.com' &&
    request.method === 'PUT' &&
    url.pathname.match(/\/user\/\d+$/),

  new NetworkOnly({
    plugins: [profileBgSync]
  }),
  'PUT'
);

// OSTALE POST RUTE (uključujući /spec/)
registerRoute(
  ({ url, request }) =>
    url.origin === 'https://master-4-xbzp.onrender.com' &&
    request.method === 'POST' &&
    url.pathname !== '/artworks/',

  new NetworkOnly({
    plugins: [postBgSync]
  }),
  'POST'
);

// PUT / PATCH / DELETE

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

// PUSH NOTIFICATIONS

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

  if (Notification.permission === 'granted') {
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
}
});

// CLICK ON NOTIFICATION

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

// METRICS COMMUNICATION

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