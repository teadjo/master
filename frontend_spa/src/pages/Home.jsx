import React, {lazy} from 'react'
const HomeComp = lazy(() => import('../components/HomeComp'));
const Cards = lazy(() => import('../components/Cards'));
const Footer = lazy(() => import('../components/Footer'));

function Home() {
  return (
    
    <div>
      <HomeComp />
      <Cards />
      <Footer />
    </div>
  )
}

export default Home;
