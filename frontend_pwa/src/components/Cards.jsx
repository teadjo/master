import React, { useEffect, useState } from 'react'
import './Cards.css'
import Picture from './Picture'
import axios from 'axios';
import Pagination from './Pagination';
import { useNavigate } from 'react-router-dom';
import { normalizeArray } from '../utils/normalize'
import {api} from '../utils/api'

function Cards() {
  const [art, setArt] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [imagesPerPage] = useState(8);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const API = import.meta.env.VITE_API_URL


  useEffect(() => {
    const fetchComp = async () => {
      try {
        setLoading(true);
        const response = await api.get(`${API}/artworks/`);
        setArt(response.data); 
        console.log(response.data);
        const usersData = await api.get(`${API}/type/1`);
        console.log("DATA TYPE:", typeof usersData, usersData)
        setUsers(normalizeArray(usersData.data).splice(0,20));
        console.log(usersData.data);
      } catch (error) {
        console.error('Greška u dobavljanju podataka:', error);
      } finally {
        setLoading(false);
      }
    };
   fetchComp();
  },[]);

  const handleClick = () => {
    navigate('/login'); // Navigates to the /new-page route within your app
  };

  const indexOfLast = currentPage * imagesPerPage;
  const indexOfFirst = indexOfLast - imagesPerPage;
  const currentImages = art.slice(indexOfFirst, indexOfLast);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className='cards_comp'>
      {/* Hero Section */}
      <div className='hero-section'>
        <div className='hero-content'>
          <p className='hero-subtitle'>Otkrijte nevjerovatne umjetničke radove i talentovane umjetnike iz cijelog svijeta</p>
          <div className='hero-stats'>
            <div className='stat-item'>
              <span className='stat-number'>{art.length}+</span>
              <span className='stat-label'>Umjetničkih Djela</span>
            </div>
            <div className='stat-item'>
              <span className='stat-number'>{users.length}+</span>
              <span className='stat-label'>Umjetnika</span>
            </div>
            <div className='stat-item'>
              <span className='stat-number'>100+</span>
              <span className='stat-label'>Takmičenja</span>
            </div>
          </div>
        </div>
      </div>

      {/* Umjetnička Djela Sekcija */}
      <section className='art-section'>
        <div className='section-header'>
          <div className='title-wrapper'>
            <span className='section-icon'>🎨</span>
            <h2>Istražite Svijet Umjetnosti</h2>
          </div>
          <p className='section-description'>Pogledajte najnovija i najpopularnija umjetnička djela naše zajednice</p>
        </div>
        
        {loading ? (
          <div className='loading-grid'>
            {[...Array(8)].map((_, index) => (
              <div key={index} className='card-skeleton'>
                <div className='skeleton-image'></div>
                <div className='skeleton-content'>
                  <div className='skeleton-line short'></div>
                  <div className='skeleton-line medium'></div>
                  <div className='skeleton-line long'></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className='cards_container'>
              <div className='cards_wrapper'>
                <ul className='cards_items artists-grid'>
                {Array.isArray(currentImages) ? (currentImages.map((art) => {
                  return (
                    <div key={art.id} className='individualPicture-start artist-card'>
                      <Picture 
                        src={art.slika ? `${art.slika}` : './back.jpg'}
                        label={art.naziv_kategorije}
                        text={art.opis_djela}
                        title={art.naziv}  
                        link={`/artwork/${art.id}/profile/`}
                      /> 
                    </div>
                  )
                })):(<p>Nema podataka</p>)}
                </ul>
                <Pagination
                  imagesPerPage={imagesPerPage}
                  totalImages={art.length}
                  paginate={paginate}
                  currentPage={currentPage}
                />
              </div>
            </div>
          </>
        )}
      </section>

      {/* Umjetnici Sekcija */}
      <section className='artists-section'>
        <div className='section-header'>
          <div className='title-wrapper'>
            <span className='section-icon'>👨‍🎨</span>
            <h2>Otkrijte Izvanredne Nove Umjetnike</h2>
          </div>
          <p className='section-description'>Upoznajte talentovane umjetnike koji obogaćuju našu zajednicu</p>
        </div>
        
        {loading ? (
          <div className='loading-grid'>
            {[...Array(4)].map((_, index) => (
              <div key={index} className='card-skeleton'>
                <div className='skeleton-image'></div>
                <div className='skeleton-content'>
                  <div className='skeleton-line short'></div>
                  <div className='skeleton-line medium'></div>
                  <div className='skeleton-line long'></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className='cards_container'>
            <div className='cards_wrapper'>
              <ul className='cards_items artists-grid'>
              {Array.isArray(users) ? (users.map((art) => (
                <div key={art.id} className='individualPicture-start artist-card'>
                  <Picture 
                    src={art.profilna_slika ? `${art.profilna_slika}` : './../back.jpg'}
                    label1={art.korisnicko_ime}
                    text={art.opis_kor}
                    title={[art.ime_kor, " ", art.prezime]}  
                    link={`/${art.id_kor}/myProfile/`}
                  /> 
                </div>
              ))):(<p>Nema podataka</p>)}
              </ul>
            </div>
          </div>
        )}
      </section>

      {/* CTA Section */}
      <div className='cta-section'>
        <div className='cta-content'>
          <h3>Spremni da se pridružite našoj zajednici?</h3>
          <p>Pridružite se hiljadama umjetnika i ljubitelja umjetnosti koji već dijele svoju kreativnost</p>
          <div className='cta-buttons'>
            <button onClick={handleClick} className='cta-btn primary'>Registruj se sada</button>
            <button className='cta-btn secondary'>Saznaj više</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Cards