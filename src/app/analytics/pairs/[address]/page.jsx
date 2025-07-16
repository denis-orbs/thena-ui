'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useCallback, useMemo } from 'react'
import { useDispatch } from 'react-redux'

import Loading from '@/app/loading'
import { PairBasicInfo } from '@/app/pools/(add-liquidity)/add-liquidity/PairBasicInfo'
import { EmphasisButton } from '@/components/buttons/Button'
import Collapsible from '@/components/collapse/Collapse2'
import { defaultSwapFees } from '@/components/common/AddLiquidity/ChooseStrategy'
import LayoutWithBackButton from '@/components/common/LayoutWithBackButton'
import IconGroup from '@/components/icongroup'
import GroupIconTokens from '@/components/icongroup/GroupIconTokens'
import RadioInput from '@/components/radioInput'
import { TextHeading } from '@/components/typography'
import { MANUAL_TYPES, PAIR_TYPES, UNKNOWN_LOGO } from '@/constant'
import { usePairs } from '@/context/pairsContext'
import { useBackURL } from '@/hooks/useBackURL'
import { cn, goScan } from '@/lib/utils'
import { PoolChart } from '@/modules/Pools/PoolCharts'
import { updateStrategy } from '@/state/fusion/actions'
import { useV3MintState } from '@/state/fusion/hooks'
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
  const { strategy } = useV3MintState()
  const dispatch = useDispatch()

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

  const setStrategy = useCallback(
    strategyInfo => {
      dispatch(updateStrategy({ strategy: strategyInfo }))
    },
    [dispatch],
  )

  const handleChooseStrategy = useCallback(
    sub => {
      if (!sub) return setStrategy(null)
      setStrategy({
        title: sub.title,
        tvl: sub.tvl ? sub.tvl.toNumber() : sub.gauge?.tvl?.toNumber() ?? 0,
        apr: sub.gauge?.apr?.toNumber() ?? 0,
        account: {
          totalLp: sub.account?.totalLp?.toNumber(),
          gaugeBalance: sub.account?.gaugeBalance?.toNumber(),
        },
        allowed: { ...sub.allowed, balance: sub.allowed?.balance?.toNumber() },
        token0: {
          ...sub.token0,
          reserve: sub.token0?.reserve?.toNumber(),
          balance: sub.token0?.balance?.toNumber(),
          totalValue: sub.token0?.totalValue,
        },
        token1: {
          ...sub.token1,
          reserve: sub.token1?.reserve?.toNumber(),
          balance: sub.token1?.balance?.toNumber(),
          totalValue: sub.token1?.totalValue,
        },
        address: sub.address,
        isFarming: sub.title.includes('Farming'),
        isAutomatic: false,
        isDefault: sub.isDefault ?? true,
        fee: sub.fee,
        version: sub.version,
        gauge: {
          ...sub.gauge,
          apr: sub.gauge?.apr?.toNumber(),
          bribeUsd: sub.gauge?.bribeUsd?.toNumber(),
          pooled0: sub.gauge?.pooled0?.toNumber(),
          pooled1: sub.gauge?.pooled1?.toNumber(),
          projectedApr: sub.gauge?.projectedApr?.toNumber(),
          voteApr: sub.gauge?.voteApr?.toNumber(),
          tvl: sub.gauge?.tvl?.toNumber(),
          weight: sub.gauge?.weight?.toNumber(),
          weightPercent: sub.gauge?.weightPercent?.toNumber(),
          apr_list: undefined,
        },
      })
    },
    [setStrategy],
  )

  const handleChangeManualType = useCallback(() => {
    if (strategy) {
      const _strategy = pair?.subpools.find(item =>
        strategy.isFarming ? item.title === 'CL_SwapFee' : item.title === 'CL_Farming',
      )
      handleChooseStrategy(_strategy ?? defaultSwapFees)
    }
  }, [handleChooseStrategy, pair?.subpools, strategy])

  if (isLoading || !pairs || !pair) {
    return <Loading />
  }

  return (
    <LayoutWithBackButton backUrl={backUrl}>
      <div className='flex flex-col gap-4 lg:gap-8'>
        {/* Header with token info and stats in horizontal layout */}
        <div className='flex flex-col gap-4 rounded-lg lg:flex-row lg:gap-12'>
          {/* Token info and external link */}
          <div className='flex flex-row gap-4 max-lg:justify-between lg:w-[20%] lg:min-w-[307px] lg:flex-col'>
            <div className='flex items-center gap-4 lg:justify-between'>
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
                    image: 'outline-4 w-8 lg:w-12',
                  }}
                  logo1={pair.token0.logoURI ?? UNKNOWN_LOGO}
                  logo2={pair.token1.logoURI ?? UNKNOWN_LOGO}
                />
              )}
              <div className='flex flex-col gap-1'>
                <div className='flex items-center gap-3'>
                  <TextHeading className='text-xl! text-wrap break-all whitespace-normal lg:text-4xl!'>
                    {pair.symbol}
                  </TextHeading>
                  <LinkExternalIcon
                    className='size-4 cursor-pointer stroke-neutral-500 transition-all duration-150 ease-out hover:stroke-neutral-100 xl:size-6'
                    onClick={() => goScan(networkId, pairAddress)}
                    data-tooltip-id='contract-tooltip'
                  />
                </div>
                <span className='hidden text-xs text-nowrap max-md:block'>
                  {t('Fee')}: {pair.fee}%
                </span>
              </div>
            </div>

            <div className='flex items-center gap-6 text-sm text-neutral-400 max-lg:justify-end'>
              <span className='hidden text-nowrap lg:block'>
                {t('Fee')}: {pair.fee}%
              </span>
              <div className={cn('flex flex-col justify-between gap-4 md:flex-row', pair.type === PAIR_TYPES.LSD)}>
                <RadioInput
                  name='earn-type'
                  value='the'
                  onChange={handleChangeManualType}
                  label='Earn THE'
                  checked={strategy?.isFarming}
                  className='size-5'
                />
                <RadioInput
                  name='earn-type'
                  value='fees'
                  onChange={handleChangeManualType}
                  checked={!strategy?.isFarming}
                  label='Earn Fees'
                  className='size-5'
                />
              </div>
            </div>

            <EmphasisButton
              className='w-full max-lg:hidden'
              onClick={() => {
                if (pair.type !== PAIR_TYPES.WEIGHTED) {
                  push(`/pools/add-liquidity?step=3&poolAddress=${pair.address}&back=4`)
                } else {
                  push(`/pools/add-liquidity/weighted/${pair.address}?back=4`)
                }
              }}
            >
              {t('Add Liquidity')}
            </EmphasisButton>
          </div>

          {/* Stats in horizontal layout */}
          <PairBasicInfo pair={pair} className='w-full lg:w-[80%]' />
          <EmphasisButton
            className='h-8 w-full text-xs! lg:hidden'
            onClick={() => {
              if (pair.type !== PAIR_TYPES.WEIGHTED) {
                push(`/pools/add-liquidity?step=3&poolAddress=${pair.address}&back=4`)
              } else {
                push(`/pools/add-liquidity/weighted/${pair.address}?back=4`)
              }
            }}
          >
            {t('Add Liquidity')}
          </EmphasisButton>
        </div>

        <div className='rounded-xl lg:hidden'>
          <Collapsible
            title={t('Analytics')}
            subtitle='TVL / Volume / Fees / Liquidity'
            previewContent={<PoolChart address={pair.address} showTitle={false} isSimple />}
            classNames={{ content: 'pb-4', preview: '!p-0' }}
          >
            <PoolChart address={pair.address} showTitle={false} />
          </Collapsible>
        </div>

        <div className='max-lg:hidden'>
          <PoolChart address={pair.address} />
        </div>

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
