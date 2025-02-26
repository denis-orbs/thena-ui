import { useTranslations } from 'next-intl'
import React, { useEffect, useMemo } from 'react'

import NewListings from '@/app/pools/NewListings'
import { NewTextHeading, Paragraph } from '@/components/typography'
import { PAIR_TYPES } from '@/constant'
import { usePairs } from '@/context/pairsContext'
import { wrappedAddress } from '@/lib/utils'
import { usePairInfo } from '@/state/pools/hooks'
import { InfoIcon } from '@/svgs'

const sortOptions = [
  {
    label: 'Pair',
    value: 'pair',
    width: 'lg:w-[38%]',
    isDesc: true,
  },
  {
    label: 'APR',
    value: 'apr',
    width: 'lg:w-[15%]',
    isDesc: true,
  },
  {
    label: 'TVL',
    value: 'tvl',
    width: 'lg:w-[15%]',
    isDesc: true,
  },
  {
    label: 'Fees (24h)',
    value: 'fee',
    width: 'lg:w-[calc(30%-100px)]',
    isDesc: true,
  },
  {
    label: '',
    value: 'action',
    width: 'w-[100px]',
    disabled: true,
  },
]

function AvailablePools({ tokens = [], pairType, setFoundedPool }) {
  const { weightedPools } = usePairs()
  const t = useTranslations()

  const foundedPair = usePairInfo({
    token0Address: wrappedAddress(tokens[0]),
    token1Address: wrappedAddress(tokens[1]),
    type: pairType,
  })

  const availablePools = useMemo(() => {
    if (pairType === PAIR_TYPES.WEIGHTED) {
      return (weightedPools || []).filter(pool =>
        tokens.every(token => pool.tokens.map(pToken => pToken.address).includes(wrappedAddress(token))),
      )
    }

    return []
  }, [pairType, weightedPools, tokens])

  useEffect(() => {
    if (foundedPair) {
      setFoundedPool(foundedPair)
    }
  }, [foundedPair, setFoundedPool])

  return (
    <>
      {availablePools.length > 0 || foundedPair ? (
        <div className='w-full'>
          <NewListings
            defaultShow
            pools={pairType === PAIR_TYPES.WEIGHTED ? availablePools : foundedPair ? [foundedPair] : []}
            title={t('Available Pools')}
            sortOptions={sortOptions}
          />
        </div>
      ) : (
        <>
          <div className='flex gap-4 rounded-xl border border-primary-800 bg-primary-950 p-6 lg:p-8'>
            <div className='flex h-10 w-10 items-center'>
              <InfoIcon className='h-8 w-8 !stroke-primary-600' />
            </div>
            <div className='flex flex-col gap-2'>
              <NewTextHeading className='!text-xl font-medium text-neutral-100'>
                {t('No [type] pool available for the selected tokens', {
                  type: pairType,
                })}
              </NewTextHeading>
              <Paragraph className='text-base leading-5 text-neutral-100'>
                {t('You can begin to create a new pool below')}
              </Paragraph>
            </div>
          </div>
        </>
      )}
    </>
  )
}

export default AvailablePools
