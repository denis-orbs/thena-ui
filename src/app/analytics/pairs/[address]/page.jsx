'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useRouter } from 'nextjs-toploader/app'
import React, { useCallback, useEffect, useMemo } from 'react'
import { useDispatch } from 'react-redux'

import Loading from '@/app/loading'
import { PairBasicInfo } from '@/app/pools/(add-liquidity)/add-liquidity/PairBasicInfo'
import { EmphasisButton } from '@/components/buttons/Button'
import Collapsible from '@/components/collapse/Collapse2'
import { defaultSwapFees } from '@/components/common/AddLiquidity/ChooseStrategy'
import LayoutWithBackButton from '@/components/common/LayoutWithBackButton'
import IconGroup from '@/components/icongroup'
import RadioInput from '@/components/radioInput'
import { TextHeading } from '@/components/typography'
import { MANUAL_TYPES, PAIR_TYPES, UNKNOWN_LOGO } from '@/constant'
import { usePairs } from '@/context/pairsContext'
import { useBackURL } from '@/hooks/useBackURL'
import { PoolChart } from '@/modules/Pools/PoolCharts'
import { updateStrategy } from '@/state/fusion/actions'
import { useV3MintState } from '@/state/fusion/hooks'
import { useChainSettings } from '@/state/settings/hooks'
import cn from '@/utils/classes'
import { goScan } from '@/utils/utils'

import LinkExternalIcon from '~/svgs/link-external.svg'

import PairStrategy from './PairStrategy'
import TransactionTable from './PairTransaction'

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
  const currentStrategy = useMemo(() => {
    if (pair && pair.type === PAIR_TYPES.LSD) {
      const strategyTitle = strategy ? strategy.title : MANUAL_TYPES[1]
      return pair.subpools.find(item => item.title === strategyTitle)
    }
    return undefined
  }, [pair, strategy])

  const pairFee = useMemo(() => currentStrategy?.fee ?? pair?.fee ?? 0, [currentStrategy, pair])
  const pairAddress = useMemo(() => currentStrategy?.address ?? pair?.address, [currentStrategy, pair])

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

  useEffect(() => {
    if (currentStrategy?.title !== strategy?.title) {
      handleChooseStrategy(currentStrategy)
    }
  }, [currentStrategy, handleChooseStrategy, strategy])

  if (isLoading || !pairs || !pair) {
    return <Loading />
  }

  return (
    <LayoutWithBackButton backUrl={backUrl}>
      <div className='flex flex-col gap-4 xl:gap-8'>
        {/* Header with token info and stats in horizontal layout */}
        <div className='flex flex-col gap-4 rounded-lg xl:flex-row xl:gap-12'>
          {/* Token info and external link */}
          <div className={cn('flex w-full flex-1 flex-row gap-4 max-xl:justify-between xl:max-w-[600px] xl:flex-col')}>
            <div className={cn('flex items-center gap-4')}>
              <IconGroup
                classNames={{
                  image: 'outline-4 w-8 xl:w-12',
                }}
                logo1={pair.token0.logoURI ?? UNKNOWN_LOGO}
                logo2={pair.token1.logoURI ?? UNKNOWN_LOGO}
              />
              <div className={cn('flex flex-1 flex-col')}>
                <div className='flex items-center gap-3'>
                  <TextHeading className='min-w-0 text-xl! leading-6! xl:text-4xl! xl:leading-10!'>
                    <Link className='hover:underline' href={`/analytics/tokens/${pair.token0.address}?back=4`}>
                      {pair.token0.symbol}
                    </Link>
                    /
                    <Link className='hover:underline' href={`/analytics/tokens/${pair.token1.address}?back=4`}>
                      {pair.token1.symbol}
                    </Link>
                  </TextHeading>
                  <LinkExternalIcon
                    className='size-4 flex-shrink-0 cursor-pointer stroke-neutral-500 transition-all duration-150 ease-out hover:stroke-neutral-100 xl:size-6'
                    onClick={() => goScan(networkId, pairAddress)}
                    data-tooltip-id='contract-tooltip'
                  />
                </div>
                <div className='hidden text-xs text-nowrap text-neutral-300 max-xl:block'>
                  {`${t('Fee')}: ${pairFee}%`}
                </div>
              </div>
            </div>

            <div className='flex items-center gap-6 text-sm text-neutral-400 max-xl:justify-end'>
              <div className={cn('flex flex-col justify-between')}>
                <span className='hidden text-base leading-5 font-normal text-nowrap text-neutral-300 max-xl:block'>
                  {`${t('Fee')}: ${pairFee}%`}
                </span>
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
            </div>

            <EmphasisButton
              className={cn('h-8! w-full py-2! text-xs! max-xl:hidden')}
              onClick={() => push(`/pools/add-liquidity?step=3&poolAddress=${pair.address}&back=4`)}
            >
              {t('Deposit')}
            </EmphasisButton>
          </div>

          {/* Stats in horizontal layout */}
          <PairBasicInfo pair={pair} className={cn('w-full')} />
          <EmphasisButton
            className='z-40 h-8 w-full rounded-md! text-xs! xl:hidden'
            onClick={() => {
              push(`/pools/add-liquidity?step=3&poolAddress=${pair.address}&back=4`)
            }}
          >
            {t('Deposit')}
          </EmphasisButton>
        </div>

        <div className='rounded-xl xl:hidden'>
          <Collapsible
            title={t('Analytics')}
            subtitle='TVL / Volume / Fees / Liquidity'
            previewContent={
              <div className='h-[143px] w-full overflow-hidden bg-[url("/images/line-chart.png")] bg-[length:100%_143px] bg-center bg-no-repeat' />
            }
            classNames={{ preview: 'px-0!', content: 'pb-4 pr-2 pl-0!', headerClosed: '-mt-9' }}
          >
            <PoolChart address={pair.address} showTitle={false} classNames={{ chart: 'px-4! analytics-chart' }} />
          </Collapsible>
        </div>

        <div className='max-xl:hidden'>
          <PoolChart address={pair.address} />
        </div>

        {pair.type === PAIR_TYPES.LSD && <PairStrategy pair={pair} />}
        <TransactionTable pair={pair} />
      </div>
    </LayoutWithBackButton>
  )
}
