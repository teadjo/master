const SYNC_QUEUE = 'postQueue';

export async function addToBackgroundSync(request) {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    const registration = await navigator.serviceWorker.ready;
    
    const db = await openDB();
    const tx = db.transaction('pendingRequests', 'readwrite');
    await tx.store.add({
      url: request.url,
      method: request.method,
      body: await request.clone().text(),
      headers: Object.fromEntries(request.headers),
      timestamp: Date.now()
    });
    await tx.done;
    
    await registration.sync.register(SYNC_QUEUE);
  }
}