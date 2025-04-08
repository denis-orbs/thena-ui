import React from 'react'

import ClaimableRewards from './ClaimableRewards'
import Lock from './Lock'
import Voting from './Voting'

function Overview() {
  return (
    <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
      <div className='order-2 md:order-1'>
        <Voting />
      </div>
      <div className='order-1 md:order-2'>
        <ClaimableRewards />
      </div>
      <div className='order-3'>
        <Lock />
      </div>
    </div>
  )
}

export default Overview
