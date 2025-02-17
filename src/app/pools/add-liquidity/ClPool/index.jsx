import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useMemo, useState } from 'react'
import { useSelector } from 'react-redux'

import Box from '@/components/box'
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
import { NormalPoolAttributes, PoolAttributesCL } from '@/modules/Pools/PoolAttributes'
import { PairDataTimeWindow } from '@/modules/SwapChart/fetch'
import { useFetchPairPrices } from '@/modules/SwapChart/hooks'
import PoolChart from '@/modules/SwapChart/PoolChart'
import { Bound } from '@/state/fusion/actions'
import { useV3DerivedMintInfo, useV3MintActionHandlers, useV3MintState } from '@/state/fusion/hooks'
import { InfoCircleWhite } from '@/svgs'

import AddLiquidityCLPane from './AddLiquidityCLPane'

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
  const { onLeftRangeInput, onRightRangeInput } = useV3MintActionHandlers(mintInfo.noLiquidity)
  const { [Bound.LOWER]: priceLower, [Bound.UPPER]: priceUpper } = useMemo(() => mintInfo.pricesAtTicks, [mintInfo])
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
    token0Address: wrappedAddress(firstAsset),
    token1Address: wrappedAddress(secondAsset),
    timeWindow,
  })

  const minValue = useMemo(
    () => pairPrices.reduce((min, current) => (current.value < min.value ? current : min), pairPrices[0]),
    [pairPrices],
  )

  const maxValue = useMemo(
    () => pairPrices.reduce((max, current) => (current.value > max.value ? current : max), pairPrices[0]),
    [pairPrices],
  )

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
        <div className='flex w-full flex-[6] flex-col gap-4 lg:gap-6'>
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

        <div className={cn('hidden flex-[4]', firstAddress && secondAddress && 'block')}>
          <div className='hidden flex-[4] flex-col gap-5 lg:flex'>
            <PoolInfo strategy={strategy} pair={pair} />

            {mintInfo?.strategy?.isAutomatic && (
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

            <div className={cn('hidden', priceLower && priceUpper && 'block')}>
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
                      upper={maxValue?.value}
                      lower={minValue?.value}
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

export function PoolInfo({ strategy, pair }) {
  const t = useTranslations()
  const [show, setShow] = useState(false)

  return (
    <Box className='bg-neutral-800'>
      <TextHeading className='flex w-full items-center justify-between font-archia text-3xl font-semibold text-neutral-50'>
        <h3>{t('Pool Attributes')}</h3>
        <i
          onClick={() => setShow(!show)}
          className={cn(
            'flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg ',
            show ? 'bg-neutral-600' : 'bg-neutral-700',
          )}
        >
          <InfoCircleWhite className='h-5 w-5 stroke-neutral-400' />
        </i>
      </TextHeading>

      <div className={cn('mt-5 overflow-hidden', show ? 'block' : 'hidden')}>
        {pair.type === PAIR_TYPES.LSD ? (
          <>{strategy && pair && <PoolAttributesCL strategy={strategy} pool={pair} />}</>
        ) : (
          <>{pair && <NormalPoolAttributes pool={pair} />}</>
        )}
      </div>
    </Box>
  )
}

export default AddLiquidityClPool
