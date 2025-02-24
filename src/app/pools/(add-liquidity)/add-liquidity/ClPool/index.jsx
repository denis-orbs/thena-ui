import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useMemo, useState } from 'react'
import { useSelector } from 'react-redux'

import ChooseStrategy from '@/components/common/AddLiquidity/ChooseStrategy'
import IconGroup from '@/components/icongroup'
import Skeleton from '@/components/skeleton'
import Tabs from '@/components/tabs'
import { NewTextHeading, Paragraph } from '@/components/typography'
import { PAIR_TYPES, UNKNOWN_LOGO } from '@/constant'
import { useCurrency, useGetAsset } from '@/hooks/fusion/Tokens'
import { cn, wrappedAddress } from '@/lib/utils'
import LiquidityChartRangeInput from '@/modules/Pools/LiquidityChartRangeInput'
import { PairDataTimeWindow } from '@/modules/SwapChart/fetch'
import { useFetchPairPrices } from '@/modules/SwapChart/hooks'
import PoolChart from '@/modules/SwapChart/PoolChart'
import { Bound } from '@/state/fusion/actions'
import { useV3DerivedMintInfo, useV3MintActionHandlers, useV3MintState } from '@/state/fusion/hooks'
import { usePairInfo } from '@/state/pools/hooks'

import AddLiquidityCLPane from './AddLiquidityCLPane'
import { PoolAttributesSection } from '../PoolAttributesSection'

