import React, {lazy, useState, useEffect} from 'react';
import { useParams} from 'react-router-dom'
import './MyProfile.css'
const Footer = lazy(() => import('../Footer'));
import Picture from '../Picture';
import AddPainting from './AddPainting';
import CompetitonCard from '../CompetitionCard'
import Pagination from '../Pagination';
import { normalizeArray } from '../../utils/normalize'
import {api} from '../../utils/api'
import Toast from '../../Toast'
import { useToast } from '../../ToastContext';
import { useSyncNotification } from '../../contexts/SyncNotificationContext';

function MyProfile() {
  const [user, setUser] = useState({});
  const {id}= useParams();
  const [form, setForm] = useState(false);
  const [art, setArt] = useState([]);
  const [visible, setVisible] = useState(false);
  const [artComp, setArtComp] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [imagesPerPage] = useState(16);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', type: 'error' });
  const [userState, setUserState] = useState({
    id: id,
    ime:'',
    prezime:'',
    mail:'',
    br_tel:'',
    korisnicko_ime:'',
    tip:'',
    opis:''
  });

  const isCurrentUser = localStorage.getItem('userID') === id;
  const isArtist = localStorage.getItem('isArtist') === 'true';
  const isAdmin = localStorage.getItem('isAdmin') === 'true';
  const API = import.meta.env.VITE_API_URL

  const { showToast } = useToast();
  const { startOfflineSync } = useSyncNotification();

  const closeToast = () => {
    setToast({ show: false, message: '', type: 'error' });
  };

  useEffect(() => {
    const fetchData = async () => {
      try{
        setLoading(true);
        const [userResponse, artworks, artCon] = await Promise.all([
          api.get(`${API}/user/${id}`),
          api.get(`${API}/artworks/artist/${id}`),
          api.get(`${API}/artworks/inn/${id}`)
        ]);
        
        const userData = userResponse.data[0];
        setUser(userData);
        setUserState({
          id: id,
          ime: userData.ime_kor || '',
          prezime: userData.prezime || '',
          mail: userData.mail || '',
          br_tel: userData.br_tel || '',
          korisnicko_ime: userData.korisnicko_ime || '',
          tip: userData.tip || '',
          opis: userData.opis_kor || ''
        });
        setArt(normalizeArray(artworks.data));
        setArtComp(normalizeArray(artCon.data));
        
      } catch(error){
        console.error('Greška pri dobavljanju podataka:', error);
        showToast('Greška pri učitavanju profila!', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const showForm = () => {
    setForm(!form);
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserState(prev => ({ ...prev, [name]: value }));
  }

const onClickSave = async (e) => {
    e.preventDefault();
    
    try {
        const response = await api.put(`${API}/user/${id}`, userState);
        if (response.status === 200) {
            showToast("Profil je uspešno izmenjen!", "success");
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        }
    } catch (error) {
        console.error('Greška pri izmjeni:', error);
        if (!navigator.onLine || error.message?.includes('Network Error')) {
            showToast(
                'Vaše izmjene će biti sačuvane kada budete ponovo online! 📱',
                'info'
            );
            
           
            // Pokreni offline sync
            startOfflineSync('profile', window.location.pathname);
            setForm(false);
        } else {
            showToast("Greška pri izmjeni profila!", "error");
        }
    }
};
  const onClickAdd = () => {
    window.location.hash = "";
    setVisible(!visible);
  }

  const indexOfLast = currentPage * imagesPerPage;
  const indexOfFirst = indexOfLast - imagesPerPage;
  const currentImages = art.slice(indexOfFirst, indexOfLast);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) {
    return (
      <>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Učitavanje profila...</p>
        </div>
        {toast.show && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
      </>
    );
  }

  return (
    <>        
      <div className='profile-container'>
        <div className='profile-header'>
          <div className='header-bg'></div>
          <div className='header-content'>
            <div className='profile-avatar'>
              <div className='avatar-image'>
                {user.profilna_slika ? 
                  (<img loading="lazy" crossOrigin="anonymous" src={`${API}${user.profilna_slika}`} alt="Profilna" />) :
                  (<img loading="lazy" src='./../../back.jpg' alt="Default" />)
                }
              </div>
              {isCurrentUser && (
                <button className='avatar-edit'>
                  <span>📷</span>
                </button>
              )}
            </div>
            
            <div className='profile-details'>
              <h1>{user.ime_kor} {user.prezime}</h1>
              <div className='details-row'>
                <span className='detail-item'>
                  <span className='detail-icon'>📧</span>
                  {user.mail}
                </span>
                {user.br_tel && (
                  <span className='detail-item'>
                    <span className='detail-icon'>📞</span>
                    {user.br_tel}
                  </span>
                )}
              </div>
              <div className='role-tag'>
                <span>{isAdmin ? '👑' : isArtist ? '🎨' : '👤'}</span>
                <span>{isAdmin ? 'Administrator' : isArtist ? 'Umjetnik' : 'Posjetilac'}</span>
              </div>
            </div>

            {isCurrentUser && (
              <div className='profile-actions-header'>
                <button onClick={showForm} className='header-btn edit-header-btn'>
                  <span>✏️</span>
                  {form ? 'Zatvori' : 'Uredi profil'}
                </button>
                {isArtist && (
                  <button onClick={onClickAdd} className='header-btn add-header-btn'>
                    <span>+</span>
                    Dodaj djelo
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className='profile-main'>
          <div className='bio-wrapper'>
            <div className='bio-title'>
              <span>📝</span>
              <h3>O meni</h3>
            </div>
            <p className='bio-description'>{user.opis_kor || 'Korisnik nije dodao opis.'}</p>
          </div>

          {form && (
            <div className='modal-backdrop' onClick={showForm}>
              <div className='modal-container' onClick={(e) => e.stopPropagation()}>
                <div className='modal-head'>
                  <h3>Uredi profil</h3>
                  <button className='modal-x' onClick={showForm}>✕</button>
                </div>
                
                <form className='modal-form'>
                  <div className='form-two-cols'>
                    <div className='input-wrap'>
                      <label>Ime</label>
                      <input
                        type="text"
                        name="ime"
                        value={userState.ime}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className='input-wrap'>
                      <label>Prezime</label>
                      <input
                        type="text"
                        name="prezime"
                        value={userState.prezime}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <div className='form-two-cols'>
                    <div className='input-wrap'>
                      <label>Email</label>
                      <input
                        type="email"
                        name="mail"
                        value={userState.mail}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className='input-wrap'>
                      <label>Korisničko ime</label>
                      <input
                        type="text"
                        name="korisnicko_ime"
                        value={userState.korisnicko_ime}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <div className='form-two-cols'>
                    <div className='input-wrap'>
                      <label>Telefon</label>
                      <input
                        type="text"
                        name="br_tel"
                        value={userState.br_tel}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className='input-wrap'>
                      <label>Opis</label>
                      <textarea
                        rows="3"
                        name="opis"
                        value={userState.opis}
                        onChange={handleInputChange}
                        placeholder="Opišite sebe..."
                      />
                    </div>
                  </div>

                  <div className='modal-buttons'>
                    <button type="button" onClick={showForm} className='modal-cancel'>
                      Otkaži
                    </button>
                    <button type="button" onClick={onClickSave} className='modal-save'>
                      Sačuvaj
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {art.length > 0 && (
            <div className='section-card'>
              <div className='section-head'>
                <div className='section-title'>
                  <span>🖼️</span>
                  <h3>Moja djela</h3>
                </div>
                <span className='section-count'>{art.length}</span>
              </div>
              
              <div className='art-grid'>
                {Array.isArray(currentImages) ? (currentImages.map((artwork) => (
                  <div key={artwork.id} className='art-tile'>
                    <Picture 
                      src={artwork.slika ? `${artwork.slika}` : './../back.jpg'}
                      label={artwork.naziv_kategorije}
                      text={artwork.opis_djela}
                      title={artwork.naziv} 
                      link={`/artwork/${artwork.id}/profile/`}
                    />
                  </div>
                ))):(<p>Nema podataka</p>)}
              </div>
              
              <Pagination
                imagesPerPage={imagesPerPage}
                totalImages={art.length}
                paginate={paginate}
                currentPage={currentPage}
              />
            </div>
          )}

          {artComp.length > 0 && (
            <div className='section-card'>
              <div className='section-head'>
                <div className='section-title'>
                  <span>🏆</span>
                  <h3>Takmičenja</h3>
                </div>
                <span className='section-count'>{artComp.length}</span>
              </div>
              
              <div className='comp-grid'>
                {Array.isArray(artComp) ? ([...new Set(artComp.map(item => item.id))].map(compId => {
                  const competition = artComp.find(comp => comp.id === compId);
                  return (
                    <div key={compId} className='comp-tile'>
                      <CompetitonCard value={competition} />
                    </div>
                  );
                })):(<p>Nema podataka</p>)}
              </div>
            </div>
          )}

          {art.length === 0 && isArtist && (
            <div className='empty-wrapper'>
              <div className='empty-emoji'>🎨</div>
              <h3>Još nema umjetničkih djela</h3>
              <p>Dodajte svoja umjetnička djela kako biste ih podijelili sa zajednicom.</p>
              {isCurrentUser && (
                <button onClick={onClickAdd} className='empty-btn'>
                  <span>+</span>
                  Dodaj prvo djelo
                </button>
              )}
            </div>
          )}
        </div>

        {visible && <AddPainting artist={id} onClose={() => setVisible(false)} />}
      </div>
      <Footer />
      
      {toast.show && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={closeToast} 
        />
      )}
    </>
  );
}

export default MyProfile;