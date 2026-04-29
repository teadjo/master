import React from 'react';
import './App.css';
import Navbar from './components/Navbar';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import Home from './pages/Home';
import Footer from './components/Footer';
import CompetitionTab from './components/Competitions/CompetitionTab';
import MyProfile from './components/MyProfileComponent/MyProfile';
import ArtworksByCategory from './components/ArtworksByCategory/ArtworksByCategory';
import AddCompetition from './components/Competitions/AddCompetitionForm/AddCompetition';
import Apply from './components/ApplyToContest/Apply';
import ViewArtwork from './components/ViewArtwork/ViewArtwork';
import ViewForVoting from './components/ViewArtwork/ViewForVoting';
import AddCategory from './components/AddCategory/AddCategory';
import NotFound from './components/NotFound';
import AllUsers from './components/AllUsers';

// Komponenta koja odlučuje da li prikazati Navbar
function AppContent() {
  const location = useLocation();
  const hideNavbar = location.pathname === '/login';
  
  return (
    <>
      {!hideNavbar && <Navbar />}
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
    </>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;