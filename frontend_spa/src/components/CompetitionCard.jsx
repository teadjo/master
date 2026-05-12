import React from 'react'
import './CompetitionCard.css'
import { useNavigate } from 'react-router-dom'
import {api} from '../utils/api'

function CompetitionCard(props) {
  const navigate = useNavigate()
  const API = import.meta.env.VITE_API_URL

  const handleCardClick = () => {
    navigate(`/competition/${props.value.id}`)
  }

  const getCompetitionStatus = () => {
    const now = new Date()
    const startDate = new Date(props.value.datum_poc)
    const endDate = new Date(props.value.datum_kraja)
    
    if (now < startDate) {
      const daysUntilStart = Math.ceil((startDate - now) / (1000 * 60 * 60 * 24))
      return {
        status: 'uskoro',
        text: `Počinje za ${daysUntilStart} d`,
        badgeText: 'USKORO'
      }
    } else if (now >= startDate && now <= endDate) {
      const daysLeft = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24))
      return {
        status: 'aktivno',
        text: `${daysLeft} d preostalo`,
        badgeText: 'AKTIVNO'
      }
    } else {
      return {
        status: 'završeno',
        text: 'Završeno',
        badgeText: 'ZAVRŠENO'
      }
    }
  }

  const competitionStatus = getCompetitionStatus()

  return (
    <div 
      className="competition-card" 
      data-status={competitionStatus.status}
      onClick={handleCardClick}
    >
      {/* Image */}
      <div className="card-image-container">
        <img 
          loading="lazy"
          className="card-image"
          src={props.value.slika 
            ? `${API}${props.value.slika}` 
            : 'https://images.unsplash.com/photo-1541943869728-4bd4f450c8f5?w=400&h=260&fit=crop'
          } 
          alt={props.value.naziv_takmicenja}
        />
        
        {/* Status Badge - top right
        <div className="competition-header">
          <div className="status-badge">
            {competitionStatus.badgeText}
          </div>
        </div>
         */}
        {/* Time left - bottom left */}
        <div className="competition-overlay">
          <div className="time-info">
            <span>⏳</span>
            <span>{competitionStatus.text}</span>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="card-content">
        <div className="competition-meta">
          <span className="competition-category">
            {props.value.naziv_kategorije_t || "TAKMIČENJE"}
          </span>
          <span className="competition-dates">
            {new Date(props.value.datum_poc).toLocaleDateString('sr-RS')}
          </span>
        </div>
        
        <h3 className="competition-title">
          {props.value.naziv_takmicenja}
        </h3>
        
        <p className="competition-description">
          {props.value.opis 
            ? props.value.opis.slice(0, 85) + (props.value.opis.length > 85 ? '...' : '')
            : "Prijavite se i osvojite nagrade!"
          }
        </p>
        
        <div className="competition-prizes">
          <div className="prize-item">🥇</div>
          <div className="prize-item">🥈</div>
          <div className="prize-item">🥉</div>
        </div>
        
        <div className="card-footer">
          <button 
            className="cta-button"
            onClick={(e) => {
              e.stopPropagation()
              handleCardClick()
            }}
          >
            <span className="button-icon">
              {competitionStatus.status === 'aktivno' && '⚡'}
              {competitionStatus.status === 'uskoro' && '🔔'}
              {competitionStatus.status === 'završeno' && '🏆'}
            </span>
            {competitionStatus.status === 'aktivno' ? 'Prijava' : 
             competitionStatus.status === 'uskoro' ? 'Obavijesti' : 'Rezultati'}
            <svg className="arrow-icon" viewBox="0 0 24 24" fill="none">
              <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default CompetitionCard