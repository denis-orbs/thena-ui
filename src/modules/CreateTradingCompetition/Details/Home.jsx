import React from 'react'

import CompetitionCard from '@/app/arena/trading-competitions/[id]/CompetitionCard'
import { DetailTab } from '@/app/arena/trading-competitions/[id]/DetailTab'

function Home({ data, selectedTab, isPreview = false }) {
  return (
    <div>
      <CompetitionCard competition={data} isPreview={isPreview} />
      <DetailTab competition={data} selectedTab={selectedTab} />
    </div>
  )
}

export default Home
