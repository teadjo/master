import { useState, useEffect } from 'react';

export function useNetworkStatus() {
  const [networkInfo, setNetworkInfo] = useState({
    online: navigator.onLine,
    effectiveType: 'unknown',
    downlink: null,
    rtt: null,
    saveData: false
  });
  
  useEffect(() => {
    const updateNetworkInfo = () => {
      const connection = navigator.connection || 
                        navigator.mozConnection || 
                        navigator.webkitConnection;
      
      setNetworkInfo({
        online: navigator.onLine,
        effectiveType: connection?.effectiveType || 'unknown',
        downlink: connection?.downlink || null,
        rtt: connection?.rtt || null,
        saveData: connection?.saveData || false
      });
    };
    
    window.addEventListener('online', updateNetworkInfo);
    window.addEventListener('offline', updateNetworkInfo);
    
    if (navigator.connection) {
      navigator.connection.addEventListener('change', updateNetworkInfo);
    }
    
    updateNetworkInfo();
    
    return () => {
      window.removeEventListener('online', updateNetworkInfo);
      window.removeEventListener('offline', updateNetworkInfo);
      if (navigator.connection) {
        navigator.connection.removeEventListener('change', updateNetworkInfo);
      }
    };
  }, []);
  
  return networkInfo;
}