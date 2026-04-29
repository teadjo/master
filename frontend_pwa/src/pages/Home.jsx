import React from 'react'
import HomeComp from '../components/HomeComp'
import Cards from '../components/Cards';
import Footer from '../components/Footer';

function Home() {
  console.log(localStorage.getItem('notlogedIn'));
  return (
    
    <div>
      <HomeComp />
      <Cards />
      <Footer />
    </div>
  )
}

export default Home;
