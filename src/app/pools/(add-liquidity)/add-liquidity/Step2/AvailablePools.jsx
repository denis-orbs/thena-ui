import { useTranslations } from 'next-intl'
import React, { useEffect, useMemo } from 'react'

import NewListings from '@/app/pools/NewListings'
import { Paragraph } from '@/components/typography'
import { PAIR_TYPES } from '@/constant'
import { usePairs } from '@/context/pairsContext'
import { wrappedAddress } from '@/lib/utils'
import { usePairInfo } from '@/state/pools/hooks'
import { InfoIcon, PoolCoinsIcon } from '@/svgs'

const sortOptions = [
  {
    label: 'Pair',
    value: 'pair',
    width: 'lg:w-[35%]',
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

function AvailablePools({ tokens = [], pairType, setFoundedPool = () => {} }) {
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
    } else {
      setFoundedPool()
    }
  }, [foundedPair, setFoundedPool])

  return (
    <>
      {availablePools.length > 0 || foundedPair ? (
        <div className='w-full'>
          <NewListings
            defaultShow
            pools={pairType === PAIR_TYPES.WEIGHTED ? availablePools : foundedPair ? [foundedPair] : []}
            title={
              <div className='flex gap-2'>
                <PoolCoinsIcon className='h-6 w-6 stroke-neutral-400' />
                {t('Available Pools')}
              </div>
            }
            classNames={{
              title: 'flex flex-row justify-normal gap-2',
              divider: 'block',
              header: 'border-none border-transparent',
              cellItem: 'p-2 lg:p-2',
              tableContainer: 'space-y-4',
            }}
            sortOptions={sortOptions}
          />
        </div>
      ) : (
        <>
          <div className='flex gap-4 rounded-xl border border-primary-800 bg-primary-950 p-4 px-5 md:p-6 lg:p-8'>
            <div className='flex'>
              <InfoIcon className='size-5 !stroke-primary-600 md:size-8' />
            </div>
            <div className='flex flex-col gap-2'>
              <Paragraph className='text-base font-medium text-neutral-100 md:text-xl'>
                {t('No [type] pool available for the selected tokens', {
                  type: pairType,
                })}
              </Paragraph>
              <Paragraph className='text-sm leading-5 text-primary-100 md:text-base'>
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
