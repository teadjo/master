import React from 'react';
import './App.css';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import { lazy, Suspense, useEffect, useState } from 'react';

// LAZY UČITAVANJE - sve osim osnovnih komponenti
const Navbar = lazy(() => import('./components/Navbar'));
const Login = lazy(() => import('./pages/Login'));
const Home = lazy(() => import('./pages/Home'));
const Footer = lazy(() => import('./components/Footer'));
const CompetitionTab = lazy(() => import('./components/Competitions/CompetitionTab'));
const MyProfile = lazy(() => import('./components/MyProfileComponent/MyProfile'));
const ArtworksByCategory = lazy(() => import('./components/ArtworksByCategory/ArtworksByCategory'));
const AddCompetition = lazy(() => import('./components/Competitions/AddCompetitionForm/AddCompetition'));
const Apply = lazy(() => import('./components/ApplyToContest/Apply'));
const ViewArtwork = lazy(() => import('./components/ViewArtwork/ViewArtwork'));
const ViewForVoting = lazy(() => import('./components/ViewArtwork/ViewForVoting'));
const AddCategory = lazy(() => import('./components/AddCategory/AddCategory'));
const NotFound = lazy(() => import('./components/NotFound'));
const AllUsers = lazy(() => import('./components/AllUsers'));
const SyncStatus = lazy(() => import('./components/SyncStatus'));
const InstallPrompt = lazy(() => import('./components/InstallPrompt'));
const MetricsDashboard = lazy(() => import('./MetricsDashboard'));

// HOOKOVI (ne mogu biti lazy, moraju biti normalno uvezeni)
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { SyncNotificationProvider } from './contexts/SyncNotificationContext';
import { checkStorageQuota, requestPersistentStorage } from './utils/storage';
import { useNetworkStatus } from './hooks/useNetworkStatus';
import ScrollToTop from './ScrollToTop';

// OSTALO
import { checkStorageQuota, requestPersistentStorage } from './utils/storage';


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