import React, {useState, useEffect} from 'react'
import Picture from '../Picture';
import Footer from '../Footer';
import './CompetitionTab.css'
import CompetitionCard from '../CompetitionCard';
import { normalizeArray } from '../../utils/normalize'
import {api} from '../../utils/api'
import Toast from '../../Toast'
import { useToast } from '../../ToastContext';

function CompetitionTab() {
    const [competition, setComp] = useState([]);
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState([]);
    const [choice, setChoice] = useState("")
    const [loading, setLoading] = useState(true);
    const [activeDropdown, setActiveDropdown] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: 'error' });
    const API = import.meta.env.VITE_API_URL

    const currentDate = new Date().getTime();
    console.log("DATA TYPE:", typeof competition, competition )

    const activeCompetitions = competition.filter(comp => new Date(comp.datum_kraja).getTime() > currentDate);
    const inactiveCompetitions = competition.filter(comp => new Date(comp.datum_kraja).getTime() <= currentDate);

    const { showToast } = useToast();

    const closeToast = () => {
        setToast({ show: false, message: '', type: 'error' });
    };

    function onChangeSearch(e){
      setSearch(e.target.value);
    }

    const onClickSearch = async(e) => {
      e.preventDefault();
      if (!search.trim()) return;
      
      try{
          const response = await api.get(`${API}/competitions/search/${search}`)
          if (!response.data || response.data.length === 0) {
              showToast("Nema rezultata za vašu pretragu", "info");
          } else {
              setComp(normalizeArray(response.data))
          }
      } catch(error) {
          console.error("Greška pri pretrazi:", error);
          showToast("Greška pri pretrazi takmičenja!", "error");
      }
    }

    const onClickCategory = async(categoryName) => {
      setChoice(categoryName);
      setActiveDropdown(false);
      try{
          const response = await api.get(`${API}/competitions/category/${categoryName}`)
          if (!response.data || response.data.length === 0) {
              showToast(`Nema takmičenja u kategoriji "${categoryName}"`, "info");
          } else {
              setComp(normalizeArray(response.data))
          }   
      } catch(error) {
          console.error("Greška pri učitavanju kategorije:", error);
          showToast("Greška pri učitavanju kategorije!", "error");
      }
    }    

    const resetFilters = async () => {
      try {
          const response = await api.get(`${API}/competitions/`);
          setComp(response.data);
          setSearch("");
          setChoice("");
      } catch (error) {
          console.error('Greška pri resetovanju filtera:', error);
          showToast("Greška pri resetovanju filtera!", "error");
      }
    }

    useEffect(() => {
        const fetchComp = async () => {
            try {
                setLoading(true);
                const [compResponse, categoryResponse] = await Promise.all([
                    api.get(`${API}/competitions/`),
                    api.get(`${API}/category/`)
                ]);
                console.log("DATA TYPE:", typeof compResponse, compResponse.data)
                setComp(compResponse.data);
                setCategory(normalizeArray(categoryResponse.data));
            } catch (error) {
                console.error('Greška u dobavljanju podataka:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchComp();
    },[]);

    if (loading) {
        return (
            <>
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Učitavanje takmičenja...</p>
                </div>
                {toast.show && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
            </>
        );
    }

  return (
    <>
        <div className='comp-container'>
          {/* Sidebar Filter */}
          <div className='filter-sidebar'>
            <div className='filter-header'>
              <h3>Filteri</h3>
              <button onClick={resetFilters} className='reset-btn'>Resetuj</button>
            </div>

            <div className='search-section'>
              <h4>Pretraga</h4>
              <form onSubmit={onClickSearch} className='search-form'>
                <div className='search-input-group'>
                  <input 
                    type='text' 
                    name='search' 
                    placeholder='Unesite naziv takmičenja...' 
                    value={search}
                    onChange={onChangeSearch} 
                  />
                  <button type='submit' className='search-btn'>
                    <span className='search-icon'>🔍</span>
                  </button>
                </div>
              </form>
            </div>

            <div className='category-section'>
              <h4>Kategorije</h4>
              <div className={`dropdown-comp ${activeDropdown ? 'active' : ''}`}>
                <button 
                  className="dropbtn-comp"
                  onClick={() => setActiveDropdown(!activeDropdown)}
                >
                  <span>{choice || "Odaberi kategoriju"}</span>
                  <span className={`dropdown-arrow ${activeDropdown ? 'active' : ''}`}>▼</span>
                </button>
                <div className="dropdown-content-comp">
                  {Array.isArray(category) ? (category.map((cat) => (
                    <button 
                      key={cat.id} 
                      className={`category-btn ${choice === cat.naziv ? 'active' : ''}`}
                      onClick={() => onClickCategory(cat.naziv)}
                    >
                      {cat.naziv}
                    </button>
                  ))):(<p>Nema podataka</p>)}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className='filter-stats'>
              <div className='stat-item'>
                <span className='stat-number'>{activeCompetitions.length}</span>
                <span className='stat-label'>Aktivna</span>
              </div>
              <div className='stat-item'>
                <span className='stat-number'>{inactiveCompetitions.length}</span>
                <span className='stat-label'>Završena</span>
              </div>
              <div className='stat-item'>
                <span className='stat-number'>{competition.length}</span>
                <span className='stat-label'>Ukupno</span>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className='comp-content'>
            {/* Active Competitions */}
            <section className='competitions-section'>
              <div className='section-header'>
                <div className='title-wrapper'>
                  <span className='section-icon'>🏆</span>
                  <h2>Aktivna Takmičenja</h2>
                </div>
                <p className='section-description'>Pridružite se trenutno aktivnim takmičenjima</p>
              </div>

              {activeCompetitions.length === 0 ? (
                <div className='empty-state'>
                  <span className='empty-icon'>📭</span>
                  <h3>Nema aktivnih takmičenja</h3>
                  <p>Trenutno nema dostupnih aktivnih takmičenja.</p>
                </div>
              ) : (
                <div className='comp-grid'>
                  {activeCompetitions.map(filteredCompetition => (
                    <div key={filteredCompetition.id} className='comp-card'>
                      <Picture 
                        src={filteredCompetition.slika ? `${filteredCompetition.slika}`: './../back.jpg'}
                        label={filteredCompetition.naziv_kategorije_t}
                        text={filteredCompetition.opis} 
                        compID={filteredCompetition.id}
                        title={filteredCompetition.naziv_takmicenja}
                        link={`/competition/${filteredCompetition.id}`}
                      /> 
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Inactive Competitions */}
            <section className='competitions-section'>
              <div className='section-header'>
                <div className='title-wrapper'>
                  <span className='section-icon'>📋</span>
                  <h2>Završena Takmičenja</h2>
                </div>
                <p className='section-description'>Pregledajte ranije održana takmičenja</p>
              </div>

              {inactiveCompetitions.length === 0 ? (
                <div className='empty-state'>
                  <span className='empty-icon'>📊</span>
                  <h3>Nema završenih takmičenja</h3>
                  <p>Još uvijek nema završenih takmičenja.</p>
                </div>
              ) : (
                <div className='comp-grid'>
                  {inactiveCompetitions.map(filteredCompetition => (
                    <div key={filteredCompetition.id} className='comp-card'> 
                      <CompetitionCard value={filteredCompetition}/> 
                    </div>
                  ))}
                </div>
              )}
            </section>
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

export default CompetitionTab