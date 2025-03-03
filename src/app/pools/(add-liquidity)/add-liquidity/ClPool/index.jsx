import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useMemo, useState } from 'react'
import { useSelector } from 'react-redux'

import ChooseStrategy from '@/components/common/AddLiquidity/ChooseStrategy'
import NewIconGroup from '@/components/icongroup/NewIconGroup'
import Skeleton from '@/components/skeleton'
import Tabs from '@/components/tabs'
import { NewTextHeading, Paragraph } from '@/components/typography'
import { PAIR_TYPES, UNKNOWN_LOGO } from '@/constant'
import { useCurrency, useGetAsset } from '@/hooks/fusion/Tokens'
import { usePositionInfo } from '@/hooks/usePositionInfo'
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
  const [timeWindow, setTimeWindow] = useState(PairDataTimeWindow.WEEK)
  const { isReverse } = useSelector(state => state.fusion)
  const { strategy } = useV3MintState()

  const searchParams = useSearchParams()
  const type = searchParams.get('type')
  const poolAddress = searchParams.get('poolAddress') || pool?.address
  const firstAddress = searchParams.get('firstAddress') || pool?.token0?.address
  const secondAddress = searchParams.get('secondAddress') || pool?.token1?.address
  const pid = searchParams.get('pid')

  const position = usePositionInfo({ tokenId: pid, poolAddress, type })
  const firstAsset = useGetAsset(firstAddress)
  const secondAsset = useGetAsset(secondAddress)

  const currencyA = useCurrency(firstAddress)
  const currencyB = useCurrency(secondAddress)

  const [baseCurrency, quoteCurrency] = useMemo(
    () =>
      position
        ? [position.baseCurrency, position.quoteCurrency]
        : isReverse
          ? [currencyB, currencyA]
          : [currencyA, currencyB],
    [position, isReverse, currencyB, currencyA],
  )

  const pair = usePairInfo({
    token0Address: wrappedAddress(firstAsset),
    token1Address: wrappedAddress(secondAsset),
    type: PAIR_TYPES.LSD,
    poolAddress,
  })

  const mintInfo = useV3DerivedMintInfo(baseCurrency, quoteCurrency, 3000, baseCurrency, undefined)
  const { [Bound.LOWER]: priceLower, [Bound.UPPER]: priceUpper } = useMemo(() => mintInfo.pricesAtTicks, [mintInfo])
  const { onLeftRangeInput, onRightRangeInput } = useV3MintActionHandlers(mintInfo.noLiquidity)
  // console.log(priceLower?.toSignificant(6), priceUpper?.toSignificant(6))

  const chartDomain = useMemo(() => {
    const leftPrice = isReverse ? priceLower?.invert() : priceUpper
    const rightPrice = isReverse ? priceUpper?.invert() : priceLower

    return leftPrice && rightPrice
      ? [parseFloat(leftPrice?.toSignificant(6)), parseFloat(rightPrice?.toSignificant(6))]
      : []
  }, [isReverse, priceLower, priceUpper])

  const currentPrice = useMemo(() => {
    if (position) return position.currentPrice
    if (!mintInfo.price) return
    const price = mintInfo.invertPrice ? mintInfo.price.invert().toSignificant(5) : mintInfo.price.toSignificant(5)
    if (price) return parseFloat(price)
  }, [mintInfo.invertPrice, mintInfo.price, position])

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
    token0Address: wrappedAddress(quoteCurrency),
    token1Address: wrappedAddress(baseCurrency),
    timeWindow,
  })

  return (
    <>
      <h4 className='flex flex-row items-center gap-2 lg:gap-4 2xl:gap-8'>
        <NewIconGroup logo1={firstAsset?.logoURI ?? UNKNOWN_LOGO} logo2={secondAsset?.logoURI ?? UNKNOWN_LOGO} />
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
            pair={pair}
            position={position}
          />

          <AddLiquidityCLPane
            pool={pair}
            baseCurrency={baseCurrency}
            quoteCurrency={quoteCurrency}
            mintInfo={mintInfo}
            position={position}
          />
        </div>

        <div id='RIGHT-BLOCK' className={cn('hidden flex-[4]', firstAddress && secondAddress && 'block')}>
          <div className='hidden flex-[4] flex-col gap-5 lg:flex'>
            {pair ? (
              <div className={cn({ 'mt-[101px]': !!position })}>
                <PoolAttributesSection strategy={strategy} pair={pair} />
              </div>
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
                  ticksAtLimit={position?.ticksAtLimit ?? mintInfo.ticksAtLimit}
                  price={currentPrice}
                  priceLower={position ? position.priceLower : priceLower}
                  priceUpper={position ? position.priceUpper : priceUpper}
                  onLeftRangeInput={onLeftRangeInput}
                  onRightRangeInput={onRightRangeInput}
                  interactive={false}
                  handleShow={!!strategy}
                />
              </div>
            )}

            <div className={cn('hidden', !strategy?.isAutomatic && 'block')}>
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
                      current={Number(currentPrice)}
                      upper={Number(position?.maxPrice ?? chartDomain[0] ?? 0)}
                      lower={Number(position?.minPrice ?? chartDomain[1] ?? 0)}
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
