import React, { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useParams } from 'react-router-dom';
import './Apply.css';
import Picture from '../Picture';
const ApplyForm = React.lazy(() => import('./ApplyForm'));
const Footer = React.lazy(() => import('../Footer'));
import { normalizeArray } from '../../utils/normalize';
import { api } from '../../utils/api';

function Apply() {
    const { id } = useParams();
    const [comp, setComp] = useState(null);
    const [competitors, setCompetitors] = useState([]);
    const [form, setForm] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const currentDate = new Date().getTime();
    const active = comp?.datum_kraja && new Date(comp.datum_kraja) > currentDate;
    const ended = comp?.datum_kraja && new Date(comp.datum_kraja) <= currentDate;
    const [grades, setGrades] = useState([]);
    const [winner, setWinner] = useState(null);
    const [winnerData, setWinnerData] = useState(null);
    const [results, setResults] = useState({});
    const API = import.meta.env.VITE_API_URL;

    const scoreMap = useMemo(() => {
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
            setIsLoading(true);
            try {
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
                setGrades(scoresData);

                const newScoreMap = scoresData.reduce((acc, grade) => {
                    acc[grade.id_rada] = (acc[grade.id_rada] || 0) + grade.ocjena;
                    return acc;
                }, {});
                
                setResults(newScoreMap);
                const maxWinnerKey = findMax(newScoreMap);
                setWinner(maxWinnerKey);

                if (maxWinnerKey) {
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
            } finally {
                setIsLoading(false);
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
    
    const daysSinceEnded = comp?.datum_kraja && ended ?
        Math.ceil((currentDate - new Date(comp.datum_kraja)) / 86400000) : 0;

    // Računanje statistike za pobjednika
    const totalVotes = Object.values(results).reduce((a, b) => a + b, 0);
    const winnerScore = winner ? results[winner] : 0;
    const winnerPercentage = totalVotes > 0 && winnerScore ? Math.round((winnerScore / totalVotes) * 100) : 0;

    return (
        <>
            <div className='competition-container'>
                {/* Hero Section */}
                <div className='competition-hero'>
                    <div className='hero-content'>
                        <div className='hero-badge'>
                            {active && <span className='live-badge'>🔴 U TOKU</span>}
                            {ended && <span className='ended-badge'>🏁 ZAVRŠENO</span>}
                        </div>
                        <h1 className='competition-title1'>{comp?.naziv_takmicenja}</h1>
                        <p className='competition-description1'>{comp?.opis}</p>
                    </div>
                </div>

                {/* ========== AKTIVNO TAKMIČENJE ========== */}
                {active && (
                    <>
                        {/* Stats Section */}
                        <section className='competition-stats-section'>
                            <div className='stats-grid'>
                                <div className='stat-card'>
                                    <div className='stat-icon'>🎨</div>
                                    <div className='stat-number'>{competitors.length}</div>
                                    <div className='stat-label'>Prijavljenih radova</div>
                                </div>
                                <div className='stat-card highlight'>
                                    <div className='stat-icon'>⏳</div>
                                    <div className='stat-number'>{daysLeft}</div>
                                    <div className='stat-label'>Preostalih dana</div>
                                    <div className='stat-deadline'>
                                        Rok: {new Date(comp?.datum_kraja).toLocaleDateString()}
                                    </div>
                                </div>
                                <div className='stat-card'>
                                    <div className='stat-icon'>💰</div>
                                    <div className='stat-number'>{comp?.svota || 0}€</div>
                                    <div className='stat-label'>Nagradni fond</div>
                                </div>
                            </div>
                            
                            <div className='cta-banner'>
                                <div className='cta-content'>
                                    <div className='cta-icon-wrapper'>
                                        <span className='cta-emoji'>🚀</span>
                                    </div>
                                    <div className='cta-text'>
                                        <h3>Vaš rad čeka na vas!</h3>
                                        <p>Prijavite se i osvojite {comp?.svota}€ + priliku za izlaganje</p>
                                    </div>
                                    <button onClick={onClickApply} className='cta-button primary'>
                                        Prijavi se odmah →
                                    </button>
                                </div>
                            </div>
                        </section>

                        {/* Instructions Section */}
                        <section className='instructions-section'>
                            <div className='instructions-header'>
                                <h2>📝 Kako učestvovati?</h2>
                                <p>Pridružite se na desetine umjetnika iz cijele regije</p>
                            </div>
                            <div className='steps-grid'>
                                <div className='step-card'>
                                    <div className='step-number'>01</div>
                                    <div className='step-icon'>📝</div>
                                    <h3>Prijavite se</h3>
                                    <p>Kliknite na dugme "Prijavi se" i popunite jednostavnu formu</p>
                                </div>
                                <div className='step-card'>
                                    <div className='step-number'>02</div>
                                    <div className='step-icon'>🖼️</div>
                                    <h3>Postavite rad</h3>
                                    <p>Otpremite fotografiju vašeg rada i dodajte kreativni opis</p>
                                </div>
                                <div className='step-card'>
                                    <div className='step-number'>03</div>
                                    <div className='step-icon'>⭐</div>
                                    <h3>Osvojite nagrade</h3>
                                    <p>Stručni žiri ocjenjuje, a pobjednike čekaju vrijedne nagrade</p>
                                </div>
                            </div>
                        </section>

                        {/* Competitors Section - prijavljeni radovi */}
                        <section className='competitors-section'>
                            <div className='section-header'>
                                <h2>🌟 Prijavljeni radovi</h2>
                                <p>Trenutno {competitors.length} umjetnika dijeli svoju kreativnost</p>
                            </div>
                            
                            {isLoading ? (
                                <div className='loading-grid'>
                                    {[...Array(6)].map((_, i) => (
                                        <div key={i} className='skeleton-card'>
                                            <div className='skeleton-image'></div>
                                            <div className='skeleton-content'>
                                                <div className='skeleton-title'></div>
                                                <div className='skeleton-text'></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : competitors.length > 0 ? (
                                <div className='competitors-grid'>
                                    {competitors.map((art, index) => (
                                        <div key={art.id} className='competitor-card'>
                                            <Picture 
                                                src={art.slika ? `${art.slika}` : './../../back.jpg'}
                                                label={art.naziv_kategorije}
                                                text={art.opis_djela}
                                                title={art.naziv} 
                                                link={`/competition/${id}/${art.id_rada_tr}/myprofile`}
                                                priority={index < 2}
                                            />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className='empty-competitors'>
                                    <div className='empty-icon'>🎨</div>
                                    <h3>Još nema prijavljenih radova</h3>
                                    <p>Budite prvi koji će prijaviti svoj rad!</p>
                                    <button onClick={onClickApply} className='empty-cta'>Prijavite se →</button>
                                </div>
                            )}
                        </section>
                    </>
                )}

                {/* ========== ZAVRŠENO TAKMIČENJE ========== */}
                {ended && (
                    <>
                        {/* Results Summary Section */}
                        <section className='results-summary-section'>
                            <div className='results-header'>
                                <h2>📊 Konačni rezultati</h2>
                                <p>Takmičenje je završeno {daysSinceEnded} dana</p>
                            </div>
                            
                            <div className='results-stats-grid'>
                                <div className='result-stat-card'>
                                    <div className='result-icon'>🏆</div>
                                    <div className='result-number'>{competitors.length}</div>
                                    <div className='result-label'>Ukupno prijavljenih</div>
                                </div>
                                <div className='result-stat-card'>
                                    <div className='result-icon'>⭐</div>
                                    <div className='result-number'>{totalVotes}</div>
                                    <div className='result-label'>Ukupno glasova</div>
                                </div>
                                <div className='result-stat-card'>
                                    <div className='result-icon'>🎯</div>
                                    <div className='result-number'>{winnerPercentage}%</div>
                                    <div className='result-label'>Pobjednički rezultat</div>
                                </div>
                            </div>
                        </section>

                        {/* Winner Section - proširena */}
                        {winnerData && (
                            <section className='winner-section-detailed'>
                                <div className='winner-crown'>👑</div>
                                <div className='winner-header'>
                                    <h2>Pobjednik takmičenja</h2>
                                    <p>Čestitamo pobjedniku na osvojenoj nagradi!</p>
                                </div>
                                <div className='winner-showcase'>
                                    <div className='winner-image-large'>
                                        <img 
                                            src={winnerData.slika ? `${API}${winnerData.slika}` : './../../../back.jpg'}
                                            alt={winnerData.naziv}
                                            className='winner-artwork'
                                        />
                                        <div className='winner-score-badge'>
                                            <span>{winnerScore} bodova</span>
                                        </div>
                                    </div>
                                    <div className='winner-details'>
                                        <h3>{winnerData.ime_kor} {winnerData.prezime}</h3>
                                        <p className='winner-artwork-title'>"{winnerData.naziv}"</p>
                                        <div className='winner-meta'>
                                            <span className='winner-category-badge'>{winnerData.naziv_kategorije}</span>
                                            <span className='winner-score'>🏆 {winnerScore} bodova</span>
                                        </div>
                                        <p className='winner-bio'>{winnerData.opis_djela}</p>
                                        <div className='winner-prize'>
                                            <span>🎁 Osvojeno:</span>
                                            <strong>{comp?.svota}€ + Izlaganje u galeriji</strong>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* All Submissions Section - svi radovi za pregled */}
                        <section className='all-submissions-section'>
                            <div className='section-header'>
                                <h2>🖼️ Svi prijavljeni radovi</h2>
                                <p>Pogledajte sve radove koji su učestvovali na takmičenju</p>
                            </div>
                            
                            {isLoading ? (
                                <div className='loading-grid'>
                                    {[...Array(6)].map((_, i) => (
                                        <div key={i} className='skeleton-card'>
                                            <div className='skeleton-image'></div>
                                            <div className='skeleton-content'>
                                                <div className='skeleton-title'></div>
                                                <div className='skeleton-text'></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : competitors.length > 0 ? (
                                <div className='competitors-grid'>
                                    {competitors.map((art) => (
                                        <div key={art.id} className='competitor-card submission-card'>
                                            <Picture 
                                                src={art.slika ? `${art.slika}` : './../../back.jpg'}
                                                label={art.naziv_kategorije}
                                                text={art.opis_djela}
                                                title={art.naziv} 
                                                link={`/artwork/${art.id_rada_tr}/profile`}
                                            />
                                            {results[art.id_rada_tr] && (
                                                <div className='submission-score'>
                                                    <span>⭐ {results[art.id_rada_tr]} bodova</span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className='empty-competitors'>
                                    <div className='empty-icon'>📭</div>
                                    <h3>Nema prijavljenih radova</h3>
                                    <p>Ovo takmičenje je završeno bez prijava</p>
                                </div>
                            )}
                        </section>
                    </>
                )}

                {/* Awards Section - uvijek vidljiva */}
                <section className='awards-section'>
                    <div className='section-header'>
                        <h2>🎁 Nagrade</h2>
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

                {/* Call to Action - samo ako je aktivno */}
                {active && (
                    <section className='bottom-cta-section'>
                        <div className='bottom-cta'>
                            <h3>Spremni za pobjedu?</h3>
                            <p>Pridružite se i osvojite vrijedne nagrade</p>
                            <button onClick={onClickApply} className='bottom-cta-btn'>
                                Prijavite se sada 🚀
                            </button>
                        </div>
                    </section>
                )}
            </div>
            
            {form && (
                <Suspense fallback={<div className='form-loader'>Učitavanje forme...</div>}>
                    <ApplyForm closeForm={() => setForm(false)} />
                </Suspense>
            )}
            
            <Suspense fallback={<div className='footer-loader'></div>}>
                <Footer />
            </Suspense>
        </>
    );
}

export default Apply;