import {
  createContext,
  useContext,
  useState,
  useCallback, 
  useEffect
} from 'react';

import { useToast } from '../ToastContext';

const SyncNotificationContext = createContext(null);

export function SyncNotificationProvider({ children }) {
  const { showToast } = useToast();
  const [pendingCount, setPendingCount] = useState(0); 
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [syncStatus, setSyncStatus] = useState('idle');

  useEffect(() => {
  if (!('serviceWorker' in navigator)) return;
   const handleMessage = (event) => {

      switch(event.data.type){

         case 'ARTWORK_SYNC_COMPLETE':
            setSyncStatus('complete');
            setPendingCount(0);
            setLastSyncTime(Date.now());

            break;

         case 'ARTWORK_SYNC_FAILED':

            showToast(
               'Greška pri sinhronizaciji djela',
               'error'
            );

            break;

         case 'PROFILE_SYNC_COMPLETE':
            setSyncStatus('complete');
            setPendingCount(0);
            setLastSyncTime(Date.now());

            break;

         case 'PROFILE_SYNC_FAILED':

            showToast(
               'Greška pri sinhronizaciji profila',
               'error'
            );

            break;
      }

   };

   navigator.serviceWorker.addEventListener(
      'message',
      handleMessage
   );

   return () =>
      navigator.serviceWorker.removeEventListener(
         'message',
         handleMessage
      );

}, []);

useEffect(() => {
  if (syncStatus !== 'complete') return;

  const timeout = setTimeout(() => {
    setSyncStatus('idle');
  }, 4000);

  return () => clearTimeout(timeout);
}, [syncStatus]);

  const showNotification = useCallback(async (title, body, tag = 'default') => {
    try {
      let permission = Notification.permission;

      if (permission !== 'granted') {
        permission = await Notification.requestPermission();
      }

      if (permission !== 'granted') {
        showToast(body, 'info');
        return false;
      }

      const registration = await navigator.serviceWorker.ready;

      await registration.showNotification(title, {
        body,
        icon: '/icons/192.png',
        badge: '/icons/192.png',
        tag,
        renotify: true,
        requireInteraction: true,
        vibrate: [200, 100, 200],
      });

      return true;
    } catch (error) {
      console.error('❌ Notification error:', error);
      showToast(body, 'info');
      return false;
    }
  }, [showToast]);

  // Start offline sync za različite tipove akcija
  const startOfflineSync = useCallback(async (actionType, redirectUrl = '/') => {
    setSyncStatus('pending');
    setPendingCount(prev => prev + 1);
    
    // Spremi u localStorage za praćenje
    const pendingAction = {
      type: actionType,
      redirectUrl,
      timestamp: Date.now()
    };
    localStorage.setItem('pendingSync', JSON.stringify(pendingAction));
    
    // Registruj background sync sa service workerom
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        
        // Registruj specifični sync za tip akcije
        let syncTag = '';
        switch(actionType) {
          case 'application':
            syncTag = 'post-sync';
            break;
          case 'artwork':
            syncTag = 'artworks-sync';
            break;
          case 'profile':
            syncTag = 'profile-sync';
            break;
          default:
            syncTag = 'post-sync';
        }
        
        await registration.sync.register(syncTag);
        console.log(`✅ Background sync registered: ${syncTag}`);
      } catch (error) {
        console.error('❌ Sync registration failed:', error);
      }
    }
    
    // Prikaži odgovarajuću notifikaciju
    let notificationTitle = '📱 Offline akcija sačuvana';
    let notificationBody = '';
    
    switch(actionType) {
      case 'application':
        notificationBody = 'Vaša prijava na takmičenje će biti poslata kada internet bude ponovo dostupan.';
        break;
      case 'artwork':
        notificationBody = 'Vaše umjetničko djelo će biti dodano kada internet bude ponovo dostupan.';
        break;
      case 'profile':
        notificationBody = 'Vaše izmjene profila će biti sačuvane kada internet bude ponovo dostupan.';
        break;
      default:
        notificationBody = 'Vaše promjene će biti sinhronizovane kada internet bude ponovo dostupan.';
    }
    
    await showNotification(
      notificationTitle,
      notificationBody,
      `offline-${actionType}`
    );
    
    // showToast(notificationBody, 'info');
    
  }, [showNotification]);


  const value = {
    syncStatus,
    startOfflineSync,
    showNotification,
    setSyncStatus,
    pendingCount,
    lastSyncTime,
  };

  return (
    <SyncNotificationContext.Provider value={value}>
      {children}
    </SyncNotificationContext.Provider>
  );
}

export function useSyncNotification() {
  const context = useContext(SyncNotificationContext);

  if (!context) {
    throw new Error(
      'useSyncNotification must be used within SyncNotificationProvider'
    );
  }

  return context;
}