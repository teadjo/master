import React from 'react'
import './HomeComp.css'
import { useNavigate } from 'react-router-dom';

function HomeComp() {

  const navigate = useNavigate();


  const handleClick = () => {
    navigate('/login'); // Navigates to the /new-page route within your app
  };

  const handleClick1 = () => {
    navigate('#hero-actions'); // Navigates to the /new-page route within your app
  };
  return (
    <div className='hero-container'>
      {/* Background Overlay */}
      <div className='hero-background'>
        <div className='background-overlay'></div>
        <div className='floating-shapes'>
          <div className='shape shape-1'></div>
          <div className='shape shape-2'></div>
          <div className='shape shape-3'></div>
          <div className='shape shape-4'></div>
        </div>
      </div>
      
      {/* Main Content */}
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