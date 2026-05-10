import React, {useState, useEffect} from 'react'
import { useParams } from 'react-router-dom'
import Picture from '../Picture'
import './ArtworksByCategory.css'
import Footer from '../Footer'
import Pagination from '../Pagination'
import { normalizeArray } from '../../utils/normalize'
import {api} from '../../utils/api'

function ArtworksByCategory() {
    const {category} = useParams();
    const [art, setArt] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [imagesPerPage] = useState(16);
    const [loading, setLoading] = useState(true);
    const API = import.meta.env.VITE_API_URL

    useEffect(() => {
        const fetchArt = async () => {
            try{
                setLoading(true);
                const artwork = await api.get(`${API}/artworks/category/${category}`);
                setArt(normalizeArray(artwork.data));
            }
            catch (error){
                console.error('Greška u dobavljanju slika:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchArt();
    }, [category]);

    const indexOfLast = currentPage * imagesPerPage;
    const indexOfFirst = indexOfLast - imagesPerPage;
    const currentImages = art.slice(indexOfFirst, indexOfLast);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    return (
        <div className="artworks-page">
            <div className='artworks-container'>
                {/* Hero Header */}
                <div className='category-hero'>
                    <div className='hero-content'>
                        <h1 className='category-title'>{category}</h1>
                        <p className='category-subtitle'>
                            {art.length} {art.length === 1 ? 'umjetničko djelo' : 
                                        art.length < 5 ? 'umjetnička djela' : 'umjetničkih djela'} u ovoj kategoriji
                        </p>
                    </div>
                </div>

                {/* Artworks Grid */}
                {loading ? (
                    <div className="loading-section">
                        <div className="loading-spinner"></div>
                        <p>Učitavanje umjetničkih djela...</p>
                    </div>
                ) : (
                    <>
                        {Array.isArray(art) ?   (
                            <div className='artworks-grid'>
                                {currentImages.map((art) => (
                                    <div key={art.id} className='artwork-card-wrapper'>
                                        <Picture 
                                            src={art.slika ? `${art.slika}`: './../../back.jpg'}
                                            label={art.naziv_kategorije}
                                            text={art.opis_djela}
                                            title={art.naziv} 
                                            link={`/artwork/${art.id}/profile/`}
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className='empty-state'>
                                <div className='empty-icon'>🎨</div>
                                <h3>Nema umjetničkih djela u ovoj kategoriji</h3>
                                <p>Budite prvi koji će dodati djelo u {category} kategoriju!</p>
                            </div>
                        )}

                        {/* Pagination */}
                        {art.length > imagesPerPage && (
                            <div className='pagination-section'>
                                <Pagination
                                    imagesPerPage={imagesPerPage}
                                    totalImages={art.length}
                                    paginate={paginate}
                                    currentPage={currentPage}
                                />
                            </div>
                        )}
                    </>
                )}
            </div>
            <Footer />
        </div>
    )
}

export default ArtworksByCategory