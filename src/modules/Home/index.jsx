import React from 'react'

import Build from './Build'
import Community from './Community'
import Ecosystem from './Ecosystem'
import Hero from './Hero'
import Scenes from './Scenes'
import Stats from './Stats'
import Updates from './Updates'

function Home() {
  return (
    <>
      <Hero />
      <Stats />
      <Ecosystem />
      <Scenes />
      <Build />
      <Updates />
      <Community />
    </>
  )
}

export default Home
