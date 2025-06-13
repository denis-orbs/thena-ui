'use client'

import { useTranslations } from 'next-intl'
import React, { useEffect, useMemo } from 'react'
import { useDispatch } from 'react-redux'
import useSWR from 'swr'

import { fetchDefiedgeInfo } from '@/components/common/AddLiquidity/FusionAdd/DefiedgeAdd'
import { fetchGammaInfo } from '@/components/common/AddLiquidity/FusionAdd/GammaAdd'
import Highlight from '@/components/highlight'
import Selection from '@/components/selection'
import CustomTooltip from '@/components/tooltip'
import { Paragraph, TextHeading } from '@/components/typography'
import { FusionRangeType, GAMMA_TYPES, ICHI_TYPES } from '@/constant'
import { ichiVaultAbi } from '@/constant/abi/fusion'
import { useFusionPairs } from '@/context/fusionsContext'
import { usePairs } from '@/context/pairsContext'
import { useCurrency } from '@/hooks/fusion/Tokens'
import { callMulti } from '@/lib/contractActions'
import { cn, formatAmount, unwrappedSymbol, wrappedAddress } from '@/lib/utils'
import { Bound, setInitialTokenPrice, updateIsReverse, updateSelectedPreset } from '@/state/fusion/actions'
import { useV3DerivedMintInfo, useV3MintActionHandlers } from '@/state/fusion/hooks'
import { useChainSettings } from '@/state/settings/hooks'
import { InfoCircleWhite } from '@/svgs'

import LiquidityChartRangeInput from './LiquidityChartRangeInput'

const feeAmount = 3000

const fetchIchiInfo = async (chainId, strategy) => {
  const values = await callMulti([
    {
      address: strategy.address,
      abi: ichiVaultAbi,
      functionName: 'baseLower',
      args: [],
      chainId,
    },
    {
      address: strategy.address,
      abi: ichiVaultAbi,
      functionName: 'baseUpper',
      args: [],
      chainId,
    },
    {
      address: strategy.address,
      abi: ichiVaultAbi,
      functionName: 'currentTick',
      args: [],
      chainId,
    },
  ])
  const lowerValue = 1.0001 ** Number(values[0] - values[2])
  const upperValue = 1.0001 ** Number(values[1] - values[2])
  return {
    type: strategy.title,
    title: strategy.title,
    address: strategy.address,
    min: lowerValue,
    max: upperValue,
  }
}

const fetchStrategyInfo = async (chainId, strategy, currentTick) => {
  let preset
  if (GAMMA_TYPES.includes(strategy.title)) {
    preset = await fetchGammaInfo(chainId, strategy)
  } else if (strategy.title === 'DefiEdge') {
    preset = await fetchDefiedgeInfo(chainId, strategy, currentTick)
  } else if (ICHI_TYPES.includes(strategy.title)) {
    preset = await fetchIchiInfo(chainId, strategy, currentTick)
  }
  return preset
}

