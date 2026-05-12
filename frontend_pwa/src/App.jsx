import React from 'react';
import './App.css';
import Navbar from './components/Navbar';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import { lazy, Suspense } from 'react';
const Home = lazy(() => import('./pages/Home'));
import Footer from './components/Footer';
const CompetitionTab = lazy(() => import ('./components/Competitions/CompetitionTab'));
import MyProfile from './components/MyProfileComponent/MyProfile';
import ArtworksByCategory from './components/ArtworksByCategory/ArtworksByCategory';
import AddCompetition from './components/Competitions/AddCompetitionForm/AddCompetition';
import Apply from './components/ApplyToContest/Apply';
import ViewArtwork from './components/ViewArtwork/ViewArtwork';
import ViewForVoting from './components/ViewArtwork/ViewForVoting';
import AddCategory from './components/AddCategory/AddCategory';
import NotFound from './components/NotFound';
import AllUsers from './components/AllUsers';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { useEffect, useState } from 'react';
import ScrollToTop from './ScrollToTop';
import { SyncNotificationProvider } from './contexts/SyncNotificationContext';
import SyncStatus from './components/SyncStatus';
import InstallPrompt from './components/InstallPrompt';
import { checkStorageQuota, requestPersistentStorage } from './utils/storage';
import { useNetworkStatus } from './hooks/useNetworkStatus';
import MetricsDashboard from './MetricsDashboard';


function NetworkInfo() {
  const network = useNetworkStatus();
  
  return (
    <div className="network-info" style={{ 
      position: 'fixed', 
      bottom: '10px', 
      left: '10px', 
      background: 'rgba(0,0,0,0.8)', 
      color: 'white', 
      padding: '8px 12px', 
      borderRadius: '8px',
      fontSize: '12px',
      zIndex: 999 
    }}>
      {network.online ? '🟢' : '🔴'} {network.effectiveType} 
      {network.downlink && ` (${network.downlink}Mbps)`}
    </div>
  );
}

function AppContent() {
  const location = useLocation();
  const hideNavbar = location.pathname === '/login';

  const online = useOnlineStatus(); 

  return (
    <>
      {!online && (
        <div className="offline-banner">
          Nema internet konekcije
        </div>
      )}

      {!hideNavbar && <Navbar />}
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          
          <Route path='/' element={<Home />} />
          <Route path='/login' element={<Login />} />
          <Route path='/competitions' element={<CompetitionTab />} />
          <Route path='/artworks/' element={<CompetitionTab />} />
          <Route path='/:id/myProfile' element={<MyProfile />} />
          <Route path='/artworks/category/:category/' element={<ArtworksByCategory />} />
          <Route path='/addCompetition/' element={<AddCompetition />} />
          <Route path='/competition/:id/' element={<Apply />} />
          <Route path='/competition/:id/:artID/myprofile' element={<ViewForVoting />} />
          <Route path='/artwork/:artID/profile' element={<ViewArtwork />} />
          <Route path='/addCategory/' element={<AddCategory />} />
          <Route path='/users/' element={<AllUsers />} />
          <Route path='/metrics' element={<MetricsDashboard />} />
          <Route path='*' element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
}

function App() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      console.log('Install prompt spreman');
      
    };

    window.addEventListener('beforeinstallprompt', handler);
    async function initStorage() {
      const quota = await checkStorageQuota();
      console.log('💾 Storage info:', quota);
      
      // Zatraži persistent storage (važno za PWA!)
      const persisted = await requestPersistentStorage();
      console.log('💾 Persistent storage:', persisted);
    }
    initStorage();

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    console.log('User choice:', outcome);

    setDeferredPrompt(null);
  };

  return (
    <Router>
      <SyncNotificationProvider>
        {/* {deferredPrompt && (
          <button onClick={installApp} className="install-btn">
            Instaliraj aplikaciju
          </button>
        )} */}
        <ScrollToTop />
        <AppContent />
        <SyncStatus />
        <InstallPrompt />
      </SyncNotificationProvider>
    </Router>
  );
}

export default App;