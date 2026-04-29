// NotFound.js
import React from 'react';
import './NotFound.css';

const NotFound = () => {

  const goBack = () => {
    window.location = '/'
  };

  return (
    <div className="not-found-container">
      <div className="not-found-content">
        <div className="not-found-animation">
          <div className="error-icon">404</div>
          <div className="floating-elements">
            <div className="floating-element el-1">🎨</div>
            <div className="floating-element el-2">🖌️</div>
            <div className="floating-element el-3">📷</div>
            <div className="floating-element el-4">✏️</div>
          </div>
        </div>
        
        <h1 className="not-found-title">Stranica nije pronađena</h1>
        <p className="not-found-text">
          Izgleda da se stranica koju tražite pomjerila ili ne postoji.
        </p>
        
        <button className="back-button" onClick={goBack}>
          <span className="button-icon">🏠</span>
          Vrati se na početnu
        </button>
      </div>
    </div>
  );
};

export default NotFound;