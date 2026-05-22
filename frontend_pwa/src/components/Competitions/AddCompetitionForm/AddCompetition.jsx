import React, {useState, useEffect} from 'react'
import './AddCompetition.css'
import { normalizeArray } from '../../../utils/normalize'
import {api} from '../../../utils/api'
import Toast from '../../../Toast'
import { useToast } from '../../../ToastContext';

function AddCompetition() {
    const [category, setCategory] = useState([]);
    const [state, setState] = useState({
        naziv_kategorije_t: 'Slikarstvo',
        naziv_takmicenja: '',
        opis: '',
        datum_poc: '',
        datum_kraja: '',
        ime: '',
        svota: '',
        slika: null  
    });
    const [previewImage, setPreviewImage] = useState(null); 
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [toast, setToast] = useState({ show: false, message: '', type: 'error' });
    const API = import.meta.env.VITE_API_URL

    const { showToast } = useToast();

    const closeToast = () => {
        setToast({ show: false, message: '', type: 'error' });
    };

    useEffect(() => {
        const fetchCategory = async () => {
            try {
                const response = await api.get(`${API}/category/`);
                setCategory(normalizeArray(response.data));
            } catch (error) {
                console.error('Greška:', error);
                showToast('Greška pri učitavanju kategorija!', 'error');
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
            showToast('Dozvoljeni formati slike: JPG, PNG, GIF, WEBP', 'error');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setErrors(prev => ({ ...prev, slika: 'Slika mora biti manja od 5MB' }));
            showToast('Slika mora biti manja od 5MB', 'error');
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
        
        if (!state.naziv_takmicenja.trim()) newErrors.naziv_takmicenja = 'Naziv je obavezan';
        if (!state.opis.trim()) newErrors.opis = 'Opis je obavezan';
        if (!state.datum_poc) newErrors.datum_poc = 'Datum početka je obavezan';
        if (!state.datum_kraja) newErrors.datum_kraja = 'Datum kraja je obavezan';
        if (!state.ime.trim()) newErrors.ime = 'Nagrada je obavezna';
        if (!state.svota.trim()) newErrors.svota = 'Svota je obavezna';
        if (!state.slika) newErrors.slika = 'Slika je obavezna';

        if (state.datum_poc && state.datum_kraja) {
            const startDate = new Date(state.datum_poc);
            const endDate = new Date(state.datum_kraja);
            if (endDate <= startDate) {
                newErrors.datum_kraja = 'Datum kraja mora biti nakon datuma početka';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const onEditBtnCLick = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            showToast('Molimo popravite greške u formi', 'error');
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('naziv_takmicenja', state.naziv_takmicenja);
            formData.append('opis', state.opis);
            formData.append('datum_poc', state.datum_poc);
            formData.append('datum_kraja', state.datum_kraja);
            formData.append('naziv_kategorije_t', state.naziv_kategorije_t);
            formData.append('ime', state.ime);
            formData.append('svota', state.svota);
            formData.append('slika', state.slika); 
            
            const response = await api.post(`${API}/competitions/`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            if (response.data) {
                showToast("Takmičenje je uspešno dodato!", "success");
                setState({
                    naziv_kategorije_t: 'Slikarstvo',
                    naziv_takmicenja: '',
                    opis: '',
                    datum_poc: '',
                    datum_kraja: '',
                    ime: '',
                    svota: '',
                    slika: null
                });
                setPreviewImage(null); 
                const fileInput = document.querySelector('input[type="file"]');
                if (fileInput) fileInput.value = '';
                
                setErrors({});
            }
        } catch (error) {
            console.error('Greška:', error);
            if (error.response?.data?.error) {
                showToast(`Greška: ${error.response.data.error}`, 'error');
            } else {
                showToast("Došlo je do greške pri dodavanju takmičenja", "error");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
        <div className='form-container'>
            <div className='form-card'>
                <div className='form-header'>
                    <h1>Kreiraj Novo Takmičenje</h1>
                    <p>Popunite sve detalje o novom takmičenju</p>
                </div>

                <form className="competition-form">
                    <div className='form-grid'>
                        <div className='form-group'>
                            <label htmlFor="naziv_takmicenja">Naziv Takmičenja *</label>
                            <input
                                id="naziv_takmicenja"
                                type="text"
                                placeholder="Unesite naziv takmičenja"
                                name="naziv_takmicenja"
                                value={state.naziv_takmicenja}
                                onChange={handleChange}
                                className={errors.naziv_takmicenja ? 'error' : ''}
                            />
                            {errors.naziv_takmicenja && <span className="error-text">{errors.naziv_takmicenja}</span>}
                        </div>

                        <div className='form-group'>
                            <label htmlFor="naziv_kategorije_t">Kategorija *</label>
                            <select 
                                id="naziv_kategorije_t"
                                name="naziv_kategorije_t" 
                                value={state.naziv_kategorije_t}
                                onChange={handleChange}
                            >
                                {Array.isArray(category) && category.length > 0 ? (
                                    category.map((cat) => (
                                        <option key={cat.id} value={cat.naziv}>{cat.naziv}</option>
                                    ))
                                ) : (
                                    <option value="Slikarstvo">Slikarstvo</option>
                                )}
                            </select>
                        </div>

                        <div className='form-group full-width'>
                            <label htmlFor="opis">Opis Takmičenja *</label>
                            <textarea 
                                id="opis"
                                rows="4"
                                placeholder="Detaljno opišite takmičenje, pravila, kriterijume..."
                                name="opis"
                                value={state.opis}
                                onChange={handleChange}
                                className={errors.opis ? 'error' : ''}
                            />
                            {errors.opis && <span className="error-text">{errors.opis}</span>}
                        </div>

                        <div className='form-group'>
                            <label htmlFor="datum_poc">Datum Početka *</label>
                            <input
                                id="datum_poc"
                                type="datetime-local"
                                name="datum_poc"
                                value={state.datum_poc}
                                onChange={handleChange}
                                className={errors.datum_poc ? 'error' : ''}
                            />
                            {errors.datum_poc && <span className="error-text">{errors.datum_poc}</span>}
                        </div>

                        <div className='form-group'>
                            <label htmlFor="datum_kraja">Datum Završetka *</label>
                            <input
                                id="datum_kraja"
                                type="datetime-local"
                                name="datum_kraja"
                                value={state.datum_kraja}
                                onChange={handleChange}
                                className={errors.datum_kraja ? 'error' : ''}
                            />
                            {errors.datum_kraja && <span className="error-text">{errors.datum_kraja}</span>}
                        </div>

                        <div className='form-group'>
                            <label htmlFor="ime">Nagrada *</label>
                            <input
                                id="ime"
                                type="text"
                                placeholder="Npr. Prva nagrada"
                                name="ime"
                                value={state.ime}
                                onChange={handleChange}
                                className={errors.ime ? 'error' : ''}
                            />
                            {errors.ime && <span className="error-text">{errors.ime}</span>}
                        </div>

                        <div className='form-group'>
                            <label htmlFor="svota">Vrijednost Nagrade *</label>
                            <input
                                id="svota"
                                type="text"
                                placeholder="Npr. 500€"
                                name="svota"
                                value={state.svota}
                                onChange={handleChange}
                                className={errors.svota ? 'error' : ''}
                            />
                            {errors.svota && <span className="error-text">{errors.svota}</span>}
                        </div>

                        <div className='form-group full-width'>
                            <label htmlFor="slika">Slika Takmičenja *</label>
                            <div className="file-upload">
                                <input
                                    id="slika"
                                    type="file"
                                    name="compImage"
                                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                                    onChange={onChangeImage}
                                    className={errors.slika ? 'error' : ''}
                                />
                                <div className="file-info">
                                    <span className="file-icon">📷</span>
                                    <span className="file-text">
                                        {state.slika ? state.slika.name : 'Odaberite sliku takmičenja'}
                                    </span>
                                </div>
                            </div>
                            {errors.slika && <span className="error-text">{errors.slika}</span>}
                            <div className="file-hint">Podržani formati: JPG, PNG, GIF, WEBP (max 5MB)</div>
                            
                            {previewImage && (
                                <div className="image-preview" style={{ marginTop: '15px' }}>
                                    <img 
                                        loading="lazy"
                                        src={previewImage} 
                                        alt="Preview" 
                                        style={{ 
                                            maxWidth: '200px', 
                                            maxHeight: '200px', 
                                            borderRadius: '8px',
                                            border: '2px solid #ddd'
                                        }} 
                                    />
                                </div>
                            )}
                        </div>
                    </div>

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
                                <span className="btn-icon">🏆</span>
                                Kreiraj Takmičenje
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
        
        {toast.show && (
            <Toast 
                message={toast.message} 
                type={toast.type} 
                onClose={closeToast} 
            />
        )}
        </>
    )
}

export default AddCompetition;