export default function LiquidityCharts({
  pairType,
  firstAsset,
  secondAsset,
  strategy,
  setStrategy,
  isReverse,
  isModal,
}) {
  const dispatch = useDispatch()
  const { networkId } = useChainSettings()
  const { pairs } = usePairs()
  const fusionPairs = useFusionPairs()
  const t = useTranslations()

  const pair = useMemo(() => {
    const found = (pairs ?? []).find(
      ele =>
        [ele.token0?.address, ele.token1?.address].includes(wrappedAddress(firstAsset)) &&
        [ele.token0?.address, ele.token1?.address].includes(wrappedAddress(secondAsset)) &&
        pairType === ele.type,
    )
    if (!found) return
    const pool = (fusionPairs ?? []).find(ele => found.address.toLowerCase() === ele.address)
    return {
      ...found,
      currentTick: Number(pool?.globalState.tick || 0),
    }
  }, [pairs, fusionPairs, firstAsset, secondAsset, pairType])

  const { data: preset } = useSWR(
    strategy && pair && ['strategy/info', strategy.address],
    () => fetchStrategyInfo(networkId, strategy, pair.currentTick),
    {
      refreshInterval: 0,
    },
  )
  const baseCurrency = useCurrency(!isReverse ? firstAsset.address : secondAsset.address)
  const quoteCurrency = useCurrency(!isReverse ? secondAsset.address : firstAsset.address)
  const mintInfo = useV3DerivedMintInfo(
    baseCurrency ?? undefined,
    quoteCurrency ?? undefined,
    feeAmount,
    baseCurrency ?? undefined,
    undefined,
    strategy?.version ?? 3,
  )

  const { onChangePresetRange, onLeftRangeInput, onRightRangeInput, onStartPriceInput, onChangeLiquidityRangeType } =
    useV3MintActionHandlers(mintInfo.noLiquidity)

  const price = useMemo(() => {
    if (!mintInfo.price) return

    return mintInfo.invertPrice ? mintInfo.price.invert().toSignificant(5) : mintInfo.price.toSignificant(5)
  }, [mintInfo])

  const currentPrice = useMemo(() => {
    if (!mintInfo.price) return

    const _price = mintInfo.invertPrice
      ? parseFloat(mintInfo.price.invert().toSignificant(5))
      : parseFloat(mintInfo.price.toSignificant(5))

    if (Number(_price) <= 0.0001) {
      return '< 0.0001'
    }
    return `${_price}`
  }, [mintInfo.price, mintInfo.invertPrice])

  const { [Bound.LOWER]: priceLower, [Bound.UPPER]: priceUpper } = useMemo(() => mintInfo.pricesAtTicks, [mintInfo])

  useEffect(() => {
    if (!price) return

    dispatch(updateSelectedPreset({ preset: preset ? preset.type : null }))

    onLeftRangeInput(preset ? String(+price * preset.min) : '')
    onRightRangeInput(preset ? String(+price * preset.max) : '')
    onChangePresetRange(preset)
    if (strategy) {
      onChangeLiquidityRangeType(
        GAMMA_TYPES.includes(strategy.title)
          ? FusionRangeType.GAMMA_RANGE
          : strategy.title === 'DefiEdge'
            ? FusionRangeType.DEFIEDGE_RANGE
            : FusionRangeType.ICHI_RANGE,
      )
    }
  }, [
    preset,
    strategy,
    dispatch,
    onChangePresetRange,
    onLeftRangeInput,
    onRightRangeInput,
    onChangeLiquidityRangeType,
    price,
  ])

  const automaticStrategiesData = useMemo(() => {
    if (!pair || !pair.subpools.length) return []
    return pair.subpools.map(sub => ({
      label: (
        <>
          <span>{GAMMA_TYPES.includes(sub.title) ? 'Gamma' : sub.title}</span>
          <br />
          <span className='text-sm text-white'>{t('APR')}: </span>
          <span className='text-sm text-neutral-300'>{formatAmount(sub.gauge.apr)}%</span>{' '}
          <span className='text-sm text-white'>{t('TVL')}: </span>
          <span className='text-sm text-neutral-300'>${formatAmount(sub.gauge.tvl)}</span>
        </>
      ),
      title: GAMMA_TYPES.includes(sub.title) ? 'Gamma' : sub.title,
      active: strategy?.address === sub.address,
      onClickHandler: () => {
        setStrategy(sub)
        dispatch(updateSelectedPreset({ preset: null }))
        dispatch(setInitialTokenPrice({ typedValue: '' }))
        onStartPriceInput('')
        onLeftRangeInput('')
        onRightRangeInput('')
      },
    }))
  }, [pair, strategy, setStrategy, t, dispatch, onLeftRangeInput, onRightRangeInput, onStartPriceInput])

  // const strategiesSelections = useMemo(
  //   () => [
  //     {
  //       label: 'Manual Strategy',
  //       title: 'Manual Strategy',
  //       active: strategy === null,
  //       onClickHandler: () => {
  //         setStrategy(null)
  //         dispatch(updateSelectedPreset({ preset: null }))
  //         dispatch(setInitialTokenPrice({ typedValue: '' }))
  //         onStartPriceInput('')
  //         onLeftRangeInput('')
  //         onRightRangeInput('')
  //         onChangeLiquidityRangeType(FusionRangeType.MANUAL_RANGE)
  //       },
  //     },
  //     ...automaticStrategiesData,
  //   ],
  //   [
  //     dispatch,
  //     onLeftRangeInput,
  //     onRightRangeInput,
  //     onStartPriceInput,
  //     onChangeLiquidityRangeType,
  //     strategy,
  //     setStrategy,
  //     automaticStrategiesData,
  //   ],
  // )

  const tokenSelection = useMemo(
    () => [
      {
        label: firstAsset.symbol,
        active: !isReverse,
        onClickHandler: () => {
          dispatch(updateIsReverse({ isReverse: false }))
        },
      },
      {
        label: secondAsset.symbol,
        active: isReverse,
        onClickHandler: () => {
          dispatch(updateIsReverse({ isReverse: true }))
        },
      },
    ],
    [firstAsset.symbol, isReverse, secondAsset.symbol, dispatch],
  )

  return mintInfo.strategy ? (
    <>
      <div className={cn('inline-flex w-full flex-col gap-5', isModal && 'p-3 lg:px-6')}>
        <div className='flex flex-col gap-5'>
          <div className='flex flex-row items-center justify-between gap-3'>
            {/* <StrategiesDropdown
              className='w-[220px]'
              data={strategiesSelections}
              selected={strategiesSelections.find(e => e.active)?.title}
              isLocale={false}
              setSelected={() => {}}
              placeHolder='Choose Category'
            /> */}
            <Selection isTranslation={false} isSmall isFull={false} data={tokenSelection} className='block h-fit' />
          </div>

          <div className='mt-6 flex flex-col gap-5'>
            {!mintInfo.noLiquidity && automaticStrategiesData && (
              <div className='relative'>
                <div className='absolute top-4 left-1/2 mb-2 flex w-full -translate-x-1/2 items-center justify-center lg:-top-[20px]'>
                  <TextHeading className='text-sm'>
                    {t('Current Price: [price] [symbolA] [symbolB]', {
                      price: currentPrice,
                      symbolA: unwrappedSymbol(quoteCurrency),
                      symbolB: unwrappedSymbol(baseCurrency),
                    })}
                  </TextHeading>
                </div>
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
                  interactive={mintInfo.liquidityRangeType === 'manual'}
                  // handleShow
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <CustomTooltip id='management-tooltip' className='max-w-[320px]'>
        <div className='flex flex-col gap-2'>
          <TextHeading className='text-sm'>{t('How to Choose a Strategy')}</TextHeading>
          <Paragraph className='text-xs'>{t('Automatic Strategy description')}</Paragraph>
          <Paragraph className='text-xs'>{t('Manual Strategy description')}</Paragraph>
        </div>
      </CustomTooltip>
    </>
  ) : (
    <div className='flex w-full flex-col items-center justify-center gap-4 px-6 py-[120px]'>
      <Highlight>
        <InfoCircleWhite className='h-4 w-4' />
      </Highlight>
      <div className='flex flex-col items-center gap-3'>
        <h2>{t('Select Pool Strategy')}</h2>
        <Paragraph className='mt-3 text-center'>
          {t("You have to select the pool strategy first to see it's [symbol]", { text: 'liquidity' })}
        </Paragraph>
      </div>
    </div>
  )
}
