import React from 'react'
import './HomeComp.css'
import { useNavigate } from 'react-router-dom';
import heroImage from '../../public/hero.jpg';

function HomeComp() {

  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/login');
  };

  const handleClick1 = () => {
    navigate('#hero-actions');
  };

  return (
    <div className='hero-container'>
      {/* Background Image */}
      <div className='hero-background'>
        <img 
          src={heroImage} 
          alt="Art hero background" 
          className='hero-image'
          fetchpriority="high"
          loading="eager"
        />
        {/* DODAJ OVO - tamni gradijent preko slike (vraća originalni izgled) */}
        <div className='hero-gradient-overlay'></div>
        {/* Ovo je ljubičasti accent overlay (isti kao prije) */}
        <div className='background-overlay'></div>
       
      </div>
      
      {/* Ostali sadržaj ostaje isti */}
      <div className='hero-content1'>
        <div className='hero-badge'>
          <span className='badge-icon'>🎨</span>
          <span>ArtConnection Platform</span>
        </div>
        
        <h1 className='hero-title1'>
          <span className='title-line'>Pridružite se</span>
          <span className='title-line accent'>Umjetničkom Pokretu</span>
        </h1>
        
        <div className='hero-features'>
          <div className='feature-item'>
            <span className='feature-icon'>✨</span>
            <span>Stvarajte i dijelite umjetnost</span>
          </div>
          <div className='feature-item'>
            <span className='feature-icon'>🏆</span>
            <span>Učestvujte u takmičenjima</span>
          </div>
          <div className='feature-item'>
            <span className='feature-icon'>🌍</span>
            <span>Povežite se sa umjetnicima</span>
          </div>
        </div>
        
        <div className='hero-actions'>
          <button onClick={handleClick} className='cta-button primary'>
            <span className='btn-icon'>🚀</span>
            Započni Putovanje
          </button>
          <button onClick={handleClick1} className='cta-button secondary'>
            <span className='btn-icon'>🖼️</span>
            Istraži Galeriju
          </button>
        </div>
      </div>
    </div>
  );
}

export default HomeComp;