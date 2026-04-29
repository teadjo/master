import React from 'react'
import './Stars.css'
import { FaStar} from 'react-icons/fa'

function Stars(props) {
  return (
    <div className='stars'>
    {[...Array(5)].map((star, i) => {
        const ratingVal = i+1;
        return  <FaStar className='star'
                    color={ratingVal <= (props.grade) ? "#ffc107" : "#808080"}
                    size={15} />    
    })}
    </div>
  )
}

export default Stars
