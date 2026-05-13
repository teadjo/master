import React, { useState, useEffect } from 'react'
import './ApplyForm.css'
import Picture from '../Picture';
import { normalizeArray } from '../../utils/normalize'
import { api } from '../../utils/api'
import Toast from '../../Toast'
import { useToast } from '../../ToastContext';
import { useSyncNotification } from '../../contexts/SyncNotificationContext';
import { useParams, useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom'


function ApplyForm({ closeForm }) {
    const { id } = useParams();
    const [state, setState] = useState({});
    const [art, setArt] = useState([]);
    const [selectedArt, setSelectedArt] = useState(null);
    const [toast, setToast] = useState({ show: false, message: '', type: 'error' });
    const userID = localStorage.getItem('userID')
    const API = import.meta.env.VITE_API_URL
    const API1 = import.meta.env.VITE_URL

    const { showToast } = useToast();
    const navigate = useNavigate();
    
    // KLJUČNO: Koristi globalni sync kontekst
    const { startOfflineSync } = useSyncNotification();

    const closeToast = () => {
        setToast({ show: false, message: '', type: 'error' });
    };

    useEffect(() => {

        const fetchComp = async () => {
            if (!userID || userID === 'null' || userID === 'undefined') {
            showToast('Morate biti ulogovani da biste se prijavili', 'error');
            return;
        }
            if (!(userID === 'null') && !(userID === 'undefined')) {
                try {
                    const response = await api.get(`${API}/artworks/artist/${userID}`);
                    setArt(normalizeArray(response.data));
                } catch (error) {
                    console.error('Greška u dobavljanju ispita:', error);
                    showToast('Greška pri učitavanju vaših radova!', 'error');
                }
            } else {
                showToast('Morate biti ulogovani da biste se prijavili', 'error');
            }
        };
        fetchComp();
    }, [userID]);

    const onClickAplicate = async (e) => {
        
        if ('Notification' in window) {
            Notification.requestPermission()
                .then(permission => {
                    console.log('Notification permission:', permission);
                });
}
        e.preventDefault();
        
        if (typeof state.art_id === 'undefined') {
            showToast('Morate izabrati sliku za prijavu!', 'error');
            return;
        }

        try {
            const response = await api.post(`${API}/spec/`, {
                id_takmicenja_tr: id,
                id_rada_tr: state.art_id
            });

            // Ako je offline (queued)
            if (response.data && response.data.queued) {
                console.log('📱 Offline - zahtjev sačuvan');
                
                showToast(
                    'Vaš rad će biti prijavljen kada budete ponovo online! 📱',
                    'info'
                );
                
                // KLJUČNO: Pokreni GLOBALNI sync tracker
                // Ovo će raditi čak i kad korisnik napusti formu!
                startOfflineSync(id, `${API1}/competition/${id}`);
                setTimeout(() => {
                    navigate(`/competition/${id}`);
                }, 1500);
                return;
            }

            // Online - uspjeh
            if (response.status === 200 || response.status === 201) {
                showToast(
                    "Uspješno ste prijavili rad na takmičenje! 🎉",
                    "success"
                );

                setTimeout(() => {
                    navigate(`/competition/${id}`);
                }, 1500);
            }

        } catch (error) {
            console.error('Greška pri prijavi:', error);
            
            if (!navigator.onLine || error.message?.includes('Network Error')) {
                showToast(
                    'Vaš rad će biti prijavljen kada budete ponovo online! 📱',
                    'info'
                );
                
                // KLJUČNO: Pokreni GLOBALNI sync tracker
                startOfflineSync(id, `${API1}/competition/${id}`);
                
                // Ručno sačuvaj ako treba
                try {
                    const dbRequest = indexedDB.open('BackgroundSyncDB', 1);
                    dbRequest.onsuccess = (event) => {
                        const db = event.target.result;
                        const tx = db.transaction('pendingRequests', 'readwrite');
                        const store = tx.objectStore('pendingRequests');
                        
                        store.add({
                            url: `${API}/spec/`,
                            method: 'POST',
                            data: {
                                id_takmicenja_tr: id,
                                id_rada_tr: state.art_id
                            },
                            headers: { 'Content-Type': 'application/json' },
                            timestamp: Date.now()
                        });
                    };
                } catch (dbError) {
                    console.error('❌ IndexedDB greška:', dbError);
                }
            } else {
                showToast('Došlo je do greške pri prijavi', 'error');
            }
        }
    }

    const handleArtSelect = (art) => {
        setState((state) => ({ ...state, naziv: art.naziv, art_id: art.id }));
        setSelectedArt(art.id);
    }

    return (
        <div className='apply-form-overlay'>
            <div className='apply-form-container'>
                <div className='apply-form-content'>
                    <div className='form-header'>
                        <h1>Izaberite sliku za prijavu</h1>
                        <p>Odaberite jedan od vaših radova za prijavu na takmičenje</p>
                    </div>

                    <div className='artworks-selection'>
                        <div className='selection-header'>
                            <h3>Vaši radovi</h3>
                            <span className='selected-count'>{selectedArt ? '1 odabran' : '0 odabrano'}</span>
                        </div>

                        {art.length > 0 ? (
                            <div className='artworks-grid1'>
                                {Array.isArray(art) ? (art.map((art) => (
                                    <div
                                        key={art.id}
                                        className={`artwork-card ${selectedArt === art.id ? 'selected' : ''}`}
                                        onClick={() => handleArtSelect(art)}
                                    >
                                        <div className='selection-indicator'>
                                            <div className='checkmark'></div>
                                        </div>
                                        <Picture
                                            src={art.slika ? `${art.slika}` : './../../back.jpg'}
                                            label1={art.naziv_kategorije}
                                            text={art.opis}
                                            title={art.naziv}
                                        />
                                    </div>
                                ))) : (<p>Nema podataka</p>)}
                            </div>
                        ) : (
                            <div className='empty-artworks'>
                                <div className='empty-icon'>🎨</div>
                                <h3>Nemate dostupnih radova</h3>
                                <p>Prvo dodajte neke radove u vaš portfolio</p>
                            </div>
                        )}
                    </div>

                    <div className='form-actions'>
                        <button onClick={onClickAplicate} className='submit-btn'>
                            <span className='btn-icon'>📨</span>
                            Potvrdi prijavu
                        </button>
                        <button
                            type="button"
                            onClick={closeForm}
                            className='cancel-link'
                            >
                            <span className='btn-icon'>↩️</span>
                            Odustani
                            </button>
                    </div>
                </div>
            </div>

            {toast.show && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={closeToast}
                />
            )}
        </div>
    )
}

export default ApplyForm