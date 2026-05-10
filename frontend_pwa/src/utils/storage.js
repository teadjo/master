export async function checkStorageQuota() {
  if (!navigator.storage || !navigator.storage.estimate) {
    console.log('❌ Storage API nije podržan');
    return null;
  }
  
  try {
    const estimate = await navigator.storage.estimate();
    
    return {
      usage: (estimate.usage / 1024 / 1024).toFixed(2) + ' MB',
      quota: (estimate.quota / 1024 / 1024).toFixed(2) + ' MB',
      percentage: ((estimate.usage / estimate.quota) * 100).toFixed(1) + '%',
      persisted: await navigator.storage.persisted()
    };
  } catch (error) {
    console.error('❌ Storage estimate greška:', error);
    return null;
  }
}

export async function requestPersistentStorage() {
  if (!navigator.storage || !navigator.storage.persist) {
    return false;
  }
  
  const isPersisted = await navigator.storage.persist();
  console.log(`💾 Persistent storage: ${isPersisted ? 'YES' : 'NO'}`);
  return isPersisted;
}