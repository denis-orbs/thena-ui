import React from 'react'
import { zeroAddress } from 'viem'

import FarmingItem from './FarmingItem'
import ManualItem from './ManualItem'
import NotStakedItem from './NotStakedItem'
import StakedItem from './StakedItem'
import WeightedItem from './WeightedItem'

function AssetsTable({ positions = [] }) {
  return (
    <div className='w-full rounded-lg max-md:px-0'>
      <div className='hidden items-center justify-between rounded-lg py-2 text-sm font-semibold md:flex md:bg-neutral-800 md:px-4'>
        <span className='w-1/4'>Pair</span>
        <span className='w-1/4'>Range</span>
        <span className='w-1/4'>My APR</span>
        <span className='w-1/4'>My Value</span>
        <span className='w-1/4'>Rewards</span>
        <span className='w-1/4' />
      </div>
      <div className='space-y-8 bg-[url(/images/rewards-claimable-bg.png)] bg-cover bg-top md:space-y-2 md:pt-8'>
        {positions.map((item, index) => (
          <React.Fragment key={`${item.address}-${index}`}>
            {item.type === 'Manual' ? (
              <>{item?.deployer === zeroAddress ? <FarmingItem position={item} /> : <ManualItem position={item} />}</>
            ) : item.tokens && Array.isArray(item.tokens) ? (
              <>
                {item.notStaked && <WeightedItem position={item} isStake={false} />}
                {item.staked && <WeightedItem position={item} isStake />}
              </>
            ) : (
              <>
                {item.account.gaugeBalance.gt(0) && <StakedItem position={item} />}
                {item.account.walletBalance.gt(0) && <NotStakedItem position={item} />}
              </>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}

export default AssetsTable
