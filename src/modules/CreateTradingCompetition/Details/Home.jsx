import React from 'react'

import CompetitionCard from '@/app/arena/trading-competitions/[id]/CompetitionCard'
import CompetitionDetail from '@/app/arena/trading-competitions/[id]/CompetitionDetail'

function Home({ data }) {
  return (
    <div className='w-full'>
      <CompetitionCard competition={data} />
      <CompetitionDetail competition={data} isPreview />
    </div>
  )
}

export default Home
