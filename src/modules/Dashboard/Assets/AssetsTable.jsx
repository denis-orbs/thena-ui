import React, { useEffect, useMemo, useRef, useState } from 'react'
import { zeroAddress } from 'viem'

import useWallet from '@/hooks/useWallet'

import FarmingItem from './FarmingItem'
import ManualItem from './ManualItem'
import NotStakedItem from './NotStakedItem'
import Paginates from './Paginates'
import StakedItem from './StakedItem'
import WeightedItem from './WeightedItem'

const ITEMS_PER_PAGE = 10

function AssetsTable({ positions = [] }) {
  const { account, chainId } = useWallet()
  const accountRef = useRef(account)
  const chainIdRef = useRef(chainId)

  const [itemPerPage, setItemPerPage] = useState(ITEMS_PER_PAGE)
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = useMemo(() => Math.ceil(positions.length / itemPerPage), [positions.length, itemPerPage])

  const paginatedPositions = useMemo(() => {
    const start = (currentPage - 1) * itemPerPage
    return positions.slice(start, start + itemPerPage)
  }, [currentPage, itemPerPage, positions])

  useEffect(() => {
    setCurrentPage(1)
  }, [itemPerPage, account, chainId])

  useEffect(() => {
    if (account && accountRef.current !== account) {
      accountRef.current = account
      location.reload()
    }

    if (chainId && chainIdRef.current !== chainId) {
      chainIdRef.current = chainId
      location.reload()
    }
  }, [account, chainId])

  const renderPosition = useMemo(
    () =>
      paginatedPositions.map((item, index) => {
        const key = `${item.address}-${index}`

        if (item.type === 'Manual') {
          return (
            <React.Fragment key={key}>
              {item?.deployer === zeroAddress ? <FarmingItem position={item} /> : <ManualItem position={item} />}
            </React.Fragment>
          )
        }

        if (item.tokens && Array.isArray(item.tokens)) {
          return (
            <React.Fragment key={key}>
              {item.notStaked && <WeightedItem position={item} isStake={false} />}
              {item.staked && <WeightedItem position={item} isStake />}
            </React.Fragment>
          )
        }

        return (
          <React.Fragment key={key}>
            {item.staked ? <StakedItem position={item} /> : <NotStakedItem position={item} />}
          </React.Fragment>
        )
      }),
    [paginatedPositions],
  )

  return (
    <div className='w-full rounded-lg max-md:px-0'>
      {/* Header */}
      <div className='hidden rounded-lg md:bg-neutral-800 lg:flex lg:px-4'>
        <div className='flex w-full flex-row items-center justify-between gap-4 rounded-lg py-2 text-sm font-semibold'>
          <span className='w-[20%] px-4 lg:min-w-[195px]'>Pair</span>
          <span className='min-w-[146px] px-4 lg:w-[17%]'>Range</span>
          <span className='w-[13%] px-4'>My APR</span>
          <span className='w-[13%] px-4'>My Value</span>
          <span className='w-[13%] px-4'>Rewards</span>
          <span className='w-[24%] max-w-[269px]' />
        </div>
      </div>

      {/* Items */}
      <div className='bg-opacity-50 bg-[url(/images/rewards-claimable-bg.png)] bg-contain bg-no-repeat max-lg:space-y-2 lg:px-4 lg:pt-8'>
        {renderPosition}
      </div>

      {/* Pagination */}
      <Paginates
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalPages={totalPages}
        itemPerPage={itemPerPage}
        setItemPerPage={setItemPerPage}
      />
    </div>
  )
}

export default React.memo(AssetsTable)
