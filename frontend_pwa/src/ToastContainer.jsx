// ToastContainer.jsx
import React from 'react';
import './Toast.css';

function ToastContainer({ children }) {
    return (
        <div className="toast-container">
            {children}
        </div>
    );
}

export default ToastContainer;