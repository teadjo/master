import React, {useState, useEffect} from 'react'
import { useNavigate } from 'react-router-dom';
import './AddPainting.css'
import Toast from '../../Toast'; 
import { normalizeArray } from '../../utils/normalize'
import {api} from '../../utils/api'
import { useToast } from '../../ToastContext';
import { useSyncNotification } from '../../contexts/SyncNotificationContext';

function AddPainting(props) {
    const navigate = useNavigate();
    const [category, setCategory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [previewImage, setPreviewImage] = useState(null);
    const [toast, setToast] = useState(null); 
    
    const currentDate = new Date();
    const API = import.meta.env.VITE_API_URL
    const API1 = import.meta.env.VITE_URL
    
    const [state, setState] = useState({
        datum_slanja: `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`,
        id_umjetnika: props.artist,
        naziv_kategorije: "Slikarstvo",
        naziv: '',
        opis_djela: '',
        slika: null
    });

    const { showToast } = useToast();
    const { startOfflineSync } = useSyncNotification();

    
    useEffect(() => {
        const fetchCategory = async () => {
            try {
                const response = await api.get(`${API}/category/`);
                setCategory(normalizeArray(response.data));
            } catch (error) {
                console.error('Greška:', error);
                showToast('Greška pri učitavanju kategorija', 'error');
            }
        };
        fetchCategory();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setState(prev => ({ ...prev, [name]: value }));
        
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const onChangeImage = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            setErrors(prev => ({ ...prev, slika: 'Dozvoljeni formati: JPG, PNG, GIF, WEBP' }));
            showToast('Molimo odaberite sliku u ispravnom formatu', 'error');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setErrors(prev => ({ ...prev, slika: 'Slika mora biti manja od 5MB' }));
            showToast('Slika je prevelika. Maksimalna veličina je 5MB', 'error');
            return;
        }

        setState(prev => ({ ...prev, slika: file }));
        setErrors(prev => ({ ...prev, slika: '' }));
        
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewImage(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const validateForm = () => {
        const newErrors = {};
        
        if (!state.naziv.trim()) newErrors.naziv = 'Naziv djela je obavezan';
        if (!state.naziv_kategorije) newErrors.naziv_kategorije = 'Kategorija je obavezna';
        if (!state.slika) newErrors.slika = 'Slika je obavezna';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };


const onEditBtnCLick = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
        showToast('Molimo popravite greške u formi prije slanja', 'error');
        return;
    }

    setLoading(true);
    
    try {
        const formData = new FormData();
        formData.append('naziv', state.naziv);
        formData.append('opis_djela', state.opis_djela);
        formData.append('naziv_kategorije', state.naziv_kategorije);
        formData.append('id_umjetnika', state.id_umjetnika);
        formData.append('slika', state.slika);
        formData.append('datum_slanja', state.datum_slanja);
        
        const response = await api.post(`${API}/artworks/`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });

        if (response.data && response.data[0]?.id) {
            await api.post(`${API}/rk/`, {
                id_umjetnika_rk: state.id_umjetnika,
                id_rada_rk: response.data[0].id
            });

            showToast('✨ Umjetničko djelo je uspješno dodano!', 'success');
            setTimeout(() => {
                handleCancel();
            }, 1000);
        }
    } catch (error) {
        console.error('Greška:', error);
        if (!navigator.onLine || error.message?.includes('Network Error')) {
            showToast(
                'Vaše djelo će biti dodano kada budete ponovo online! 📱',
                'info'
            );
             startOfflineSync(
                'artwork',
                `${API1}/profile/${props.artist}`
            );
                    
            setTimeout(() => {
                handleCancel();
            }, 1500);
        } else {
            showToast('Došlo je do greške pri dodavanju djela', 'error');
        }
    } finally {
        setLoading(false);
    }
};

    const handleCancel = () => {
        props.onClose?.() || navigate(`/${props.artist}/myProfile`);
    };

    return (
        <div className='add-painting-modal'>
            <div className="toast-container">
                {toast && (
                    <Toast 
                        message={toast.message} 
                        type={toast.type} 
                        onClose={() => setToast(null)} 
                    />
                )}
            </div>

            <div className='modal-overlay' onClick={handleCancel}></div>
            
            <div className='painting-form-container'>
                <div className='form-card'>
                    <div className='form-header'>
                        <h2>🎨 Novo Umjetničko Djelo</h2>
                        <p>Podijelite svoju kreativnost sa svijetom</p>
                    </div>

                    <div className='form-scrollable'>
                        <form className="painting-form">
                            <div className='form-grid'>
                                <div className='form-group'>
                                    <label>
                                        <span className="label-icon">🖼️</span>
                                        Naziv Djela *
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Unesite naziv umjetničkog djela"
                                        name="naziv"
                                        value={state.naziv}
                                        onChange={handleChange}
                                        className={errors.naziv ? 'error' : ''}
                                    />
                                    {errors.naziv && <span className="error-text">{errors.naziv}</span>}
                                </div>

                                <div className='form-group'>
                                    <label>
                                        <span className="label-icon">📂</span>
                                        Kategorija *
                                    </label>
                                    <select 
                                        name="naziv_kategorije" 
                                        value={state.naziv_kategorije}
                                        onChange={handleChange}
                                        className={errors.naziv_kategorije ? 'error' : ''}
                                    >
                                        {Array.isArray(category) && category.length > 0 ? (
                                            category.map((cat) => (
                                                <option key={cat.id} value={cat.naziv}>{cat.naziv}</option>
                                            ))
                                        ) : (
                                            <option value="Slikarstvo">Slikarstvo</option>
                                        )}
                                    </select>
                                    {errors.naziv_kategorije && <span className="error-text">{errors.naziv_kategorije}</span>}
                                </div>

                                <div className='form-group full-width'>
                                    <label>
                                        <span className="label-icon">📝</span>
                                        Opis Djela
                                    </label>
                                    <textarea 
                                        rows="4"
                                        placeholder="Opišite svoje umjetničko djelo, tehniku, inspiraciju..."
                                        name="opis_djela"
                                        value={state.opis_djela}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className='form-group full-width'>
                                    <label>
                                        <span className="label-icon">📸</span>
                                        Slika Djela *
                                    </label>
                                    <div className="file-upload-area">
                                        <input
                                            type="file"
                                            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                                            onChange={onChangeImage}
                                            className="file-input"
                                        />
                                        <div className="upload-placeholder">
                                            <div className="upload-icon">🖼️</div>
                                            <p>Kliknite ili prevucite sliku ovdje</p>
                                            <span className="upload-hint">JPG, PNG, GIF, WEBP (max 5MB)</span>
                                        </div>
                                    </div>
                                    {errors.slika && <span className="error-text">{errors.slika}</span>}
                                    
                                    {previewImage && (
                                        <div className="preview-section">
                                            <div className="preview-header">
                                                <span className="preview-title">
                                                    <span>🖼️</span> Preview slike
                                                </span>
                                                <button 
                                                    type="button" 
                                                    className="remove-image-btn"
                                                    onClick={() => {
                                                        setPreviewImage(null);
                                                        setState(prev => ({ ...prev, slika: null }));
                                                        const fileInput = document.querySelector('input[type="file"]');
                                                        if (fileInput) fileInput.value = '';
                                                        showToast('Slika je uklonjena', 'info');
                                                    }}
                                                >
                                                    Ukloni
                                                </button>
                                            </div>
                                            <div className="preview-image-wrapper">
                                                <img 
                                                    loading="lazy"
                                                    src={previewImage} 
                                                    alt="Preview" 
                                                    className="preview-image"
                                                    onClick={() => window.open(previewImage, '_blank')}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </form>
                    </div>

                    <div className='form-actions'>
                        <button 
                            type="button" 
                            onClick={handleCancel}
                            className='cancel-btn'
                            disabled={loading}
                        >
                            Odustani
                        </button>
                        <button 
                            type="submit" 
                            onClick={onEditBtnCLick}
                            disabled={loading}
                            className={`submit-btn ${loading ? 'loading' : ''}`}
                        >
                            {loading ? (
                                <>
                                    <span className="loading-spinner"></span>
                                    Dodavanje...
                                </>
                            ) : (
                                <>
                                    <span className="btn-icon">✨</span>
                                    Dodaj Djelo
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AddPainting;