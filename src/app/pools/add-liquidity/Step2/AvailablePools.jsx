import { useTranslations } from 'next-intl'
import React, { useMemo } from 'react'

import NewListings from '@/app/pools/NewListings'
import { Paragraph } from '@/components/typography'
import { PAIR_TYPES } from '@/constant'
import { usePairs } from '@/context/pairsContext'
import { wrappedAddress } from '@/lib/utils'
import { InfoIcon } from '@/svgs'

const sortOptions = [
  {
    label: 'Pair',
    value: 'pair',
    width: 'lg:w-[25%]',
    isDesc: true,
  },
  {
    label: 'APR',
    value: 'apr',
    width: 'lg:w-[12%]',
    isDesc: true,
  },
  {
    label: 'TVL',
    value: 'tvl',
    width: 'lg:w-[23%]',
    isDesc: true,
  },
  {
    label: 'Fees (24h)',
    value: 'fee',
    width: 'lg:w-[calc(40%-120px)]',
    isDesc: true,
  },
  {
    label: '',
    value: 'action',
    width: 'w-[120px]',
    disabled: true,
  },
]

function AvailablePools({ tokens = [], pairType }) {
  const { weightedPools, pairs } = usePairs()
  const t = useTranslations()

  const availablePools = useMemo(() => {
    if (pairType === PAIR_TYPES.WEIGHTED) {
      return weightedPools.filter(pool =>
        tokens.every(token => pool.tokens.map(pToken => pToken.address).includes(wrappedAddress(token))),
      )
    }

    return pairs.filter(pair => {
      const token0Address = wrappedAddress(tokens[0])
      const token1Address = wrappedAddress(tokens[1])

      return (
        pair.type === pairType &&
        ((pair.token0.address === token0Address && pair.token1.address === token1Address) ||
          (pair.token0.address === token1Address && pair.token1.address === token0Address))
      )
    })
  }, [pairType, pairs, weightedPools, tokens])

  return (
    <>
      {availablePools.length > 0 ? (
        <div className='w-full'>
          <NewListings defaultShow pools={availablePools} title={t('Available Pools')} sortOptions={sortOptions} />
        </div>
      ) : (
        <>
          <div className='flex gap-1 rounded-xl border border-primary-800 bg-primary-950 p-6 lg:p-8'>
            <div className='flex h-10 w-10 items-center'>
              <InfoIcon className='h-5 w-5 !stroke-primary-600' />
            </div>
            <div className='flex flex-col'>
              <Paragraph className='text-xl text-neutral-100'>
                {t('No Pool for this Assets and Strategies found')}
              </Paragraph>
              <Paragraph className='text-base text-neutral-100'>
                {t('You can create a new Pool or change the Strategy')}
              </Paragraph>
            </div>
          </div>
        </>
      )}
    </>
  )
}

export default AvailablePools
