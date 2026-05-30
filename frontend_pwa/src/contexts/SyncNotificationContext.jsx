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
  const [pendingActions, setPendingActions] = useState([]);

  // Slušaj poruke od service workera
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const handleMessage = (event) => {
      console.log('📨 SW Message:', event.data);
      
      if (event.data?.type === 'SYNC_COMPLETE') {
        setSyncStatus('complete');
        setPendingCount(0);
        setLastSyncTime(Date.now());
        
        showNotification(
          '✅ Sinhronizacija završena!',
          'Sve vaše offline promjene su uspješno sinhronizovane.',
          'sync-complete'
        );
      } 
      else if (event.data?.type === 'ARTWORK_SYNC_COMPLETE') {
        setPendingCount(prev => Math.max(0, prev - 1));
        showNotification(
          '✅ Umjetničko djelo dodano! 🎨',
          'Vaše djelo je uspješno dodano na profil.',
          'artwork-sync'
        );
      }
      else if (event.data?.type === 'PROFILE_SYNC_COMPLETE') {
        setPendingCount(prev => Math.max(0, prev - 1));
        showNotification(
          '✅ Profil ažuriran! 👤',
          'Vaše izmjene profila su sačuvane.',
          'profile-sync'
        );
      }
      else if (event.data?.type === 'APPLICATION_SYNC_COMPLETE') {
        setPendingCount(prev => Math.max(0, prev - 1));
        showNotification(
          '✅ Prijava na takmičenje uspješna! 🏆',
          'Vaš rad je prijavljen na takmičenje.',
          'application-sync'
        );
      }
      else if (event.data?.type?.includes('SYNC_FAILED')) {
        showToast('Greška pri sinhronizaciji, pokušaćemo ponovo', 'error');
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, []);

  useEffect(() => {

   const handleMessage = (event) => {

      switch(event.data.type){

         case 'ARTWORK_SYNC_COMPLETE':

            showToast(
               '✨ Umjetničko djelo uspješno dodano!',
               'success'
            );

            break;

         case 'ARTWORK_SYNC_FAILED':

            showToast(
               'Greška pri sinhronizaciji djela',
               'error'
            );

            break;

         case 'PROFILE_SYNC_COMPLETE':

            showToast(
               'Profil uspješno ažuriran!',
               'success'
            );

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

  // Slušaj sync poruke za profile update
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data.type === 'PROFILE_SYNC_COMPLETE') {
        showToast('✅ Vaš profil je uspješno ažuriran!', 'success');
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else if (event.data.type === 'PROFILE_SYNC_FAILED') {
        showToast('Greška pri ažuriranju profila', 'error');
      }
    };

    if (navigator.serviceWorker) {
      navigator.serviceWorker.addEventListener('message', handleMessage);
      return () => {
        navigator.serviceWorker.removeEventListener('message', handleMessage);
      };
    }
  }, []);

  // Timer za resetovanje statusa
  useEffect(() => {
    if (syncStatus !== 'complete') return;

    const timeout = setTimeout(() => {
      setSyncStatus('idle');
    }, 4000);

    return () => clearTimeout(timeout);
  }, [syncStatus]);

  // Provjeri pending sync na load
  useEffect(() => {
    const checkPendingSync = async () => {
      const pending = localStorage.getItem('pendingSync');
      if (pending) {
        try {
          const { type, timestamp } = JSON.parse(pending);
          const timeSince = Date.now() - timestamp;
          
          if (timeSince < 1000 * 60 * 5) { // Manje od 5 minuta
            setPendingCount(prev => prev + 1);
            showToast(
              `📱 Sinhronizacija (${type}) je u toku...`,
              'info'
            );
          }
          localStorage.removeItem('pendingSync');
        } catch (error) {
          console.error('Error checking pending sync:', error);
        }
      }
    };
    
    checkPendingSync();
  }, []);

  const showNotification = useCallback(async (title, body, tag = 'default') => {
    try {
      if (!('Notification' in window)) {
        showToast(body, 'info');
        return false;
      }

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
        data: {
          url: '/',
          timestamp: Date.now()
        }
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
    setPendingActions(prev => [...prev, pendingAction]);
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
    
    showToast(notificationBody, 'info');
    
  }, [showNotification]);

  // Ručna provjera i pokretanje sync-a
  const checkAndSync = useCallback(async () => {
    if (!navigator.onLine) {
      showToast('Niste online, pokušajte kasnije', 'error');
      return false;
    }
    
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        
        // Pokušaj pokrenuti sve tipove sync-ova
        const syncTags = ['post-sync', 'artworks-sync', 'profile-sync'];
        
        for (const tag of syncTags) {
          try {
            await registration.sync.register(tag);
          } catch (error) {
            console.log(`Could not register ${tag}:`, error);
          }
        }
        
        showToast('Provjera offline promjena...', 'info');
        return true;
      } catch (error) {
        console.error('Error during manual sync:', error);
        showToast('Greška pri sinhronizaciji', 'error');
        return false;
      }
    }
    
    return false;
  }, [showToast]);

  const clearPendingActions = useCallback(() => {
    setPendingActions([]);
    setPendingCount(0);
    localStorage.removeItem('pendingSync');
  }, []);

  const value = {
    syncStatus,
    startOfflineSync,
    showNotification,
    setSyncStatus,
    pendingCount,
    lastSyncTime,
    pendingActions,
    checkAndSync,
    clearPendingActions
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