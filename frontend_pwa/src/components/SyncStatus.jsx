import { useSyncNotification } from '../contexts/SyncNotificationContext';
import './SyncStatus.css';

function SyncStatus() {
  const { syncStatus, pendingCount, lastSyncTime } = useSyncNotification();
  console.log("statis", pendingCount)
  
  if (syncStatus === 'idle' && !lastSyncTime) return null;
  
  return (
    <div className={`sync-status sync-status--${syncStatus}`}>
      {syncStatus === 'pending' && (
        <div className="sync-status__pending">
          <i className="fas fa-sync-alt fa-spin"></i>
          <span>{pendingCount} {pendingCount === 1 ? 'zahtjev čeka' : 'zahtjeva čeka'} sinhronizaciju</span>
        </div>
      )}
      
      {syncStatus === 'syncing' && (
        <div className="sync-status__syncing">
          <i className="fas fa-cloud-upload-alt"></i>
          <span>Sinhronizacija u toku...</span>
        </div>
      )}
      
      {syncStatus === 'complete' && (
        <div className="sync-status__complete">
          <i className="fas fa-check-circle"></i>
          <span>Sinhronizacija završena!</span>
        </div>
      )}
    </div>
  );
}

export default SyncStatus;