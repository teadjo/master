import React, {useState, useEffect} from 'react'
import { useParams } from 'react-router-dom';
import './ApplyForm.css'
import Picture from '../Picture';
import { normalizeArray } from '../../utils/normalize'
import {api} from '../../utils/api'
import Toast from '../../Toast'
import { useToast } from '../../ToastContext';

function ApplyForm() {
    const {id} = useParams();
    const [state, setState] = useState({});
    const [art, setArt] = useState([]);
    const [selectedArt, setSelectedArt] = useState(null);
    const [toast, setToast] = useState({ show: false, message: '', type: 'error' });
    const userID = localStorage.getItem('userID')
    const API = import.meta.env.VITE_API_URL
    const API1 = import.meta.env.VITE_URL

    const { showToast } = useToast();

    const closeToast = () => {
        setToast({ show: false, message: '', type: 'error' });
    };

    useEffect(() => {
        const fetchComp = async () => {
          if(!(userID === 'null')){
            try {
                const response = await api.get(`${API}/artworks/artist/${userID}`);
                setArt(normalizeArray(response.data)); 
              } catch (error) {
                console.error('Greška u dobavljanju ispita:', error);
                showToast('Greška pri učitavanju vaših radova!', 'error');
              }
            }else{
                showToast('Morate biti ulogovani da biste se prijavili', 'error');
              }
        };
        fetchComp();
    },[userID]);

    const onClickAplicate = async (e) => {
        e.preventDefault();
        try{
            if(!(typeof state.naziv === 'undefined')){
                const ID_by_name = await api.get(`${API}/artworks/name/${state.naziv}`);
                const art_id = ID_by_name.data[0].id;
                const response = await api.post(`${API}/spec/`, {
                    id_takmicenja_tr : id,
                    id_rada_tr : art_id
                })
                
                if (typeof response.data == undefined || !response.data[0]) {
                    showToast("Nije uspjelo, slika je već prijavljena na ovom takmičenju", "error");
                } else {
                    showToast("Uspješno ste prijavili rad na takmičenje!", "success");
                    setArt(response.data);
                    setTimeout(() => {
                        window.location = `${API1}/competition/${id}`;
                    }, 1500);
                }
            } else {
                showToast('Morate izabrati sliku za prijavu!', 'error');
            }
        } catch(error){
            console.error('Greška:', error);
            showToast("Greška pri prijavi rada na takmičenje!", "error");
        }
    }

    const handleArtSelect = (art) => {
        setState((state) => ({...state, naziv : art.naziv}));
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
                            ))):(<p>Nema podataka</p>)}
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
                    <a href={`${API1}/competition/${id}`} className='cancel-link'>
                        <span className='btn-icon'>↩️</span>
                        Odustani
                    </a>
                </div>
            </div>
        </div>
        
        {/* Toast notifikacija */}
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