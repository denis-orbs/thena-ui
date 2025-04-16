import React from 'react'

import ClaimableRewards from './ClaimableRewards'
import Lock from './Lock'
import Voting from './Voting'
import SpecialDivider from '../SpecialDivider'

function Overview() {
  return (
    <div className='flex gap-4 max-md:flex-col md:grid md:grid-cols-2 xl:grid-cols-3'>
      <div className='order-3 md:order-1'>
        <Voting />
      </div>
      <SpecialDivider className='order-2' />
      <div className='order-1 md:order-2'>
        <ClaimableRewards />
      </div>
      <SpecialDivider className='order-4' />
      <div className='order-5 md:col-span-2 xl:col-span-1'>
        <Lock />
      </div>
    </div>
  )
}

export default Overview
