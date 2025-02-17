import { useTranslations } from 'next-intl'
import React, { useMemo } from 'react'

import NewListings from '@/app/pools/NewListings'
import { Paragraph } from '@/components/typography'
import { usePairs } from '@/context/pairsContext'
import { wrappedAddress } from '@/lib/utils'
import { InfoIcon } from '@/svgs'

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
  const t = useTranslations()
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
        <>
          <div className='flex gap-1 rounded-xl border border-primary-800 bg-primary-950 p-6 lg:p-8'>
            <div className='flex h-10 w-10 items-center'>
              <InfoIcon className='h-5 w-5 !stroke-primary-600' />
            </div>
            <div className='flex flex-col'>
              <Paragraph className='text-xl text-neutral-100'>
                {t('No Pool for this Assets and Strategie found')}
              </Paragraph>
              <Paragraph className='text-base text-neutral-100'>
                {t('You can create a new Pool or change the Strategie')}
              </Paragraph>
            </div>
          </div>
        </>
      )}
    </>
  )
}

export default AvailablePools
