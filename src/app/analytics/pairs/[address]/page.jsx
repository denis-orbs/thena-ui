'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useMemo } from 'react'

import Loading from '@/app/loading'
import { PairBasicInfo } from '@/app/pools/(add-liquidity)/add-liquidity/PairBasicInfo'
import { PrimaryButton } from '@/components/buttons/Button'
import LayoutWithBackButton from '@/components/common/LayoutWithBackButton'
import IconGroup from '@/components/icongroup'
import GroupIconTokens from '@/components/icongroup/GroupIconTokens'
import { NewTextHeading, NewTextSubHeading } from '@/components/typography'
import { PAIR_TYPES, UNKNOWN_LOGO } from '@/constant'
import { usePairs } from '@/context/pairsContext'
import { PoolChart } from '@/modules/Pools/PoolCharts'

import PairStrategy from './PairStrategy'
import TransactionTable from './PairTransaction'
import PoolAttributesAnalytic from './PoolAttributesAnalytic'
import WeightedTransactionTable from './WeightedPairTransaction'

export default function PairDetailPage({ params }) {
  const { address } = params
  const { pairs, isLoading } = usePairs()
  const t = useTranslations()

  const pair = useMemo(
    () => (pairs ? pairs.find(ele => ele.address.includes(address.toLowerCase())) : undefined),
    [pairs, address],
  )

  const { push } = useRouter()

  if (isLoading || !pairs || !pair) {
    return <Loading />
  }

  return (
    <LayoutWithBackButton>
      <div className='flex flex-col gap-4 lg:gap-16'>
        <div className='flex flex-col gap-4'>
          <div className='flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-end'>
            <div className='flex w-full items-center gap-4'>
              {pair.type === PAIR_TYPES.WEIGHTED ? (
                <GroupIconTokens
                  classNames={{
                    image: 'w-8 h-8 text-xl font-medium leading-5 text-[#1C2027]',
                    rows: '-space-x-2',
                  }}
                  width={40}
                  height={40}
                  tokens={pair.tokens}
                />
              ) : (
                <IconGroup
                  className='-space-x-4'
                  classNames={{
                    image: 'outline-4 w-8 lg:w-16',
                  }}
                  logo1={pair.token0.logoURI ?? UNKNOWN_LOGO}
                  logo2={pair.token1.logoURI ?? UNKNOWN_LOGO}
                />
              )}

              <NewTextHeading>{pair.symbol}</NewTextHeading>
            </div>
          </div>

          <NewTextSubHeading>
            {t('Fee')}: {pair.fee}%
          </NewTextSubHeading>
        </div>

        <div className='flex w-full flex-col gap-4'>
          <NewTextSubHeading>{t('Pool Information')}</NewTextSubHeading>
          <PairBasicInfo pair={pair} />
          <PrimaryButton
            className='w-full md:w-fit'
            onClick={() => {
              if (pair.type !== PAIR_TYPES.WEIGHTED) {
                push(`/pools/add-liquidity?step=3&poolAddress=${pair.address}`)
              } else {
                push(`/pools/add-liquidity/weighted/${pair.address}`)
              }
            }}
          >
            {t('Add Liquidity')}
          </PrimaryButton>
        </div>

        <PoolChart address={pair.address} />

        {pair.type === PAIR_TYPES.LSD && <PairStrategy pair={pair} />}
        {pair.type === PAIR_TYPES.WEIGHTED && <PoolAttributesAnalytic pair={pair} />}
        {pair.type === PAIR_TYPES.WEIGHTED ? (
          <WeightedTransactionTable pair={pair} />
        ) : (
          <TransactionTable pair={pair} />
        )}
      </div>
    </LayoutWithBackButton>
  )
}
