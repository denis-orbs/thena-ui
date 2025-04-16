import React, { useState } from 'react'
import { zeroAddress } from 'viem'

import { cn } from '@/lib/utils'
import { ArrowLeftIcon, ArrowRightIcon } from '@/svgs'

import FarmingItem from './FarmingItem'
import ManualItem from './ManualItem'
import NotStakedItem from './NotStakedItem'
import StakedItem from './StakedItem'
import WeightedItem from './WeightedItem'

function PaginateButton({ children, onClick, disabled, active, className }) {
  return (
    <div
      onClick={() => !disabled && onClick()}
      disabled={disabled}
      className={cn(
        'flex h-8 w-fit min-w-8 items-center justify-center stroke-neutral-300 px-[2px] text-neutral-300',
        'hover:bg-neutral-700 hover:stroke-neutral-200 hover:text-neutral-200',
        'outline outline-2 outline-offset-4 outline-transparent',
        'cursor-pointer rounded transition-all duration-150 ease-out',
        'text-sm',
        active && 'bg-neutral-800',
        className,
      )}
    >
      {children}
    </div>
  )
}

const ITEMS_PER_PAGE = 10
function AssetsTable({ positions = [] }) {
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = Math.ceil(positions.length / ITEMS_PER_PAGE)

  const paginatedPositions = positions.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
  return (
    <div className='w-full rounded-lg max-md:px-0'>
      {/* Header */}
      <div className='hidden rounded-lg md:bg-neutral-800 lg:flex lg:px-4'>
        <div className='flex w-full flex-row items-center justify-between gap-4 rounded-lg py-2 text-sm font-semibold'>
          {/* flex flex-col items-center justify-between gap-4 py-4 lg:flex-row lg:py-2 */}
          <span className='w-[20%] px-4 lg:min-w-[195px]'>Pair</span>
          <span className='min-w-[146px] px-4 lg:w-[17%]'>Range</span>
          <span className='w-[13%] px-4'>My APR</span>
          <span className='w-[13%] px-4'>My Value</span>
          <span className='w-[13%] px-4'>Rewards</span>
          <span className='w-[24%] max-w-[269px]' />
        </div>
      </div>

      <div className='bg-opacity-50 bg-[url(/images/rewards-claimable-bg.png)] bg-contain bg-no-repeat max-lg:space-y-2 lg:px-4 lg:pt-8'>
        {paginatedPositions.map((item, index) =>
          item.type === 'Manual' ? (
            <React.Fragment key={`${item.address}-${index}`}>
              {item?.deployer === zeroAddress ? <FarmingItem position={item} /> : <ManualItem position={item} />}
            </React.Fragment>
          ) : (
            <React.Fragment key={`${item.address}-${index}`}>
              {item.tokens && Array.isArray(item.tokens) ? (
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
          ),
        )}
      </div>

      {totalPages > 1 && (
        <div className='mb-1 mt-6 flex justify-center gap-2 md:justify-end'>
          <PaginateButton
            onClick={() => setCurrentPage(prev => Math.min(prev - 1, 1))}
            disabled={currentPage === 1}
            className={cn(
              currentPage === 1 && 'cursor-not-allowed hover:bg-inherit active:outline-none active:outline-transparent',
            )}
          >
            <ArrowLeftIcon className='size-4' />
          </PaginateButton>
          {totalPages < 6 &&
            new Array(totalPages).fill(0).map((item, idx) => (
              <PaginateButton
                key={`paginate-${idx}`}
                active={currentPage === idx + 1}
                onClick={() => {
                  setCurrentPage(idx + 1)
                }}
              >
                {idx + 1}
              </PaginateButton>
            ))}
          {totalPages >= 6 && (
            <>
              <PaginateButton
                active={currentPage === 1}
                onClick={() => {
                  setCurrentPage(1)
                }}
              >
                1
              </PaginateButton>
              <PaginateButton
                active={currentPage === 2}
                onClick={() => {
                  setCurrentPage(2)
                }}
              >
                2
              </PaginateButton>
              {currentPage > 3 && (
                <PaginateButton
                  onClick={() => {
                    setCurrentPage(currentPage > 3 ? currentPage - 1 : currentPage + 1)
                  }}
                >
                  ...
                </PaginateButton>
              )}
              {currentPage > 2 && currentPage < totalPages - 1 && (
                <PaginateButton
                  active
                  onClick={() => {
                    setCurrentPage(currentPage)
                  }}
                >
                  {currentPage}
                </PaginateButton>
              )}
              {currentPage < totalPages - 2 && (
                <PaginateButton
                  onClick={() => {
                    setCurrentPage(currentPage > totalPages - 2 ? currentPage - 1 : currentPage + 1)
                  }}
                >
                  ...
                </PaginateButton>
              )}
              <PaginateButton
                active={currentPage === totalPages - 1}
                onClick={() => {
                  setCurrentPage(totalPages - 1)
                }}
              >
                {totalPages - 1}
              </PaginateButton>
              <PaginateButton
                active={currentPage === totalPages}
                onClick={() => {
                  setCurrentPage(totalPages)
                }}
              >
                {totalPages}
              </PaginateButton>
            </>
          )}
          <PaginateButton
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className={cn(
              currentPage === totalPages &&
                'cursor-not-allowed hover:bg-inherit active:outline-none active:outline-transparent',
            )}
          >
            <ArrowRightIcon className='size-4' />
          </PaginateButton>
        </div>
      )}
    </div>
  )
}

export default AssetsTable
