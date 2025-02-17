import React, { useMemo } from 'react'

import NewListings from '@/app/pools/NewListings'
import { usePairs } from '@/context/pairsContext'
import { wrappedAddress } from '@/lib/utils'

const sortOptions = [
  {
    label: 'Pairing',
    value: 'pair',
    width: 'lg:w-[30%]',
    isDesc: true,
  },
  {
    label: 'APR',
    value: 'apr',
    width: 'lg:w-[15%] lg:min-w-[231.61px]',
    isDesc: true,
  },
  {
    label: 'TVL',
    value: 'tvl',
    width: 'lg:w-[15%]',
    isDesc: true,
  },
  // {
  //   label: 'Volume (24h)',
  //   value: 'volume',
  //   width: 'lg:w-[10%]',
  //   isDesc: true,
  // },
  {
    label: 'Fees (24h)',
    value: 'fee',
    width: 'lg:w-[calc(20%-100px)]',
    isDesc: true,
  },
  {
    label: '',
    value: 'action',
    width: 'lg:w-[150px]',
    disabled: true,
  },
]

function AvailablePools({ tokens }) {
  const { weightedPools } = usePairs()
  // console.log({ weightedPools, tokens })
  const availablePools = useMemo(() => {
    const pools = weightedPools.filter(pool =>
      tokens.every(token => pool.tokens.map(pToken => pToken.address).includes(wrappedAddress(token))),
    )
    return pools
  }, [tokens, weightedPools])

  return (
    <>
      {availablePools.length > 0 ? (
        <div className='w-full'>
          <NewListings isCollapse={false} pools={availablePools} sortOptions={sortOptions} />
        </div>
      ) : (
        <></>
      )}
    </>
  )
}

export default AvailablePools
