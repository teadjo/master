import { useState, useEffect } from 'react';
import './InstallPrompt.css';

function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  
  useEffect(() => {
    // Provjeri da li je već instalirano
    if (window.matchMedia('(display-mode: standalone)').matches) {
      console.log('📲 App već instalirana');
      return;
    }
    
    // Provjeri da li je korisnik već odbio (localStorage)
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      const now = Date.now();
      // Prikaži ponovo nakon 3 dana
      if (now - dismissedTime < 3 * 24 * 60 * 60 * 1000) {
        return;
      }
    }
    
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Prikaži sa malim zakašnjenjem (kad se stranica učita)
      setTimeout(() => {
        setShowPrompt(true);
      }, 3000); // 3 sekunde nakon učitavanja
      
      console.log('📲 Install prompt dostupan');
    };
    
    window.addEventListener('beforeinstallprompt', handler);
    
    window.addEventListener('appinstalled', () => {
      console.log('✅ Aplikacija instalirana');
      setShowPrompt(false);
      localStorage.setItem('pwa-installed', 'true');
    });
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);
  
  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    // Animacija prije instalacije
    setShowPrompt(false);
    
    setTimeout(async () => {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      console.log(`👤 Korisnik ${outcome === 'accepted' ? 'instalirao' : 'odbio'} aplikaciju`);
      
      if (outcome === 'dismissed') {
        // Ako odbije, sačuvaj u localStorage
        localStorage.setItem('pwa-install-dismissed', Date.now().toString());
      }
      
      setDeferredPrompt(null);
    }, 300);
  };
  
  const handleDismiss = () => {
    setShowPrompt(false);
    setIsDismissed(true);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    console.log('👋 Install prompt odbijen');
  };
  
  if (!showPrompt || isDismissed) return null;
  
  return (
    <div className="install-prompt-overlay">
      <div className="install-prompt-card">
        {/* Gornji grabber */}
        <div className="prompt-grabber"></div>
        
        {/* Header */}
        <div className="prompt-header">
          <div className="prompt-icon">
            <img src="/icons/192.png" alt="App Icon" />
          </div>
          <div className="prompt-title-group">
            <h3>Instalirajte aplikaciju</h3>
            <p>Brži pristup i offline režim</p>
          </div>
          <button 
            className="prompt-close-btn"
            onClick={handleDismiss}
            aria-label="Zatvori"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        {/* Feature list */}
        <div className="prompt-features">
          <div className="feature-item">
            <span className="feature-icon">🚀</span>
            <span className="feature-text">Brži pristup takmičenjima</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">📱</span>
            <span className="feature-text">Offline pregled radova</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🔔</span>
            <span className="feature-text">Push notifikacije</span>
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="prompt-actions">
          <button 
            className="install-btn"
            onClick={handleInstall}
          >
            <i className="fas fa-download"></i>
            Instaliraj
          </button>
        </div>
        
        {/* Dismiss text */}
        <p className="dismiss-text" onClick={handleDismiss}>
          Možda kasnije
        </p>
      </div>
    </div>
  );
}

export default InstallPrompt;