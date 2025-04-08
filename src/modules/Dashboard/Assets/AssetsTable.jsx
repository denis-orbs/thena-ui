import React, { useState } from 'react'
import { zeroAddress } from 'viem'

import { EmphasisButton } from '@/components/buttons/Button'

import FarmingItem from './FarmingItem'
import ManualItem from './ManualItem'
import NotStakedItem from './NotStakedItem'
import StakedItem from './StakedItem'
import WeightedItem from './WeightedItem'

const ITEMS_PER_PAGE = 10
function AssetsTable({ positions = [] }) {
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = Math.ceil(positions.length / ITEMS_PER_PAGE)

  const paginatedPositions = positions.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
  return (
    <div className='w-full rounded-lg max-md:px-0'>
      {/* Header */}
      <div className='hidden items-center justify-between rounded-lg py-2 text-sm font-semibold md:flex md:bg-neutral-800 md:px-4'>
        <span className='w-1/6'>Pair</span>
        <span className='w-1/6'>Range</span>
        <span className='w-1/6'>My APR</span>
        <span className='w-1/6'>My Value</span>
        <span className='w-1/6'>Rewards</span>
        <span className='w-1/6' />
      </div>

      <div className='space-y-8 bg-[url(/images/rewards-claimable-bg.png)] bg-contain bg-no-repeat md:space-y-2 md:pt-8'>
        {paginatedPositions.map((item, index) => (
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

      {totalPages > 1 && (
        <div className='mt-6 flex justify-center gap-2'>
          <EmphasisButton
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className='rounded-md border border-gray-600 px-3 py-1 text-sm text-white disabled:opacity-30'
          >
            Prev
          </EmphasisButton>
          {Array.from({ length: totalPages }, (_, i) => (
            <EmphasisButton
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`rounded-md px-3 py-1 text-sm ${
                currentPage === i + 1 ? 'bg-primary-500 text-black' : 'border border-gray-600 text-white'
              }`}
            >
              {i + 1}
            </EmphasisButton>
          ))}
          <EmphasisButton
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className='rounded-md border border-gray-600 px-3 py-1 text-sm text-white disabled:opacity-30'
          >
            Next
          </EmphasisButton>
        </div>
      )}
    </div>
  )
}

export default AssetsTable
