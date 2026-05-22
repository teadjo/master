import React, { useEffect, useState } from 'react'
import "./AllUsers.css"
import Footer from './Footer';
import { normalizeArray } from '../utils/normalize'
import {api} from '../utils/api' 
import Toast from '../Toast';
import { useToast } from '../ToastContext';

function AllUsers(){
    const [user, setUser] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState({ show: false, message: '', type: 'error' });
    const [confirmDialog, setConfirmDialog] = useState({ show: false, userId: null, message: '' });
    const API = import.meta.env.VITE_API_URL

    const { showToast } = useToast();

    const closeToast = () => {
        setToast({ show: false, message: '', type: 'error' });
    };

    const showConfirmDialog = (userId, message) => {
        setConfirmDialog({ show: true, userId, message });
    };

    const closeConfirmDialog = () => {
        setConfirmDialog({ show: false, userId: null, message: '' });
    };

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await api.get(`${API}/`);
                const filteredUsers = normalizeArray(response.data).filter(user => user.tip !== 0);
                setUser(filteredUsers);
              } catch (error) {
                console.error('Greška u dobavljanju korisnika:', error);
                showToast('Greška pri učitavanju korisnika!', 'error');
              } finally {
                setLoading(false);
              }
          };
       
          fetchUser();
    }, []); 

    const onClickRemoveButton = async (userid) => {
        showConfirmDialog(userid, 'Da li ste sigurni da želite ukloniti ovog korisnika?');
    };

    const handleConfirmDelete = async () => {
        const userid = confirmDialog.userId;
        try {
            const url = `${API}/user/${userid}`;
            await apis.delete(url);
            setUser(user.filter((user) => user.id_kor !== userid));
            showToast('Korisnik je uspešno uklonjen!', 'success');
            closeConfirmDialog();
        } catch (error) {
            showToast('Došlo je do greške pri uklanjanju korisnika', 'error');
            console.error(error);
            closeConfirmDialog();
        }
    };

    if (loading) {
        return (
            <>
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Učitavanje korisnika...</p>
                </div>
                {toast.show && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
            </>
        );
    }

    return(
        <>
            <div className='users-container'>
                <div className='users-content'>
                    <div className='header-section'>
                        <h1 className='page-title'>Lista Korisnika</h1>
                        <p className='page-subtitle'>Upravljajte korisničkim nalozima na platformi</p>
                    </div>
                    
                    <div className='table-container'>
                        <table className='users-table'>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Ime</th>
                                    <th>Prezime</th>
                                    <th>Telefon</th>
                                    <th>Email</th>
                                    <th>Username</th>
                                    <th>Akcije</th>
                                </tr>
                            </thead>
                            <tbody>
                                {user.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="no-data">
                                            <div className="no-data-content">
                                                <span className="no-data-icon">👥</span>
                                                <p>Nema korisnika za prikaz</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (Array.isArray(user) ? 
                                    (user.map((user) => (
                                        <tr key={user.id_kor}>
                                            <td className="user-id">#{user.id_kor}</td>
                                            <td className="user-name">{user.ime_kor}</td>
                                            <td className="user-surname">{user.prezime}</td>
                                            <td className="user-phone">{user.br_tel || '-'}</td>
                                            <td className="user-email">{user.mail}</td>
                                            <td className="user-username">@{user.korisnicko_ime}</td>
                                            <td className="user-actions">
                                                <button 
                                                    onClick={() => onClickRemoveButton(user.id_kor)} 
                                                    className='remove-btn'
                                                    title="Ukloni korisnika"
                                                >
                                                    <span className="btn-icon">🗑️</span>
                                                    Ukloni
                                                </button>
                                            </td>
                                        </tr> 
                                    ))
                                ):(<tr><td colSpan="7">Nema podataka</td></tr>))}
                            </tbody>
                        </table>
                    </div>

                    <div className="table-footer">
                        <div className="users-count">
                            Ukupno korisnika: <span className="count-number">{user.length}</span>
                        </div>
                    </div>
                </div>
            </div>
            <Footer/>
            
            {toast.show && (
                <Toast 
                    message={toast.message} 
                    type={toast.type} 
                    onClose={closeToast} 
                />
            )}

            {confirmDialog.show && (
                <div className="custom-confirm-overlay" onClick={closeConfirmDialog}>
                    <div className="custom-confirm-dialog" onClick={(e) => e.stopPropagation()}>
                        <div className="confirm-icon">⚠️</div>
                        <h3>Potvrda brisanja</h3>
                        <p>{confirmDialog.message}</p>
                        <div className="confirm-buttons">
                            <button className="confirm-cancel" onClick={closeConfirmDialog}>
                                Odustani
                            </button>
                            <button className="confirm-delete" onClick={handleConfirmDelete}>
                                Ukloni
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

export default AllUsers;