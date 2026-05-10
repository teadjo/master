import React from 'react'
import './Login.css'
import { useState } from "react";
import Toast from '../Toast';
import { useToast } from './../ToastContext';
import {api} from '../utils/api' 

function Login() {
    let [state, setState] = useState({Type: 1, slika:null});
    const [type, setType] = useState(1);
    const [isLoginFormVisible, setLoginFormVisible] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);
    const [toast, setToast] = useState({ show: false, message: '', type: 'error' });

    const API = import.meta.env.VITE_API_URL
    
    const { showToast } = useToast();
    const closeToast = () => {
        setToast({ show: false, message: '', type: 'error' });
    };
    
    const handleToggleForm = () => {
        setLoginFormVisible(!isLoginFormVisible);
        // Resetuj formu pri prebacivanju
        setState({Type: 1,slika:null});
        setPreviewImage(null);
        // Resetuj toast
        closeToast();
    };

    function onChangeUsername(e) {
        let new_cred = { Username: e.target.value };
        setState((state) => ({ ...state, ...new_cred }));
    }

    function onChangePassword(e) {
        let new_cred = { Password: e.target.value };
        setState((state) => ({ ...state, ...new_cred }));
    }

    function onChangeIme(e) {
        let new_cred = { Name: e.target.value };
        setState((state) => ({ ...state, ...new_cred }));
    }

    function onChangePrezime(e) {
        let new_cred = { Surname: e.target.value };
        setState((state) => ({ ...state, ...new_cred }));
    }

    function onChangeDescription(e) {
        let new_cred = { Description: e.target.value };
        setState((state) => ({ ...state, ...new_cred }));
    }

    function onChangeEmail(e) {
        let new_cred = { Email: e.target.value };
        setState((state) => ({ ...state, ...new_cred }));
    }

    function onChangePhoneNumber(e) {
        let new_cred = { Phone: e.target.value };
        setState((state) => ({ ...state, ...new_cred }));
    }

    function onChangeType(e) {
        const newType = e.target.value;
        setType(parseInt(newType));
        let new_cred = { Type: parseInt(e.target.value) };
        setState((state) => ({ ...state, ...new_cred }));
    }

    function onChangeImage(e) {
        const file = e.target.files[0];
        if (!file) return;

        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            showToast('Dozvoljeni formati: JPG, PNG, GIF, WEBP', 'error');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            showToast('Slika mora biti manja od 5MB', 'error');
            return;
        }

        // Sačuvaj File objekat
        setState((prevState) => ({ ...prevState, slika: file }));
        
        // Kreiraj preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewImage(reader.result);
        };
        reader.readAsDataURL(file);
    }


    async function onClickButtonRegister(e) {
        e.preventDefault();
        setIsLoading(true);
        
        if(!(typeof state.Username === 'undefined') && !(typeof state.Password === 'undefined')&& !(typeof state.Name === 'undefined') && !(typeof state.Surname === 'undefined') && !(typeof state.Email === 'undefined')){
            try{
                // Kreiraj FormData za slanje
                const formData = new FormData();
                formData.append('Name', state.Name);
                formData.append('Surname', state.Surname);
                formData.append('Email', state.Email);
                formData.append('Phone', state.Phone || '');
                formData.append('Username', state.Username);
                formData.append('Password', state.Password);
                formData.append('Type', state.Type);
                formData.append('Description', state.Description || '');
                if (state.slika) {
                    formData.append('slika', state.slika);
                    console.log('Slika dodata:', state.slika.name);
                }
                console.log(state)
                
                const response = await api.post(`${API}/add/`, formData, {
                        headers: {
                            'Content-Type': 'multipart/form-data'
                        }
                    });
                
                if (typeof response.data === 'undefined' || !response.data.token) {
                    showToast("Neuspješna registracija. Pokušajte ponovo.", "error");
                } else {
                    localStorage.setItem("token", response.data.token);
                    localStorage.setItem("userID", response.data.id);
                    localStorage.setItem("Type", response.data.tip);
                    localStorage.setItem("isArtist", response.data.tip===1);
                    localStorage.setItem("isVisitor", response.data.tip===2);
                    localStorage.setItem("isAdmin", response.data.tip===0);
                    localStorage.setItem("notlogedIn", 'false');
                    setTimeout(() => {
                        window.location = "/";
                    }, 1500);
                }
            } catch(error) {
                console.error('Greška:', error);
                if (error.response?.data?.error) {
                    showToast(`Greška: ${error.response.data.error}`, "error");
                } else {
                    showToast("Greška pri registraciji. Pokušajte ponovo.", "error");
                }
            } finally {
                setIsLoading(false);
            }
        } else {
            showToast("Morate popuniti sva obavezna polja!", "error");
            setIsLoading(false);
        }
    }

    const onClickButton = async (e) => {
        e.preventDefault();
        setIsLoading(true);
     
        if(!(typeof state.Username === 'undefined') && !(typeof state.Password === 'undefined')){
            try{
                const response = await api.post(`${API}/login`, state);
                if (response.data.token === null || !response.data.token) {
                    showToast("Pogrešno korisničko ime ili lozinka!", "error");
                } else {
                    localStorage.setItem("token", response.data.token);
                    localStorage.setItem("userID", response.data.id);
                    localStorage.setItem("Type", response.data.tip);
                    localStorage.setItem("isArtist", response.data.tip===1);
                    localStorage.setItem("isVisitor", response.data.tip===2);
                    localStorage.setItem("isAdmin", response.data.tip===0);
                    localStorage.setItem("notlogedIn", 'false');
                    setTimeout(() => {
                        window.location = "/";
                    }, 1500);
                }
            } catch(err) {
                console.error('Greška:', err);
                showToast("Greška pri prijavi. Pokušajte ponovo.", "error");
            } finally {
                setIsLoading(false);
            }
        } else {
            showToast("Morate popuniti sva polja!", "error");
            setIsLoading(false);
        }
    }

    return (
        <div className="login-container">
            <div className={`login-wrapper ${isLoginFormVisible ? 'login-mode' : 'register-mode'}`}>
                <div className="login-box">
                    <div className="login-header">
                        <h1>ArtConnection</h1>
                        <p>{isLoginFormVisible ? "Prijavite se na svoj nalog" : "Kreirajte novi nalog"}</p>
                    </div>

                    {isLoginFormVisible ? (
                        <form className="login-form">
                            <div className="input-group">
                                <input 
                                    type="text" 
                                    placeholder="Korisničko ime" 
                                    onChange={onChangeUsername}
                                />
                            </div>
                            <div className="input-group">
                                <input 
                                    type="password" 
                                    placeholder="Lozinka" 
                                    onChange={onChangePassword}
                                />
                            </div>
                            <button 
                                onClick={onClickButton} 
                                className="login-button"
                                disabled={isLoading}
                            >
                                {isLoading ? "Prijava..." : "Prijavi se"}
                            </button>
                            <div className="form-switch">
                                <span>Nemaš nalog? </span>
                                <button type="button" onClick={handleToggleForm}>
                                    Registruj se
                                </button>
                            </div>
                        </form>
                    ) : (
                        <form className="register-form">
                            <div className="input-group">
                                <select className='user-type' onChange={onChangeType}>
                                    <option value='1'>Umjetnik</option>
                                    <option value='2'>Posjetilac</option>
                                </select>
                            </div>

                            <div className="row">
                                <div className="input-group half">
                                    <input
                                        type="text" 
                                        placeholder="Ime *" 
                                        onChange={onChangeIme}
                                    />
                                </div>
                                <div className="input-group half">
                                    <input 
                                        type="text" 
                                        placeholder="Prezime *" 
                                        onChange={onChangePrezime}
                                    />
                                </div>
                            </div>

                            <div className="input-group">
                                <textarea 
                                    rows="3" 
                                    placeholder="Opis profila"
                                    onChange={onChangeDescription}
                                />
                            </div>

                            <div className="row">
                                <div className="input-group half">
                                    <input 
                                        type="email" 
                                        placeholder="Email *" 
                                        onChange={onChangeEmail}
                                    />
                                </div>
                                <div className="input-group half">
                                    <input 
                                        type="tel" 
                                        placeholder="Telefon" 
                                        onChange={onChangePhoneNumber}
                                    />
                                </div>
                            </div>

                            <div className="row">
                                <div className="input-group half">
                                    <input 
                                        type="text" 
                                        placeholder="Korisničko ime *" 
                                        onChange={onChangeUsername}
                                    />
                                </div>
                                <div className="input-group half">
                                    <input 
                                        type="password" 
                                        placeholder="Lozinka *" 
                                        onChange={onChangePassword}
                                    />
                                </div>
                            </div>

                            <div className="input-group">
                                <label>Profilna slika</label>
                                <input 
                                    type="file" 
                                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp" 
                                    onChange={onChangeImage}
                                />
                                {previewImage && (
                                    <div style={{ marginTop: '10px' }}>
                                        <img 
                                            src={previewImage} 
                                            alt="Preview" 
                                            style={{ 
                                                width: '100px', 
                                                height: '100px', 
                                                borderRadius: '50%',
                                                objectFit: 'cover'
                                            }} 
                                        />
                                    </div>
                                )}
                            </div>

                            <button 
                                onClick={onClickButtonRegister} 
                                className="register-button"
                                disabled={isLoading}
                            >
                                {isLoading ? "Registracija..." : "Registruj se"}
                            </button>

                            <div className="form-switch">
                                <span>Već imaš nalog? </span>
                                <button type="button" onClick={handleToggleForm}>
                                    Prijavi se
                                </button>
                            </div>
                        </form>
                    )}
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
    );
}

export default Login;