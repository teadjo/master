import React, {useState} from 'react';
import '../../App.css';
import './AddCategory.css';
import axios from 'axios';
import { normalizeArray } from '../../utils/normalize'

function AddCategory(){
    const [state, setState] = useState({ naziv: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const API = import.meta.env.VITE_API_URL

    function OnChangeCategory(e){
        const new_cred = { naziv: e.target.value };
        setState((prevState) => ({ ...prevState, ...new_cred }));
        // Clear errors when user starts typing
        if (error) setError('');
        if (success) setSuccess(false);
    }

    async function OnClickButton(e){
        e.preventDefault();
        
        // Validation
        if (!state.naziv || !state.naziv.trim()) {
            setError('Molimo unesite naziv kategorije');
            return;
        }

        if (state.naziv.length < 2) {
            setError('Naziv kategorije mora imati najmanje 2 karaktera');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await axios.post(`${API}/category/1`, state);
            
            if (response.data) {
                setSuccess(true);
                setState({ naziv: '' }); // Reset form
                setTimeout(() => setSuccess(false), 3000); // Hide success message after 3 seconds
            } else {
                setError('Greška u dodavanju kategorije. Pokušajte ponovo.');
            }
        } catch (error) {
            setError('Došlo je do greške. Provjerite da li kategorija već postoji.');
            console.error('Error adding category:', error);
        } finally {
            setLoading(false);
        }
    }

    return(
        <div className='addCategory-container'>
            <div className='addCategoryBox-container'>
                <div className='form-header'>
                    <div className='header-icon'>📁</div>
                    <h2>Dodaj Novu Kategoriju</h2>
                    <p>Proširite ponudu umjetničkih kategorija</p>
                </div>
                
                <form className='addCategory-form' onSubmit={OnClickButton}>
                    <div className='form-group'>
                        <label htmlFor="categoryName" className='form-label'>
                            Naziv Kategorije *
                        </label>
                        <input
                            id="categoryName"
                            type='text'
                            placeholder='Unesite naziv kategorije...'
                            name='Category'
                            value={state.naziv}
                            onChange={OnChangeCategory}
                            className={error ? 'input-error' : ''}
                            disabled={loading}
                        />
                        {error && <span className="error-message">{error}</span>}
                    </div>

                    {success && (
                        <div className="success-message">
                            <span className="success-icon">✅</span>
                            Kategorija je uspješno dodata!
                        </div>
                    )}

                    <div className='button-container'>
                        <button 
                            type="submit" 
                            className={`submit-btn ${loading ? 'loading' : ''}`}
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="loading-spinner"></span>
                                    Dodavanje...
                                </>
                            ) : (
                                <>
                                    <span className="btn-icon">➕</span>
                                    Dodaj Kategoriju
                                </>
                            )}
                        </button>
                    </div>
                </form>

                <div className="form-footer">
                    <div className="feature-list">
                        <div className="feature-item">
                            <span className="feature-icon">🎨</span>
                            <span>Podrška za različite umjetničke stilove</span>
                        </div>
                        <div className="feature-item">
                            <span className="feature-icon">🔍</span>
                            <span>Lakša organizacija takmičenja</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AddCategory;