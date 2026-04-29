import React, { useEffect, useState } from 'react'
import axios from 'axios';
import "./AllUsers.css"
import Footer from './Footer';
import { normalizeArray } from '../utils/normalize'
import {api} from '../utils/api' 
function AllUsers(){
    const [user, setUser] = useState([]);
    const [loading, setLoading] = useState(true);
    const API = import.meta.env.VITE_API_URL

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await api.get(`${API}/`);
            
                const filteredUsers = normalizeArray(response.data).filter(user => user.tip !== 0);
                setUser(filteredUsers);
              } catch (error) {
                console.error('Greška u dobavljanju korisnika:', error);
              } finally {
                setLoading(false);
              }
          };
       
          fetchUser();
    }, []); 

    const onClickRemoveButton = async (userid) => {
        if (!window.confirm('Da li ste sigurni da želite ukloniti ovog korisnika?')) {
            return;
        }

        try {
            const url = `${API}/user/${userid}`;
            await axios.delete(url);
            setUser(user.filter((user) => user.id_kor !== userid));
        } catch (error) {
            window.alert('Došlo je do greške pri uklanjanju korisnika');
            console.error(error);
        }
      };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Učitavanje korisnika...</p>
            </div>
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
                            ):(<p>Nema podataka</p>))}
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
        </>
    )
}

export default AllUsers;