import React, {useState, useEffect} from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import './ViewForVoting.css'
import StarRatingComp from '../StarRatingComp'
import CompetitionCard from '../CompetitionCard'
import Comment from './Comment'
import Footer from '../Footer'
import { normalizeArray } from '../../utils/normalize'
import {api} from '../../utils/api' 
import Toast from '../../Toast'
import { useToast } from '../../ToastContext'

function ViewForVoting() {
    const { id, artID } = useParams(); // competition ID i artwork ID
    const navigate = useNavigate();
    const [art, setArt] = useState({});
    const [grade, setGrade] = useState(0);
    const [idGraded, setIdGraded] = useState();
    const [comments, setComments] = useState([]);
    const [allWonCompetitions, setAllWonCompetitions] = useState([]);
    const [allCompetitions, setAllCompetitions] = useState([]);
    const [comp, setComp] = useState({});
    const [validV, setValidV] = useState(true)
    const [loading, setLoading] = useState(true)
    const [toast, setToast] = useState({ show: false, message: '', type: 'error' })
    const [state, setState] = useState({
        id_rada: artID,
        id_ocenjivaca: localStorage.getItem('userID'),
        id_takmicenja: id,
        ocjena: 0,
        komentar: ''
    })

    const currentDate = new Date().getTime();
    const competitionEndDate = comp && comp.datum_kraja ? new Date(comp.datum_kraja).getTime() : 0;
    const isCompetitionActive = competitionEndDate >= currentDate;
    const canVote = isCompetitionActive && validV;
    const API = import.meta.env.VITE_API_URL

    const { showToast } = useToast();

    const closeToast = () => {
        setToast({ show: false, message: '', type: 'error' });
    };

    useEffect(() => {
        const fetchInfo = async () => {
            try {
                setLoading(true);
                console.log("Fetching data for competition:", id, "and artwork:", artID);

                const [
                    artworkRes, 
                    gradesRes, 
                    compRes, 
                    specRes, 
                    competitionRes
                ] = await Promise.all([
                    api.get(`${API}/artworks/artwork/${artID}`),
                    api.get(`${API}/grades/compID/${id}/artID/${artID}`),
                    api.get(`${API}/aua/artwork/${artID}`),
                    api.get(`${API}/spec/tra/${artID}`),
                    api.get(`${API}/competitions/compID/${id}`)
                ]);

                console.log("Artwork data:", artworkRes.data);
                console.log("Competition data:", competitionRes.data);

                if (!artworkRes.data[0]) {
                    showToast("Rad nije pronađen!", "error");
                    navigate('/competitions');
                    return;
                }

                setArt(artworkRes.data[0]);
                setIdGraded(artworkRes.data[0].id_umjetnika);
                setComments(normalizeArray(gradesRes.data) || []);
                setAllWonCompetitions(normalizeArray(compRes.data) || []);
                setAllCompetitions(normalizeArray(specRes.data) || []);
                setComp(competitionRes.data[0] || {});

                // Provjeri da li je trenutni korisnik već glasao
                const userID = localStorage.getItem('userID');
                const userGrades = gradesRes.data.filter(grade => 
                    grade.id_ocenjivaca == userID
                );
                
                if (userGrades.length > 0) {
                    setValidV(false);
                    console.log("Korisnik je već glasao");
                }

                // Provjeri da li je korisnik vlasnik rada
                if (userID == artworkRes.data[0].id_umjetnika) {
                    setValidV(false);
                    console.log("Korisnik je vlasnik rada, ne može glasati");
                }

            } catch (err) {
                console.error("Greška u dobavljanju podataka:", err);
                showToast("Greška pri učitavanju podataka!", "error");
            } finally {
                setLoading(false);
            }
        }
        
        if (artID && id) {
            fetchInfo();
        }
    }, [artID, id, navigate]);

    // Update state when grade changes
    useEffect(() => {
        setState(prev => ({...prev, ocjena: grade}));
    }, [grade]);

    function onClickSubmit(e) {
        e.preventDefault();
        
        console.log("Submitting grade:", grade);
        console.log("User ID:", state.id_ocenjivaca, "Artist ID:", idGraded);
        
        if (state.id_ocenjivaca == idGraded) {
            showToast("Ne možete ocijeniti svoj rad!", "error");
            return;
        }

        if (grade === 0) {
            showToast("Molimo odaberite ocjenu prije slanja!", "error");
            return;
        }

        const writeGrade = async () => {
            try {
                console.log("Sending data:", state);
                const write = await api.post(`${API}/grades/`, state);
                if (write.data) {
                    showToast("Uspješno ste ocijenili rad!", "success");
                    setValidV(false);
                    // Refresh comments to show the new one
                    const gradesRes = await api.get(`${API}/grades/compID/${id}/artID/${artID}`);
                    setComments(gradesRes.data);
                    // Reset grade and comment
                    setGrade(0);
                    setState(prev => ({ ...prev, komentar: '', ocjena: 0 }));
                } else {
                    showToast("Objava nije uspjela. Pokušajte ponovo.", "error");
                }
            } catch(error) {
                console.error("Error submitting grade:", error);
                showToast("Greška pri slanju ocjene: " + (error.response?.data?.message || error.message || "Nepoznata greška"), "error");
            }
        }
        writeGrade();
    }

    function onChangeComment(e) {
        setState(prev => ({ ...prev, komentar: e.target.value }));
    }

    const handleViewRegular = () => {
        navigate(`/artwork/${artID}/profile`);
    };

    if (loading) {
        return (
            <>
                <div className="loading">Učitavanje...</div>
                {toast.show && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
            </>
        );
    }

    return (
        <>    
            <div className='artwork-container voting'>
                {/* Competition Info Banner */}
                <div className='competition-banner'>
                    <div className='banner-content'>
                        <h2>Takmičenje: {comp.naziv_takmicenja}</h2>
                        <p className='competition-dates'>
                            📅 Završetak: {comp.datum_kraja ? new Date(comp.datum_kraja).toLocaleDateString() : 'Nepoznato'}
                            {isCompetitionActive && (
                                <span className='active-badge'> 🟢 AKTIVNO</span>
                            )}
                        </p>
                        <button onClick={handleViewRegular} className='view-regular-btn'>
                            Pogledaj bez glasanja
                        </button>
                    </div>
                </div>

                <div className='artwork-header'>
                    <div className='artwork-image'>
                        {art?.slika ? (
                            <img src={`${API}${art.slika}`} alt={art.naziv} />
                        ) : (
                            <img src='./../../../back.jpg' alt="Zadana slika" />
                        )}
                    </div>
                    
                    <div className='artwork-info'>
                        <h1 className='artwork-title'>{art?.naziv || "Nepoznat naslov"}</h1>
                        <p className='artwork-category'>{art?.naziv_kategorije || "Nepoznata kategorija"}</p>
                        <p className='artwork-description'>{art?.opis_djela || "Nema opisa"}</p>
                        {art?.id_umjetnika && (
                            <Link to={`/${art.id_umjetnika}/myProfile`} className='artist-link'>
                                <span>Djelo umjetnika </span>
                                <strong>{art?.ime_kor} {art?.prezime}</strong>
                            </Link>
                        )}
                    </div>
                </div>

                {/* Voting Section */}
                {canVote ? (
                    <div className='voting-section'>
                        <div className='rating-section'>
                            <h3>Ocijenite ovaj rad:</h3>
                            <StarRatingComp setGrade={setGrade} compact={true} />
                            <p className='current-rating'>Trenutno odabrana ocjena: <strong>{grade}</strong> / 5</p>
                        </div>
                        
                        <div className='comment-input'>
                            <h4>Dodajte komentar (opciono):</h4>
                            <textarea 
                                rows="6" 
                                type="text"
                                name="description"
                                placeholder="Napišite svoj komentar..."
                                onChange={onChangeComment}
                                value={state.komentar} 
                            />
                            <button className='submit-button' onClick={onClickSubmit}>
                                Pošalji ocjenu
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className='voting-closed'>
                        {!isCompetitionActive ? (
                            <p>📅 <strong>Takmičenje je završeno.</strong> Period glasanja je istekao.</p>
                        ) : state.id_ocenjivaca == idGraded ? (
                            <p>❌ <strong>Ne možete ocijeniti svoj rad.</strong></p>
                        ) : (
                            <p>✅ <strong>Već ste ocijenili ovaj rad.</strong> Hvala vam na učestvovanju!</p>
                        )}
                    </div>
                )}

                <div className='artwork-sections'>
                    <Section title="Ovaj rad je učestvovao na sledećim takmičenjima">
                        <div className='competitions-grid'>
                            {allCompetitions && Array.isArray(allCompetitions) ?  (
                                allCompetitions.map((comp, index) => (
                                    <CompetitionCard key={index} value={comp} />
                                ))
                            ) : (
                                <p className='no-data'>Nema podataka o takmičenjima</p>
                            )}
                        </div>
                    </Section>

                    <Section title="Osvojene nagrade za dati rad">
                        <ul className='awards-list'>
                            {allWonCompetitions && Array.isArray(allWonCompetitions) ?  (
                                allWonCompetitions.map((award, index) => (
                                    <li key={index} className='award-item'>
                                        <span className='trophy'>🏆</span>
                                        {award.ime_nagrade}
                                    </li>
                                ))
                            ) : (
                                <p className='no-data'>Nema osvojenih nagrada</p>
                            )}
                        </ul>
                    </Section>

                    <Section title="Ocjene i komentari korisnika">
                        <div className='comments-section'>
                            {comments && Array.isArray(comments) && comments.length > 0 ?  (
                                comments.map((comment, index) => (
                                    <Comment key={index} info={comment} />
                                ))
                            ) : (
                                <p className='no-comments'>Trenutno nema komentara.</p>
                            )}
                        </div>
                    </Section>
                </div>
            </div>
            <Footer />  

            {/* Toast notifikacija */}
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

const Section = ({ title, children }) => (
    <section className='artwork-section'>
        <h2 className='section-title'>{title}</h2>
        <div className='section-content'>
            {children}
        </div>
    </section>
);

export default ViewForVoting;