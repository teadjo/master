import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';
import Button from './Button';
import { normalizeArray } from '../utils/normalize';
import { api } from '../utils/api';

function Navbar() {
  const [click, setClick] = useState(false);
  const [button, setButton] = useState(true);
  const [category, setCategory] = useState([]);
  const [isScrolled, setIsScrolled] = useState(false);
  const API = import.meta.env.VITE_API_URL;

  const handleClick = () => setClick(!click);
  const closeMobileMenu = () => setClick(false);

  const showButton = useCallback(() => {
    const isMobile = window.matchMedia('(max-width: 960px)').matches;
    setButton(!isMobile);
  }, []);

  const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  function LogOut(e) {
    e.preventDefault();
    closeMobileMenu();
    window.location = `/`;
    localStorage.setItem("notlogedIn", 'true');
    localStorage.setItem("isAdmin", 'false');
    localStorage.setItem("isArtist", 'false');
    localStorage.setItem("isVisitor", 'false');
    localStorage.setItem("userID", null);
  }

  useEffect(() => {
    showButton();
    
    if (sessionStorage.getItem('notlogedIn') === null) {
      sessionStorage.setItem('notlogedIn', 'true');
    }
    
    const fetchCategory = async () => {
      try {
        const getCategory = await api.get(`${API}/category/`);
        setCategory(normalizeArray(getCategory.data));
      } catch (error) {
        console.log("error", error);
      }
    };
    fetchCategory();

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    const debouncedResize = debounce(showButton, 150);
    window.addEventListener('resize', debouncedResize);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', debouncedResize);
    };
  }, [showButton]); 
  const isLoggedIn = localStorage.getItem('notlogedIn') === 'false';
  const isAdmin = localStorage.getItem('isAdmin') === 'true';
  const userId = localStorage.getItem('userID');

  return (
    <>
      <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
        <div className='navbar-container'>
          <Link to='/' className='navbar-logo' onClick={closeMobileMenu}>
            <span className='logo-icon'>🎨</span>
            ArtConnection
          </Link>
          
          <div className='menu-icon' onClick={handleClick}>
            <div className={click ? 'hamburger active' : 'hamburger'}>
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
          
          <ul className={click ? 'nav-menu active' : 'nav-menu'}>
            {(!isAdmin || localStorage.getItem('isAdmin') === null) && (
              <li className='nav-item'>
                <div className='dropdown'>
                  <button className='dropbtn'>
                    Radovi
                    <svg className='dropdown-arrow' width="12" height="12" viewBox="0 0 24 24" fill="none">
                      <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  <div className="dropdown-content">
                    {Array.isArray(category) && category.map((cat, index) => (
                      <Link 
                        key={index}
                        className='dropdown-link' 
                        onClick={closeMobileMenu} 
                        to={`/artworks/category/${cat.naziv}`}
                      >
                        {cat.naziv}
                      </Link>
                    ))}
                  </div>
                </div>
              </li>
            )}
            
            <li className='nav-item'>
              <Link
                to='/competitions'
                className='nav-links'
                onClick={closeMobileMenu}
              >
                Takmičenja
              </Link>
            </li>
          
            {isAdmin && (
              <>
                <li className='nav-item'>
                  <Link
                    to={`/addCompetition/`} 
                    className='nav-links'
                    onClick={closeMobileMenu}
                  >
                    Dodaj takmičenje
                  </Link>
                </li>
                <li className='nav-item'>
                  <Link
                    to={`/users/`} 
                    className='nav-links'
                    onClick={closeMobileMenu}
                  >
                    Korisnici
                  </Link>
                </li>
                <li className='nav-item'>
                  <Link
                    to={`/addCategory/`} 
                    className='nav-links'
                    onClick={closeMobileMenu}
                  >
                    Dodaj kategoriju
                  </Link>
                </li>
              </>
            )}
            
            {isLoggedIn && (
              <li className='nav-item'>
                <Link
                  to={`/${userId}/myProfile`} 
                  className='nav-links profile-link'
                  onClick={closeMobileMenu}
                >
                  <span className='profile-icon'>👤</span>
                  Moj Profil
                </Link>
              </li>
            )}
            
            <li className='nav-item mobile-only'>
              {isLoggedIn && (
                <Link
                  to='/'
                  className='nav-links-mobile logout-mobile'
                  onClick={LogOut}
                >
                  Odjava
                </Link>
              )}
            </li>
            
            <li className='nav-item mobile-only'>
              {!isLoggedIn && (
                <Link
                  to='/login'
                  className='nav-links-mobile login-mobile'
                  onClick={closeMobileMenu}
                >
                  Prijava
                </Link>
              )}
            </li>
          </ul>
          
          <div className='navbar-buttons'>
            {button && !isLoggedIn && (
              <Button buttonStyle='btn--primary' to='/login'>
                Prijava
              </Button>
            )} 
            {button && isLoggedIn && (
              <Button onClick={LogOut} buttonStyle='btn--outline'>
                Odjava
              </Button>
            )} 
          </div>
        </div>
      </nav>
    </>
  );
}

export default Navbar;