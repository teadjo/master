import React, {useState, useEffect} from 'react'
import { Link, useParams } from 'react-router-dom'
import './ViewArtwork.css'
const CompetitionCard = lazy(() => import('../CompetitionCard'));
const Comment = lazy(() => import('./Comment'));
const Footer = lazy(() => import('../Footer'));
import { normalizeArray } from '../../utils/normalize'
import {api} from '../../utils/api'

function ViewArtwork() {
    const {artID} = useParams();
    const [art, setArt] = useState([]);
    const [comments, setComments] = useState([]);
    const [allWonCompetitions, setAllWonCompetitions] = useState([]);
    const [allCompetitions, setAllCompetitions] = useState([]);
    const [loading, setLoading] = useState(true);
    const API = import.meta.env.VITE_API_URL

    useEffect(() => {
        const fetchInfo = async () => {
            try {
                setLoading(true);
                const [artworkRes, gradesRes, compRes, specRes] = await Promise.all([
                    api.get(`${API}/artworks/artwork/${artID}`),
                    api.get(`${API}/grades/artID/${artID}`),
                    api.get(`${API}/aua/artwork/${artID}`),
                    api.get(`${API}/spec/tra/${artID}`)
                ]);

                setArt(artworkRes.data[0]);
                setComments(normalizeArray(gradesRes.data));
                setAllWonCompetitions(normalizeArray(compRes.data));
                setAllCompetitions(normalizeArray(specRes.data));

            } catch (err) {
                console.log("Greška u dobavljanju podataka!",err)
            } finally {
                setLoading(false);
            }
        }
        fetchInfo();
    }, [artID]);

    if (loading) {
        return <div className="loading">Učitavanje...</div>;
    }

    return (
        <>
            <div className='artwork-container'>
                <div className='artwork-header'>
                    <div className='artwork-image'>
                        {art.slika ? (
                            <img loading='eager' fetchPriority="high" src={`${API}${art.slika}`} alt={art.naziv} />
                        ) : (
                            <img loading='eager' fetchPriority="high" src='./../../../back.jpg' alt="Zadana slika" />
                        )}
                    </div>
                    
                    <div className='artwork-info'>
                        <h1 className='artwork-title'>{art.naziv}</h1>
                        <p className='artwork-category'>{art.naziv_kategorije}</p>
                        <p className='artwork-description'>{art.opis_djela}</p>
                        <Link to={`/${art.id_umjetnika}/myProfile`} className='artist-link'>
                            <span>Djelo umjetnika </span>
                            <strong>{art.ime_kor} {art.prezime}</strong>
                        </Link>
                    </div>
                </div>

                <div className='artwork-sections'>
                    <Section title="Ovaj rad je učestvovao na sledećim takmičenjima">
                        <div className='competitions-grid'>
                            {Array.isArray(allCompetitions) ? (allCompetitions.map((comp, index) => (
                                <CompetitionCard key={index} value={comp} />
                            ))):(<p>Nema podataka</p>)}
                        </div>
                    </Section>

                    <Section title="Osvojene nagrade za dati rad">
                        <ul className='awards-list'>
                            {Array.isArray(allWonCompetitions) ? (allWonCompetitions.map((comp, index) => (
                                <li key={index} className='award-item'>
                                    <span className='trophy'>🏆</span>
                                    {comp.ime_nagrade}
                                </li>
                            ))):(<p>Nema podataka</p>)}
                        </ul>
                    </Section>

                    <Section title="Ocjene i komentari korisnika">
                        <div className='comments-section'>
                            {Array.isArray(comments) ?  (
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

export default ViewArtwork