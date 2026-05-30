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

  new NetworkFirst({
    cacheName:"pages",
    networkTimeoutSeconds:2,

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
        
        await self.registration.showNotification(
          '✅ Profil ažuriran! 👤',
          {
            body: 'Vaš profil je uspješno ažuriran!',
            icon: '/icons/192.png',
            badge: '/icons/192.png',
            data: { url: '/' }
          }
        );
        
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
          client.postMessage({
            type: 'PROFILE_SYNC_COMPLETE'
          });
        });
        
      } catch (error) {
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
          client.postMessage({
            type: 'PROFILE_SYNC_FAILED',
            error: error.message
          });
        });
        
        await queue.unshiftRequest(entry);
        throw error;
      }
    }
  }
});

// POST REQUESTS

// Custom queue za artworks sa slikama
const artworkQueue = [];
let isProcessingArtworkQueue = false;

async function processArtworkQueue() {
  if (isProcessingArtworkQueue) return;
  if (!navigator.onLine) return;
  if (artworkQueue.length === 0) return;
  
  isProcessingArtworkQueue = true;
  
  while (artworkQueue.length > 0) {
    const item = artworkQueue[0];
    
    try {
      // Rekonstruiši FormData iz sačuvanih podataka
      const formData = new FormData();
      formData.append('naziv', item.data.naziv);
      formData.append('opis_djela', item.data.opis_djela);
      formData.append('naziv_kategorije', item.data.naziv_kategorije);
      formData.append('id_umjetnika', item.data.id_umjetnika);
      formData.append('datum_slanja', item.data.datum_slanja);
      
      // Konvertuj base64 nazad u Blob
      if (item.data.slika_base64) {
        const response = await fetch(item.data.slika_base64);
        const blob = await response.blob();
        formData.append('slika', blob, 'image.jpg');
      }
      
      const response = await fetch(item.url, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error('Upload failed');
      
      const responseData = await response.json();
      
      // Ako je potrebno, pošalji i RK zahtjev
      if (item.requiresRk && responseData[0]?.id) {
        await fetch('https://master-4-xbzp.onrender.com/rk/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            id_umjetnika_rk: item.data.id_umjetnika,
            id_rada_rk: responseData[0].id
          })
        });
      }
      
      // Ukloni uspješni item iz queue-a
      artworkQueue.shift();
      await saveArtworkQueueToStorage();
      
      // Pošalji notifikaciju
      await self.registration.showNotification(
        '✅ Umjetničko djelo dodano! 🎨',
        {
          body: `Vaše djelo "${item.data.naziv}" je uspješno dodano!`,
          icon: '/icons/192.png',
          badge: '/icons/192.png',
          data: { url: '/' }
        }
      );
      
      // Obavijesti klijente
      const clients = await self.clients.matchAll();
      clients.forEach(client => {
        client.postMessage({
          type: 'ARTWORK_SYNC_COMPLETE',
          data: responseData
        });
      });
      
    } catch (error) {
      console.error('Failed to process artwork:', error);
      // Zaustavi procesiranje ako je network error
      if (!navigator.onLine) break;
      // Ako je drugi error, zadrži u queue-u za kasnije
      break;
    }
  }
  
  isProcessingArtworkQueue = false;
  
  if (artworkQueue.length > 0 && navigator.onLine) {
    setTimeout(processArtworkQueue, 5000);
  }
}

// Sačuvaj artwork queue u IndexedDB
async function saveArtworkQueueToStorage() {
  const db = await openSyncDB();
  const tx = db.transaction('artworkQueue', 'readwrite');
  const store = tx.objectStore('artworkQueue');
  store.clear();
  for (const item of artworkQueue) {
    store.add(item);
  }
}

// Učitaj artwork queue iz IndexedDB
async function loadArtworkQueueFromStorage() {
  const db = await openSyncDB();
  const tx = db.transaction('artworkQueue', 'readonly');
  const store = tx.objectStore('artworkQueue');
  const items = await store.getAll();
  artworkQueue.push(...items);
}

// Custom queue za profile updates
const profileQueue = [];
let isProcessingProfileQueue = false;

