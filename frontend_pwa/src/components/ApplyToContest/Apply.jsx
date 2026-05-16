import React, { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useParams } from 'react-router-dom';
import './Apply.css';
import Picture from '../Picture';
const ApplyForm = React.lazy(() => import('./ApplyForm'));
import Footer from '../Footer';
import { normalizeArray } from '../../utils/normalize';
import { api } from '../../utils/api';

function Apply() {
    const { id } = useParams();
    const [comp, setComp] = useState(null);
    const [competitors, setCompetitors] = useState([]);
    const [form, setForm] = useState(false);
    const currentDate = new Date().getTime();
    const active = comp?.datum_kraja && new Date(comp.datum_kraja) > currentDate;
    const [grades, setGrades] = useState([]);
    const [winner, setWinner] = useState(null);
    const [winnerData, setWinnerData] = useState(null);
    const [results, setResults] = useState({});
    const API = import.meta.env.VITE_API_URL;

    // ✅ useMemo se sada pravilno računa kada se grades promijeni
    const scoreMap = useMemo(() => {
        console.log('Recalculating scoreMap with grades:', grades.length);
        return grades.reduce((acc, grade) => {
            acc[grade.id_rada] = (acc[grade.id_rada] || 0) + grade.ocjena;
            return acc;
        }, {});
    }, [grades]);

    function findMax(obj) {
        if (Object.keys(obj).length === 0) return null;
        let maxKey = null;
        let maxValue = -1;
        for (const [key, value] of Object.entries(obj)) {
            if (value > maxValue) {
                maxValue = value;
                maxKey = key;
            }
        }
        return maxKey;
    }

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                // ✅ Paralelni API pozivi
                const [compRes, artRes, scoresRes] = await Promise.all([
                    api.get(`${API}/competitions/compID/${id}`),
                    api.get(`${API}/spec/tr/${id}`),
                    api.get(`${API}/grades/kmp/${id}`)
                ]);

                const compData = compRes.data[0];
                const artData = normalizeArray(artRes.data);
                const scoresData = scoresRes.data;

                setComp(compData);
                setCompetitors(artData);
                setGrades(scoresData); // Ovo triggera useMemo

                // ✅ Računamo scoreMap direktno sa scoresData (ne čekamo state)
                const newScoreMap = scoresData.reduce((acc, grade) => {
                    acc[grade.id_rada] = (acc[grade.id_rada] || 0) + grade.ocjena;
                    return acc;
                }, {});
                
                setResults(newScoreMap);
                const maxWinnerKey = findMax(newScoreMap);
                setWinner(maxWinnerKey);

                if (maxWinnerKey) {
                    // ✅ Popravljeno: koristi artData umjesto ArtInComp
                    const winnerInfo = artData.find(item => item.id_rada_tr == maxWinnerKey);
                    setWinnerData(winnerInfo);

                    const competitionEnded = compData.datum_kraja && 
                        new Date(compData.datum_kraja) <= currentDate;

                    if (competitionEnded && winnerInfo) {
                        try {
                            const existingAward = await api.get(`${API}/aua/check/${winnerInfo.id_rada_tr}/${id}`);
                            if (!existingAward.data) {
                                await api.post(`${API}/aua/`, {
                                    id_umjetnika_okn: winnerInfo.id_umjetnika,
                                    id_rada_okn: winnerInfo.id_rada_tr,
                                    ime_nagrade: compData.ime,
                                    id_takmicenja_okn: winnerInfo.id_takmicenja_tr
                                });
                                console.log('Nagrada uspješno dodijeljena');
                            }
                        } catch (error) {
                            console.log('Greška sa nagradom:', error);
                        }
                    }
                }
            } catch (error) {
                console.error('Error fetching competition:', error);
            }
        };

        fetchAllData();
    }, [id, API]);

    const onClickApply = useCallback((e) => {
        e.preventDefault();
        requestAnimationFrame(() => setForm(prev => !prev));
    }, []);

    const daysLeft = comp?.datum_kraja ? 
        Math.ceil((new Date(comp.datum_kraja) - currentDate) / 86400000) : 0;

    return (
        <>
            <div className='competition-container'>
                {/* Hero Section */}
                <div className='competition-hero'>
                    <div className='hero-content'>
                        <h1 className='competition-title1'>{comp?.naziv_takmicenja}</h1>
                        <p className='competition-description1'>{comp?.opis}</p>
                        
                        {active && (
                            <div className='competition-status'>
                                <div className='status-badge active'>
                                    <span className='status-icon'>⏳</span>
                                    Aktivno
                                </div>
                                <p className='days-left'>Ostalo još {daysLeft} dana - ne propustite priliku!</p>
                                <button onClick={onClickApply} className='apply-btn'>
                                    <span className='btn-icon'>🚀</span>
                                    Prijavi se
                                </button>
                            </div>
                        )}
                        
                        {!active && comp?.datum_kraja && (
                            <div className='competition-status'>
                                <div className='status-badge ended'>
                                    <span className='status-icon'>🏁</span>
                                    Završeno
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Apply Form Modal - Suspense za lazy loading */}
                {form && (
                    <Suspense fallback={<div>Loading form...</div>}>
                        <ApplyForm closeForm={() => setForm(false)} />
                    </Suspense>
                )}

                {/* Competitors Section */}
                <section className='competitors-section'>
                    <div className='section-header'>
                        <h2>Učesnici Takmičenja</h2>
                        <p>Pogledajte sve radove prijavljene na ovo takmičenje</p>
                    </div>
                    
                    {competitors.length > 0 ? (
                        <div className='competitors-grid'>
                            {competitors.map((art) => (
                                <div key={art.id} className='competitor-card'>
                                    <Picture 
                                        src={art.slika ? `${art.slika}` : './../../back.jpg'}
                                        label={art.naziv_kategorije}
                                        text={art.opis_djela}
                                        title={art.naziv} 
                                        link={active ? `/competition/${id}/${art.id_rada_tr}/myprofile` : `/artwork/${art.id_rada_tr}/profile`}
                                    />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className='empty-competitors'>
                            <div className='empty-icon'>🎨</div>
                            <h3>Još nema prijavljenih radova</h3>
                            <p>Budite prvi koji će prijaviti svoj rad!</p>
                        </div>
                    )}
                </section>

                {/* Winner Section - BEZ loading="lazy" za pobjednika */}
                {!active && winnerData && (
                    <section className='winner-section'>
                        <div className='section-header'>
                            <h2>🏆 Pobjednik Takmičenja</h2>
                            <p>Čestitamo pobjedniku!</p>
                        </div>
                        <div className='winner-content-simple'>
                            <div className='winner-image-container'>
                                <img 
                                    fetchPriority="high"  // ✅ Dodato za LCP
                                    src={winnerData.slika ? `${API}${winnerData.slika}` : './../../../back.jpg'}
                                    alt={winnerData.naziv}
                                    className='winner-image'
                                />
                            </div>
                            <div className='winner-info-simple'>
                                <h3>{winnerData.ime_kor} {winnerData.prezime}</h3>
                                <p className='winner-work'>Pobjednički rad: <strong>{winnerData.naziv}</strong></p>
                                <p className='winner-category'>Kategorija: {winnerData.naziv_kategorije}</p>
                                <p className='winner-description'>{winnerData.opis_djela}</p>
                            </div>
                        </div>
                    </section>
                )}
                
                {/* Awards Section */}
                <section className='awards-section'>
                    <div className='section-header'>
                        <h2>Nagrade</h2>
                        <p>Šta možete osvojiti na ovom takmičenju</p>
                    </div>
                    
                    <div className='awards-grid'>
                        <div className='award-card first-place'>
                            <div className='award-icon'>🥇</div>
                            <div className='award-content'>
                                <h3>Prvo Mjesto</h3>
                                <div className='award-prize'>{comp?.svota}€</div>
                                <p className='award-name'>{comp?.ime}</p>
                            </div>
                        </div>
                        
                        <div className='award-card second-place'>
                            <div className='award-icon'>🥈</div>
                            <div className='award-content'>
                                <h3>Drugo Mjesto</h3>
                                <div className='award-prize'>Izlaganje</div>
                                <p>Mogućnost izlaganja radova u našoj galeriji</p>
                            </div>
                        </div>
                        
                        <div className='award-card third-place'>
                            <div className='award-icon'>🥉</div>
                            <div className='award-content'>
                                <h3>Treće Mjesto</h3>
                                <div className='award-prize'>Saradnja</div>
                                <p>Buduća saradnja sa ArtConnection platformom</p>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
            <Footer />
        </>
    );
}

export default Apply;