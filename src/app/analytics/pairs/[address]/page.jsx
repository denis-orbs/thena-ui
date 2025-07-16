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

  const handleChangeManualType = useCallback(
    targetValue => {
      // targetValue: 'the' for farming, 'fees' for swap fees
      const shouldBeFarming = targetValue === 'the'
      const _strategy = pair?.subpools.find(item =>
        shouldBeFarming ? item.title === 'CL_Farming' : item.title === 'CL_SwapFee',
      )
      handleChooseStrategy(_strategy ?? defaultSwapFees)
    },
    [handleChooseStrategy, pair?.subpools],
  )

  if (isLoading || !pairs || !pair) {
    return <Loading />
  }

  return (
    <LayoutWithBackButton backUrl={backUrl}>
      <div className='flex flex-col gap-4 lg:gap-8'>
        {/* Header with token info and stats in horizontal layout */}
        <div className='flex flex-col gap-4 rounded-lg lg:flex-row lg:gap-12'>
          {/* Token info and external link */}
          <div
            className={cn(
              'flex flex-row gap-4 max-lg:justify-between lg:w-[20%] lg:min-w-[307px] lg:flex-col',
              pair.type === PAIR_TYPES.WEIGHTED && 'w-full flex-col lg:w-full',
            )}
          >
            <div
              className={cn(
                'flex items-center gap-4',
                pair.type !== PAIR_TYPES.WEIGHTED ? 'lg:justify-between' : 'max-lg:max-h-[70px]',
              )}
            >
              {pair.type === PAIR_TYPES.WEIGHTED ? (
                <GroupIconTokens
                  classNames={{
                    image: 'w-7 h-7 text-xl font-medium leading-5 text-[#1C2027]',
                    rows: '*:not-first:-ml-2',
                  }}
                  width={pair.tokens.length > 4 ? 28 : 48}
                  height={pair.tokens.length > 4 ? 28 : 48}
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
              <div
                className={cn(
                  'flex min-w-0 flex-1 flex-col',
                  pair.type === PAIR_TYPES.WEIGHTED ? 'justify-between max-md:h-[48px]' : 'gap-1',
                )}
              >
                <div className='flex min-w-0 items-center gap-3'>
                  <TextHeading className='min-w-0 truncate text-xl! leading-6! lg:text-4xl! lg:leading-10!'>
                    {pair.symbol}
                  </TextHeading>
                  <LinkExternalIcon
                    className='size-4 flex-shrink-0 cursor-pointer stroke-neutral-500 transition-all duration-150 ease-out hover:stroke-neutral-100 xl:size-6'
                    onClick={() => goScan(networkId, pairAddress)}
                    data-tooltip-id='contract-tooltip'
                  />
                </div>
                <div className='hidden text-xs text-nowrap text-neutral-300 max-lg:block'>
                  {`${t('Fee')}: ${pair.fee}%${pair.type === PAIR_TYPES.WEIGHTED ? ' Weighted' : ''}`}
                </div>
              </div>
            </div>

            <div className='flex items-center gap-6 text-sm text-neutral-400 max-lg:justify-end'>
              <div
                className={cn(
                  'flex flex-col justify-between',
                  pair.type === PAIR_TYPES.WEIGHTED && 'h-full min-w-[285px] max-lg:hidden',
                )}
              >
                <span className='hidden text-base leading-5 font-normal text-nowrap text-neutral-300 lg:block'>
                  {`${t('Fee')}: ${pair.fee}%${pair.type === PAIR_TYPES.WEIGHTED ? ' Weighted' : ''}`}
                </span>
                {pair.type === PAIR_TYPES.WEIGHTED && (
                  <EmphasisButton
                    className='w-full leading-5! max-lg:hidden'
                    onClick={() => push(`/pools/add-liquidity/weighted/${pair.address}?back=4`)}
                  >
                    {t('Add Liquidity')}
                  </EmphasisButton>
                )}
              </div>
              <div
                className={cn(
                  'flex flex-col justify-between gap-4 md:flex-row',
                  pair.type !== PAIR_TYPES.LSD && 'hidden',
                )}
              >
                <RadioInput
                  name='earn-type'
                  value='the'
                  onChange={() => handleChangeManualType('the')}
                  label='Earn THE'
                  checked={strategy?.isFarming}
                  className='size-5'
                />
                <RadioInput
                  name='earn-type'
                  value='fees'
                  onChange={() => handleChangeManualType('fees')}
                  checked={!strategy?.isFarming}
                  label='Earn Fees'
                  className='size-5'
                />
              </div>
              {pair.type === PAIR_TYPES.WEIGHTED && <PairBasicInfo pair={pair} className='h-[100px] w-full' />}
            </div>

            <EmphasisButton
              className={cn('w-full max-lg:hidden', pair.type === PAIR_TYPES.WEIGHTED && 'hidden')}
              onClick={() => push(`/pools/add-liquidity?step=3&poolAddress=${pair.address}&back=4`)}
            >
              {t('Add Liquidity')}
            </EmphasisButton>
          </div>

          {/* Stats in horizontal layout */}
          <PairBasicInfo
            pair={pair}
            className={cn('w-full lg:w-[80%]', pair.type === PAIR_TYPES.WEIGHTED && 'hidden')}
          />
          <EmphasisButton
            className='z-40 h-8 w-full text-xs! lg:hidden'
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
            classNames={{ content: 'pb-4 px-0!', preview: '!pb-[1px] px-0! pt-0!' }}
          >
            <PoolChart address={pair.address} showTitle={false} classNames={{ chart: 'px-4! analytics-chart' }} />
          </Collapsible>
        </div>

        <div className='max-lg:hidden'>
          <PoolChart address={pair.address} />
        </div>

        {pair.type === PAIR_TYPES.LSD && <PairStrategy pair={pair} />}
        {pair.type === PAIR_TYPES.WEIGHTED && (
          <>
            <div className='hidden lg:block'>
              <PoolAttributesAnalytic pair={pair} />
            </div>
            <Collapsible
              className='bg-contain bg-no-repeat lg:hidden'
              backgroundImage='/images/dataplot.svg'
              title={t('Pool Attributes')}
              subtitle={t('Weighted')}
              previewContent={<div className='h-[161px] w-full' />}
              classNames={{
                content: 'pb-4 px-0! bg-gradient-purple-dark',
                preview: '!pb-[1px] px-0! pt-0!',
                headerOpen: 'bg-[url(/images/dataplot2.svg)] bg-contain bg-no-repeat h-[104px] content-end pb-0',
              }}
            >
              <PoolAttributesAnalytic pair={pair} />
            </Collapsible>
          </>
        )}
        {pair.type === PAIR_TYPES.WEIGHTED ? (
          <WeightedTransactionTable pair={pair} />
        ) : (
          <TransactionTable pair={pair} />
        )}
      </div>
    </LayoutWithBackButton>
  )
}
