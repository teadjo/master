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
    if (event.data?.type === 'SYNC_COMPLETE') {
      console.log('✅ Sync complete message');

      setSyncStatus('complete');

      setPendingCount(0);

      setLastSyncTime(Date.now());

     
    }
  };

  navigator.serviceWorker.addEventListener('message', handleMessage);

  return () => {
    navigator.serviceWorker.removeEventListener('message', handleMessage);
  };
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
        vibrate: [200, 100, 200]
      });

      return true;
    } catch (error) {
      console.error('❌ Notification error:', error);
      showToast(body, 'info');
      return false;
    }
  }, [showToast]);

  // POZIVA SE KAD KORISNIK OFFLINE POŠALJE ZAHTJEV
  const startOfflineSync = useCallback(async () => {
    setSyncStatus('pending');
    setPendingCount(prev => prev + 1);
    await showNotification(
      '📱 Offline prijava sačuvana',
      'Vaš rad će biti automatski prijavljen kada internet bude ponovo dostupan.',
      'offline-save'
    );
  }, [showNotification]);

  const value = {
    syncStatus,
    startOfflineSync,
    showNotification,
    setSyncStatus
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