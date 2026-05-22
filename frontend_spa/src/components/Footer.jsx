import React from 'react'
import './Footer.css';
import Button from './Button'
import { Link } from 'react-router-dom';

function Footer() {
  return (
    <div className='footer-container'>
      <section className='footer-subscription'>
        <div className='subscription-content'>
          <div className='footer-logo'>
            <span className='logo-icon'>🎨</span>
            <span className='logo-text'>ArtConnection</span>
          </div>
          <p className='footer-subscription-heading'>
            Pridružite se našoj kreativnoj zajednici
          </p>
          <p className='footer-subscription-text'>
            Otkrijte nevjerovatne umjetnike, učestvujte u takmičenjima i budite dio inspirativne zajednice
          </p>
          <div className='input-areas'>
            <form>
              <Button buttonStyle='btn--gradient'>
                <span className='btn-icon'>✨</span>
                Registruj se sada
              </Button>
            </form>
          </div>
        </div>
      </section>

      <div className='footer-main'>
        <div className='footer-content'>
          <div className='footer-section'>
            <h3 className='footer-title'>Kontaktirajte nas</h3>
            <div className='contact-info'>
              <div className='contact-item'>
                <div className='contact-icon'>
                  <i className='fas fa-map-marker-alt'/>
                </div>
                <div className='contact-text'>
                  <span className='contact-label'>Lokacija</span>
                  <span className='contact-value'>Podgorica, Crna Gora</span>
                </div>
              </div>
              <div className='contact-item'>
                <div className='contact-icon'>
                  <i className='fas fa-phone'/>
                </div>
                <div className='contact-text'>
                  <span className='contact-label'>Telefon</span>
                  <span className='contact-value'>+382 68 236 415</span>
                </div>
              </div>
              <div className='contact-item'>
                <div className='contact-icon'>
                  <i className='far fa-envelope-open'/>
                </div>
                <div className='contact-text'>
                  <span className='contact-label'>Email</span>
                  <span className='contact-value'>ArtConnection@gmail.com</span>
                </div>
              </div>
            </div>
          </div>

          <div className='footer-section'>
            <h3 className='footer-title'>Brzi Linkovi</h3>
            <div className='footer-links-grid'>
              <Link to='/' className='footer-link'>
                <span className='link-icon'>🏠</span>
                Početna
              </Link>
              <Link to='/login' className='footer-link'>
                <span className='link-icon'>👤</span>
                Registracija
              </Link>
              <Link to='/competitions' className='footer-link'>
                <span className='link-icon'>🏆</span>
                Takmičenja
              </Link>
              <Link to='/' className='footer-link'>
                <span className='link-icon'>🖼️</span>
                Galerija
              </Link>
            </div>
          </div>

          <div className='footer-section'>
            <h3 className='footer-title'>Pratite nas</h3>
            <div className='social-links'>
              <Link
                className='social-link instagram'
                to='/'
                target='_blank'
                aria-label='Instagram'
              >
                <div className='social-icon'>
                  <i className='fab fa-instagram' />
                </div>
                <span className='social-text'>Instagram</span>
              </Link>
              <Link
                className='social-link facebook'
                to='/'
                target='_blank'
                aria-label='Facebook'
              >
                <div className='social-icon'>
                  <i className='fab fa-facebook-f' />
                </div>
                <span className='social-text'>Facebook</span>
              </Link>
              <Link
                className='social-link twitter'
                to='/'
                target='_blank'
                aria-label='Twitter'
              >
                <div className='social-icon'>
                  <i className='fab fa-twitter' />
                </div>
                <span className='social-text'>Twitter</span>
              </Link>
              <Link
                className='social-link youtube'
                to='/'
                target='_blank'
                aria-label='YouTube'
              >
                <div className='social-icon'>
                  <i className='fab fa-youtube' />
                </div>
                <span className='social-text'>YouTube</span>
              </Link>
            </div>
          </div>

          <div className='footer-section'>
            <h3 className='footer-title'>Newsletter</h3>
            <p className='newsletter-text'>Budite u toku sa najnovijim takmičenjima i događajima</p>
            <div className='newsletter-form'>
              <input 
                type='email' 
                placeholder='Unesite vaš email' 
                className='newsletter-input'
              />
              <button type='submit' className='newsletter-btn' aria-label="Prijavi se na newsletter">
                <i className='fas fa-paper-plane' />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className='footer-bottom'>
        <div className='footer-bottom-content'>
          <div className='footer-copyright'>
            <span className='copyright-icon'>©</span>
            <span className='copyright-text'>2024 ArtConnection. Sva prava zadržana.</span>
          </div>
          <div className='footer-legal'>
            <Link to='/privacy' className='legal-link'>Privatnost</Link>
            <Link to='/terms' className='legal-link'>Uslovi</Link>
            <Link to='/cookies' className='legal-link'>Cookies</Link>
          </div>
        </div>
      </div>

      <div className='footer-decoration'>
        <div className='decoration-circle circle-1'></div>
        <div className='decoration-circle circle-2'></div>
        <div className='decoration-circle circle-3'></div>
      </div>
    </div>
  );
}

export default Footer