import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useMemo, useState } from 'react'
import { useSelector } from 'react-redux'

import ChooseStrategy from '@/components/common/AddLiquidity/ChooseStrategy'
import IconGroup from '@/components/icongroup'
import Skeleton from '@/components/skeleton'
import Tabs from '@/components/tabs'
import { Paragraph, TextHeading } from '@/components/typography'
import { PAIR_TYPES, UNKNOWN_LOGO } from '@/constant'
import { useFusionPairs } from '@/context/fusionsContext'
import { usePairs } from '@/context/pairsContext'
import { useCurrency, useGetAsset } from '@/hooks/fusion/Tokens'
import { cn, wrappedAddress } from '@/lib/utils'
import LiquidityChartRangeInput from '@/modules/Pools/LiquidityChartRangeInput'
import { PairDataTimeWindow } from '@/modules/SwapChart/fetch'
import { useFetchPairPrices } from '@/modules/SwapChart/hooks'
import PoolChart from '@/modules/SwapChart/PoolChart'
import { Bound } from '@/state/fusion/actions'
import { useV3DerivedMintInfo, useV3MintActionHandlers, useV3MintState } from '@/state/fusion/hooks'

import AddLiquidityCLPane from './AddLiquidityCLPane'
import { PoolAttributesSection } from '../PoolAttributesSection'

function AddLiquidityClPool({ pool, isAdd = false }) {
  const t = useTranslations()

  const [timeWindow, setTimeWindow] = useState(PairDataTimeWindow.YEAR)
  const { isReverse } = useSelector(state => state.fusion)
  const { strategy } = useV3MintState()

  const searchParams = useSearchParams()
  const firstAddress = searchParams.get('firstAddress') || pool?.token0?.address
  const secondAddress = searchParams.get('secondAddress') || pool?.token1?.address

  const firstAsset = useGetAsset(firstAddress)
  const secondAsset = useGetAsset(secondAddress)

  const currencyA = useCurrency(firstAddress)
  const currencyB = useCurrency(secondAddress)

  const baseCurrency = useMemo(() => (isReverse ? currencyB : currencyA), [isReverse, currencyA, currencyB])
  const quoteCurrency = useMemo(() => (isReverse ? currencyA : currencyB), [isReverse, currencyA, currencyB])

  const { pairs } = usePairs()
  const fusionPairs = useFusionPairs()
  const pair = useMemo(() => {
    const found = (pairs ?? []).find(
      ele =>
        [ele.token0?.address, ele.token1?.address].includes(wrappedAddress(firstAsset)) &&
        [ele.token0?.address, ele.token1?.address].includes(wrappedAddress(secondAsset)) &&
        ele.type === PAIR_TYPES.LSD,
    )
    if (!found) return
    const fusionPool = (fusionPairs ?? []).find(ele => found?.address?.toLowerCase() === ele.address)
    return {
      ...found,
      currentTick: Number(fusionPool?.globalState.tick || 0),
    }
  }, [firstAsset, fusionPairs, pairs, secondAsset])

  const mintInfo = useV3DerivedMintInfo(baseCurrency, quoteCurrency, 3000, baseCurrency, undefined)
  const { [Bound.LOWER]: priceLower, [Bound.UPPER]: priceUpper } = useMemo(() => mintInfo.pricesAtTicks, [mintInfo])
  const { onLeftRangeInput, onRightRangeInput } = useV3MintActionHandlers(mintInfo.noLiquidity)

  const chartDomain = useMemo(() => {
    const leftPrice = isReverse ? priceLower : priceUpper?.invert()
    const rightPrice = isReverse ? priceUpper : priceLower?.invert()

    return leftPrice && rightPrice
      ? [parseFloat(leftPrice?.toSignificant(6)), parseFloat(rightPrice?.toSignificant(6))]
      : undefined
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
      <h3 className='flex flex-row items-center gap-3'>
        <IconGroup
          className='-space-x-1'
          classNames={{
            image: 'outline-4 w-16 h-16',
          }}
          logo1={firstAsset?.logoURI ?? UNKNOWN_LOGO}
          logo2={secondAsset?.logoURI ?? UNKNOWN_LOGO}
        />
        <TextHeading className='font-archia text-3xl font-semibold leading-[96px] lg:text-[96px]'>
          {t('Add Concentrated Liquidity')}
        </TextHeading>
      </h3>

      <section className='mt-10 flex w-full flex-col gap-5 lg:flex-row'>
        <div id='LEFT-BLOCK' className='flex w-full flex-[6] flex-col gap-4 lg:gap-6'>
          <ChooseStrategy
            pairType={PAIR_TYPES.LSD}
            firstAsset={firstAsset}
            secondAsset={secondAsset}
            isReverse={isReverse}
            isAdd={isAdd}
          />

          <AddLiquidityCLPane
            pool={pair}
            isAdd={isAdd}
            quoteCurrency={quoteCurrency}
            baseCurrency={baseCurrency}
            mintInfo={mintInfo}
          />
        </div>

        <div id='RIGHT-BLOCK' className={cn('hidden flex-[4]', firstAddress && secondAddress && 'block')}>
          <div className='hidden flex-[4] flex-col gap-5 lg:flex'>
            <PoolAttributesSection strategy={strategy} pair={pair} />

            {strategy?.isAutomatic && (
              <div className='pt-8'>
                <TextHeading className='font-semibold'>Liquidity Range</TextHeading>
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
                <h6 className='font-bold'>Historical price</h6>
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
                      upper={Number(chartDomain?.leftPrice ?? 0)}
                      lower={Number(chartDomain?.rightPrice ?? 0)}
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