async function processProfileQueue() {
  if (isProcessingProfileQueue) return;
  if (!navigator.onLine) return;
  if (profileQueue.length === 0) return;
  
  isProcessingProfileQueue = true;
  
  while (profileQueue.length > 0) {
    const item = profileQueue[0];
    
    try {
      const response = await fetch(item.url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(item.data)
      });
      
      if (!response.ok) throw new Error('Update failed');
      
      profileQueue.shift();
      await saveProfileQueueToStorage();
      
      await self.registration.showNotification(
        '✅ Profil ažuriran! 👤',
        {
          body: 'Vaš profil je uspješno ažuriran!',
          icon: '/icons/192.png',
          badge: '/icons/192.png',
          data: { url: '/' }
        }
      );
      
      const clients = await self.clients.matchAll();
      clients.forEach(client => {
        client.postMessage({
          type: 'PROFILE_SYNC_COMPLETE'
        });
      });
      
    } catch (error) {
      if (!navigator.onLine) break;
      break;
    }
  }
  
  isProcessingProfileQueue = false;
  
  if (profileQueue.length > 0 && navigator.onLine) {
    setTimeout(processProfileQueue, 5000);
  }
}

async function saveProfileQueueToStorage() {
  const db = await openSyncDB();
  const tx = db.transaction('profileQueue', 'readwrite');
  const store = tx.objectStore('profileQueue');
  store.clear();
  for (const item of profileQueue) {
    store.add(item);
  }
}

async function loadProfileQueueFromStorage() {
  const db = await openSyncDB();
  const tx = db.transaction('profileQueue', 'readonly');
  const store = tx.objectStore('profileQueue');
  const items = await store.getAll();
  profileQueue.push(...items);
}

// Open IndexedDB helper
function openSyncDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('OfflineSyncDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('artworkQueue')) {
        db.createObjectStore('artworkQueue', { autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('profileQueue')) {
        db.createObjectStore('profileQueue', { autoIncrement: true });
      }
    };
  });
}

// Slušaj online event
self.addEventListener('online', () => {
  processArtworkQueue();
  processProfileQueue();
});

// Inicijalizacija
(async () => {
  await loadArtworkQueueFromStorage();
  await loadProfileQueueFromStorage();
  if (navigator.onLine) {
    processArtworkQueue();
    processProfileQueue();
  }
})();

// Custom message handler za dodavanje u queue
self.addEventListener('message', (event) => {
  if (event.data?.type === 'ADD_TO_ARTWORK_QUEUE') {
    artworkQueue.push(event.data.payload);
    saveArtworkQueueToStorage();
    if (navigator.onLine) {
      processArtworkQueue();
    }
  }
  
  if (event.data?.type === 'ADD_TO_PROFILE_QUEUE') {
    profileQueue.push(event.data.payload);
    saveProfileQueueToStorage();
    if (navigator.onLine) {
      processProfileQueue();
    }
  }
});

// ZAMIJENITE POSTOJEĆI registerRoute ZA POST /artworks/ SA OVIM:
registerRoute(
  ({ url, request }) =>
    url.origin === 'https://master-4-xbzp.onrender.com' &&
    request.method === 'POST' &&
    url.pathname === '/artworks/',
  
  async ({ request }) => {
    // Sačuvaj request u queue umjesto da ga šalješ odmah
    const formData = await request.formData();
    const artworkData = {};
    
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        // Konvertuj File u base64
        const reader = new FileReader();
        const base64 = await new Promise((resolve) => {
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(value);
        });
        artworkData[key] = base64;
      } else {
        artworkData[key] = value;
      }
    }
    
    const queueItem = {
      url: request.url,
      data: artworkData,
      timestamp: Date.now(),
      requiresRk: true
    };
    
    // Pošalji klijentu da doda u queue
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'ADD_TO_ARTWORK_QUEUE',
        payload: queueItem
      });
    });
    
    // Vrati response da se request ne bi ponavljao
    return new Response(JSON.stringify({ queued: true, offline: true }), {
      status: 202,
      headers: { 'Content-Type': 'application/json' }
    });
  },
  'POST'
);

//  PUT ROUTA ZA PROFILE
registerRoute(
  ({ url, request }) =>
    url.origin === 'https://master-4-xbzp.onrender.com' &&
    request.method === 'PUT' &&
    url.pathname.match(/\/user\/\d+$/),
  
  async ({ request }) => {
    const data = await request.json();
    const queueItem = {
      url: request.url,
      data: data,
      timestamp: Date.now()
    };
    
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'ADD_TO_PROFILE_QUEUE',
        payload: queueItem
      });
    });
    
    return new Response(JSON.stringify({ queued: true, offline: true }), {
      status: 202,
      headers: { 'Content-Type': 'application/json' }
    });
  },
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