function AddLiquidityClPool({ pool }) {
  const t = useTranslations()

  const [timeWindow, setTimeWindow] = useState(PairDataTimeWindow.YEAR)
  const { isReverse } = useSelector(state => state.fusion)
  const { strategy } = useV3MintState()

  const searchParams = useSearchParams()
  const poolAddress = searchParams.get('poolAddress') || pool?.address
  const firstAddress = searchParams.get('firstAddress') || pool?.token0?.address
  const secondAddress = searchParams.get('secondAddress') || pool?.token1?.address

  const firstAsset = useGetAsset(firstAddress)
  const secondAsset = useGetAsset(secondAddress)

  const currencyA = useCurrency(firstAddress)
  const currencyB = useCurrency(secondAddress)

  const baseCurrency = useMemo(() => (isReverse ? currencyB : currencyA), [isReverse, currencyA, currencyB])
  const quoteCurrency = useMemo(() => (isReverse ? currencyA : currencyB), [isReverse, currencyA, currencyB])

  const pair = usePairInfo({
    token0Address: wrappedAddress(firstAsset),
    token1Address: wrappedAddress(secondAsset),
    type: PAIR_TYPES.LSD,
    poolAddress,
  })

  const mintInfo = useV3DerivedMintInfo(baseCurrency, quoteCurrency, 3000, baseCurrency, undefined)
  const { [Bound.LOWER]: priceLower, [Bound.UPPER]: priceUpper } = useMemo(() => mintInfo.pricesAtTicks, [mintInfo])
  const { onLeftRangeInput, onRightRangeInput } = useV3MintActionHandlers(mintInfo.noLiquidity)

  const chartDomain = useMemo(() => {
    const leftPrice = isReverse ? priceUpper?.invert() : priceLower
    const rightPrice = isReverse ? priceLower?.invert() : priceUpper

    return leftPrice && rightPrice
      ? [parseFloat(leftPrice?.toSignificant(6)), parseFloat(rightPrice?.toSignificant(6))]
      : []
  }, [isReverse, priceLower, priceUpper])

  const price = useMemo(() => {
    if (!mintInfo.price) return
    return mintInfo.invertPrice ? mintInfo.price.invert().toSignificant(5) : mintInfo.price.toSignificant(5)
  }, [mintInfo])

  const periods = useMemo(
    () => [
      {
        label: '24H',
        active: timeWindow === PairDataTimeWindow.DAY,
        onClickHandler: () => {
          setTimeWindow(PairDataTimeWindow.DAY)
        },
      },
      {
        label: '1W',
        active: timeWindow === PairDataTimeWindow.WEEK,
        onClickHandler: () => {
          setTimeWindow(PairDataTimeWindow.WEEK)
        },
      },
      {
        label: '1M',
        active: timeWindow === PairDataTimeWindow.MONTH,
        onClickHandler: () => {
          setTimeWindow(PairDataTimeWindow.MONTH)
        },
      },
      {
        label: '1Y',
        active: timeWindow === PairDataTimeWindow.YEAR,
        onClickHandler: () => {
          setTimeWindow(PairDataTimeWindow.YEAR)
        },
      },
    ],
    [timeWindow],
  )

  const {
    data: pairPrices = [],
    isLoading,
    error,
  } = useFetchPairPrices({
    token0Address: quoteCurrency?.address,
    token1Address: baseCurrency?.address,
    timeWindow,
  })

  return (
    <>
      <h4 className='flex flex-row items-center gap-3 lg:gap-4 2xl:gap-8'>
        <IconGroup
          className='-space-x-1'
          classNames={{
            image: 'size-6 lg:size-10 2xl:size-[86px]',
          }}
          logo1={firstAsset?.logoURI ?? UNKNOWN_LOGO}
          logo2={secondAsset?.logoURI ?? UNKNOWN_LOGO}
        />
        <NewTextHeading> {t('Add Liquidity')}</NewTextHeading>
      </h4>

      <section className='mt-10 flex w-full flex-col gap-5 lg:flex-row'>
        <div id='LEFT-BLOCK' className='flex w-full flex-[6] flex-col gap-4 lg:gap-6'>
          <ChooseStrategy
            pairType={PAIR_TYPES.LSD}
            firstAsset={firstAsset}
            secondAsset={secondAsset}
            isReverse={isReverse}
            mintInfo={mintInfo}
          />

          <AddLiquidityCLPane
            pool={pair}
            quoteCurrency={quoteCurrency}
            baseCurrency={baseCurrency}
            mintInfo={mintInfo}
          />
        </div>

        <div id='RIGHT-BLOCK' className={cn('hidden flex-[4]', firstAddress && secondAddress && 'block')}>
          <div className='hidden flex-[4] flex-col gap-5 lg:flex'>
            {pair ? (
              <PoolAttributesSection strategy={strategy} pair={pair} />
            ) : (
              <div className='flex h-max flex-col gap-3 rounded-md bg-neutral-800 p-4'>
                <NewTextHeading className='!text-xl'>{t('New Deposit')}</NewTextHeading>
                <Paragraph className='font-medium leading-5'>{t('New Deposit CL description')}</Paragraph>
              </div>
            )}

            {strategy?.isAutomatic && (
              <div className='pt-8'>
                <NewTextHeading className='!text-xl font-semibold'>Liquidity Range</NewTextHeading>
                <LiquidityChartRangeInput
                  currencyA={baseCurrency ?? undefined}
                  currencyB={quoteCurrency ?? undefined}
                  feeAmount={mintInfo.dynamicFee}
                  ticksAtLimit={mintInfo.ticksAtLimit}
                  price={price ? parseFloat(price) : undefined}
                  priceLower={priceLower}
                  priceUpper={priceUpper}
                  onLeftRangeInput={onLeftRangeInput}
                  onRightRangeInput={onRightRangeInput}
                  interactive={false}
                  handleShow={!!strategy}
                />
              </div>
            )}

            <div className={cn('hidden', !strategy?.isAutomatic && priceLower && priceUpper && 'block')}>
              <div className='flex flex-col items-start gap-2 lg:flex-row lg:justify-between'>
                <NewTextHeading className='!text-xl font-semibold'>Price History</NewTextHeading>
                <Tabs data={periods} />
              </div>

              {isLoading ? (
                <Skeleton className='mt-2 flex h-[300px] items-center justify-center' />
              ) : (
                <div className='mt-2 flex h-[300px] items-center justify-center'>
                  {error ? (
                    <Paragraph>Failed to load price chart for this pair</Paragraph>
                  ) : (
                    <PoolChart
                      data={pairPrices}
                      timeWindow={timeWindow}
                      current={price ? parseFloat(price) : 0}
                      upper={Number(chartDomain[0] ?? 0)}
                      lower={Number(chartDomain[1] ?? 0)}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

export default AddLiquidityClPool
