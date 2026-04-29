import React, {useState} from 'react'
import { FaStar} from 'react-icons/fa'
import './StarRatingComp.css'

function StarRatingComp(props) {
    const [rating, setRating] = useState(null);
    const [hover, setHover] = useState(null);

    // Props za kontrolu veličine i kompaktnost
    const starSize = props.size || 60;
    const isCompact = props.compact || false;

  return (
    <div className={`star-rating-container ${isCompact ? 'compact' : ''}`}>
      <div className='stars-wrapper'>
        <div className={`stars ${isCompact ? 'compact-stars' : ''}`}>
            {[...Array(5)].map((star, i) => {
                const ratingVal = i + 1;
                return (
                  <label key={i} className='star-label'>
                      <input 
                        type='radio' 
                        name='rating' 
                        value={ratingVal} 
                        onClick={() => {
                          setRating(ratingVal)
                          props.setGrade(ratingVal);
                        }}
                      />
                      <FaStar 
                        className='star'
                        color={ratingVal <= (hover || rating) ? "#FFD700" : "#E0E0E0"}
                        onMouseEnter={() => setHover(ratingVal)}
                        onMouseLeave={() => setHover(null)}
                        size={starSize} 
                      />
                  </label>
                )
            })}
        </div>
        
        {/* Rating Text Display - sakriva se u kompaktnom modu */}
        {!isCompact && (
          <div className='rating-text'>
            {rating ? (
              <span className='selected-rating'>
                Ocjenili ste sa <span className='rating-number'>{rating}</span> {rating === 1 ? 'zvjezdicom' : rating < 5 ? 'zvjezdice' : 'zvjezdica'}
              </span>
            ) : (
              <span className='placeholder-text'>Izaberite ocjenu</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default StarRatingComp