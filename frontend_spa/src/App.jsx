import React from 'react';
import './App.css';
const Navbar = lazy(() => import('./components/Navbar'));
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
const Login = lazy(() => import('./pages/Login'));
import { lazy, Suspense } from 'react';
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
import { useEffect, useState } from 'react';
import ScrollToTop from './ScrollToTop';

// Komponenta koja odlučuje da li prikazati Navbar
function AppContent() {
  const location = useLocation();
  const hideNavbar = location.pathname === '/login';


  return (
    <>

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
          <Route path='*' element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
}

function App() {



  return (
    <Router>
      <ScrollToTop />
      <AppContent />
    </Router>
  );
}

export default App;