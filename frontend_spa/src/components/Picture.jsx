import React from 'react'
import { Link } from 'react-router-dom'
import './Picture.css'
import {api} from '../utils/api' 

function Picture(props) {
  const API = import.meta.env.VITE_API_URL


  return (
    // <li className='artwork-card'>
      <Link className='card-link' to={props.link}>
        <div className='card-image-section'>
          <div className='image-wrapper'>
            <img
              loading="lazy"
              className='card-image'
              alt={props.title}
              src={props.src == null ? "./../../back.jpg" : `${API}${props.src}`}
            />
          </div>
          <div className='image-overlay'>
            <div className='overlay-content'>
              <span className='overlay-icon'>🪄</span>
              
            </div>
          </div>
        </div> 
        <div className='card-content'>
          <div className='card-badges'>
            <span className='category-badge'>{props.label}</span>
            {props.label1 && <span className='subcategory-badge'>{props.label1}</span>}
          </div>
          <h3 className='card-title'>{props.title}</h3>
          <p className='card-description'>
            {props.text == null ? "Više informacija o umjetničkom djelu" : props.text.slice(0, 65)}...
          </p>
          <div className='card-footer'>
            <span className='action-link'>
              Detalji 
              <svg className='arrow-icon' width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          </div>
        </div>
      </Link> 
    // </li>
  )
}

export default Picture