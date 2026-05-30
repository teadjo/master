export const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export const subscribeToPush = async (userId) => {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY)
    });
    
    // Pošalji subscription na backend
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription, userId })
    });
    
    if (response.ok) {
      console.log('✅ Uspješno prijavljen na push notifikacije');
      return true;
    }
  } catch (error) {
    console.error('❌ Greška pri prijavi na push:', error);
    return false;
  }
};
