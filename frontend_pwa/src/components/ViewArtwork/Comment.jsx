import React from 'react'
import './Comment.css'
import Stars from './Stars'

function Comment(props) {
  return (
    <div className='whole'>
    <div className='comment-container'>
      <p>Korisnik{props.info.id_ocenjivaca} kaže:</p>
      <p>{props.info.komentar}</p>
      <Stars grade={props.info.ocjena} />
    </div>
    </div>
  )
}

export default Comment
