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
import { MANUAL_TYPES, PAIR_TYPES, UNKNOWN_LOGO } from '@/constant'
import { usePairs } from '@/context/pairsContext'
import { useBackURL } from '@/hooks/useBackURL'
import { goScan } from '@/lib/utils'
import { PoolChart } from '@/modules/Pools/PoolCharts'
import { useChainSettings } from '@/state/settings/hooks'
import { LinkExternalIcon } from '@/svgs'

import PairStrategy from './PairStrategy'
import TransactionTable from './PairTransaction'
import PoolAttributesAnalytic from './PoolAttributesAnalytic'
import WeightedTransactionTable from './WeightedPairTransaction'

export default function PairDetailPage({ params }) {
  const t = useTranslations()
  const { push } = useRouter()
  const { address } = params
  const { pairs, isLoading } = usePairs()
  const { networkId } = useChainSettings()
  const backUrl = useBackURL()

  const pair = useMemo(
    () => (pairs ? pairs.find(ele => ele.address.includes(address.toLowerCase())) : undefined),
    [pairs, address],
  )

  const pairAddress = useMemo(() => {
    if (
      pair &&
      pair.type === PAIR_TYPES.LSD &&
      pair.subpools.length === 1 &&
      pair.subpools[0].title === MANUAL_TYPES[1]
    ) {
      return pair.subpools[0].address
    }
    return pair?.address
  }, [pair])

  if (isLoading || !pairs || !pair) {
    return <Loading />
  }

  return (
    <LayoutWithBackButton backUrl={backUrl}>
      <div className='flex flex-col gap-4 lg:gap-16'>
        <div className='flex flex-col gap-4'>
          <div className='flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-end'>
            <div className='flex w-full items-center gap-4'>
              {pair.type === PAIR_TYPES.WEIGHTED ? (
                <GroupIconTokens
                  classNames={{
                    image: 'w-8 h-8 text-xl font-medium leading-5 text-[#1C2027]',
                    rows: '*:not-first:-ml-2',
                  }}
                  width={40}
                  height={40}
                  tokens={pair.tokens}
                />
              ) : (
                <IconGroup
                  classNames={{
                    image: 'outline-4 w-8 lg:w-16',
                  }}
                  logo1={pair.token0.logoURI ?? UNKNOWN_LOGO}
                  logo2={pair.token1.logoURI ?? UNKNOWN_LOGO}
                />
              )}
              <div className='flex items-end gap-4 py-2.5'>
                <NewTextHeading className='text-wrap break-all whitespace-normal'>{pair.symbol}</NewTextHeading>
                <LinkExternalIcon
                  className='mb-1 size-6 cursor-pointer stroke-neutral-500 transition-all duration-150 ease-out hover:stroke-neutral-100'
                  onClick={() => goScan(networkId, pairAddress)}
                  data-tooltip-id='contract-tooltip'
                />
              </div>
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
                push(`/pools/add-liquidity?step=3&poolAddress=${pair.address}&back=4`)
              } else {
                push(`/pools/add-liquidity/weighted/${pair.address}?back=4`)
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
