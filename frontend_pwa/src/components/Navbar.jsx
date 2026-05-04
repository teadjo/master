import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import './Navbar.css'
import Button from './Button'
import axios from 'axios';
import { normalizeArray } from '../utils/normalize'

function Navbar() {
  const [click, setClick] = useState(false);
  const [button, setButton] = useState(true);
  const [category, setCategory] = useState([]);
  const [isScrolled, setIsScrolled] = useState(false);
  const API = import.meta.env.VITE_API_URL

  const handleClick = () => setClick(!click);
  const closeMobileMenu = () => setClick(false);

  const showButton = () => {
    if (window.innerWidth <= 960) {
      setButton(false);
    } else {
      setButton(true);
    }
  };

  function LogOut(e){
    e.preventDefault();
    closeMobileMenu();
    window.location = `/`
    localStorage.setItem("notlogedIn", 'true');    
    localStorage.setItem("isAdmin", 'false');                         
    localStorage.setItem("isArtist", 'false');                         
    localStorage.setItem("isVisitor", 'false');  
    localStorage.setItem("userID", null)
  }

  useEffect(() => {
    showButton();
    if(localStorage.getItem('notlogedIn') == null) localStorage.setItem('notlogedIn', 'true')
    
    const fetchCategory = async () => {
      try{
        const getCategory = await api.get(`${API}/category/`);
        console.log("DATA TYPE:", typeof getCategory, getCategory)
        setCategory(normalizeArray(getCategory.data));
      } catch (error) {
        console.log("error", error)
      }
    }
    fetchCategory();

    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  window.addEventListener('resize', showButton);
  
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
            {(localStorage.getItem('isAdmin') === 'false' || localStorage.getItem('isAdmin') == null) && 
              <li className='nav-item'>
                <div className='dropdown'>
                  <button className='dropbtn'>
                    Radovi
                    <svg className='dropdown-arrow' width="12" height="12" viewBox="0 0 24 24" fill="none">
                      <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  <div className="dropdown-content">
                    {Array.isArray(category) ? (category.map((category, index) => (
                      <Link 
                        key={index}
                        className='dropdown-link' 
                        onClick={closeMobileMenu} 
                        to={`/artworks/category/${category.naziv}`}
                      >
                        {category.naziv}
                      </Link>
                    ))):(<p>Nema podataka</p>)}
                  </div>
                </div>
              </li>
            }
            
            <li className='nav-item'>
              <Link
                to='/competitions'
                className='nav-links'
                onClick={closeMobileMenu}
              >
                Takmičenja
              </Link>
            </li>
          
            {localStorage.getItem("isAdmin") === 'true' && (
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
            
            {localStorage.getItem("notlogedIn") === 'false' && (
              <li className='nav-item'>
                <Link
                  to={`/${localStorage.getItem('userID')}/myProfile`} 
                  className='nav-links profile-link'
                  onClick={closeMobileMenu}
                >
                  <span className='profile-icon'>👤</span>
                  Moj Profil
                </Link>
              </li>
            )}
            
            <li className='nav-item mobile-only'>
              {localStorage.getItem('notlogedIn') === 'false' && (
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
              {localStorage.getItem('notlogedIn') === 'true' && (
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
            {button && localStorage.getItem('notlogedIn') === 'true' && (
              <Button buttonStyle='btn--primary' to='/login'>
                Prijava
              </Button>
            )} 
            {button && localStorage.getItem('notlogedIn') === 'false' && (
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