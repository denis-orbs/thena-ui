import { useTranslations } from 'next-intl'
import React, { useEffect, useMemo } from 'react'

import NewListings from '@/app/pools/NewListings'
import { Paragraph } from '@/components/typography'
import { PAIR_TYPES } from '@/constant'
import { usePairs } from '@/context/pairsContext'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { wrappedAddress } from '@/lib/utils'
import { usePairInfo } from '@/state/pools/hooks'
import { InfoIcon, PoolCoinsIcon } from '@/svgs'

function AvailablePools({ tokens = [], pairType, setFoundedPool = () => {} }) {
  const { weightedPools } = usePairs()
  const t = useTranslations()
  const { isMdDown } = useMediaQuery()

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

  const sortOptions = useMemo(() => {
    const options = [
      {
        label: 'Pair',
        value: 'pair',
        width: pairType === PAIR_TYPES.WEIGHTED ? 'w-[50%] md:w-[42%]' : 'w-[42%] md:w-[35%]',
        isDesc: true,
      },
      {
        label: 'APR',
        value: 'apr',
        width: pairType === PAIR_TYPES.WEIGHTED ? 'w-[calc(50%-90px)] md:w-[15%]' : 'w-[calc(58%-50px)] md:w-[15%]',
        isDesc: true,
      },
    ]

    if (isMdDown) {
      return [
        ...options,
        {
          label: '',
          value: 'action',
          width: pairType === PAIR_TYPES.WEIGHTED ? 'lg:w-[100px] w-[90px]' : 'lg:w-[100px] w-[50px]',
          disabled: true,
        },
      ]
    }

    return [
      ...options,
      {
        label: 'TVL',
        value: 'tvl',
        width: 'w-[15%]',
        isDesc: true,
      },
      {
        label: 'Fees (24h)',
        value: 'fee',
        width: pairType === PAIR_TYPES.WEIGHTED ? 'w-[calc(23%-100px)]' : 'w-[calc(30%-100px)]',
        isDesc: true,
      },
      {
        label: '',
        value: 'action',
        width: 'w-[100px]',
        disabled: true,
      },
    ]
  }, [isMdDown, pairType])

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
              header: 'border-none border-transparent flex',
              cellItem: 'p-2 lg:p-2',
              cellItemLabel: 'hidden',
              tableContainer: 'lg:space-y-4 space-y-2',
              rowItem: 'border-none',
            }}
            sortOptions={sortOptions}
            size='small'
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
