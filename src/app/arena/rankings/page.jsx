import React from 'react'

import TopCompetition from './TopCompetition'

function RankingPage() {
  return (
    <div className='mt-6 grid grid-cols-12 gap-4 lg:gap-12'>
      <div className='col-span-12 lg:col-span-7'>
        <div className='flex justify-between'>
          <h2>Rankings</h2>
        </div>
      </div>
      <TopCompetition />
    </div>
  )
}

export default RankingPage
