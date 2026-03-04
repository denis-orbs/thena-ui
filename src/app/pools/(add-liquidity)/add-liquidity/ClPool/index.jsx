import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { WBNB } from 'thena-sdk-core'

import DepositCLPanel from '@/components/common/AddLiquidity/DepositCLPanel'
import FusionAdd from '@/components/common/AddLiquidity/FusionAdd'
import AutomaticStrategy from '@/components/common/AddLiquidity/FusionAdd/AutomaticStrategy'
import HeaderCLSection from '@/components/common/AddLiquidity/HeaderCLSection'
import { RangeAndPricePanel } from '@/components/common/AddLiquidity/RangeAndPricePanel'
import IconGroup from '@/components/icongroup'
import CircleImage from '@/components/image/CircleImage'
import Skeleton from '@/components/skeleton'
import { Paragraph, TextHeading } from '@/components/typography'
import { GAMMA_TYPES, ICHI_TYPES, MANUAL_TYPES, PAIR_TYPES, STRATEGY_TYPES } from '@/constant'
import { useVaults } from '@/context/vaultsContext'
import { useCurrency, useGetAsset } from '@/hooks/fusion/Tokens'
import { useNotStakedPositions } from '@/hooks/position/useNotStakedPosition'
import { useStakedPosition } from '@/hooks/position/useStakedPosition'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { usePositionInfo } from '@/hooks/usePositionInfo'
import { usePositionsLoading } from '@/hooks/usePositions'
import { useUpdateSearchParams } from '@/hooks/useUpdateSearchParams'
import AutomaticLiquidityChart from '@/modules/Pools/AutomaticLiquidityChart'
import { Bound, updateSelectedPreset, updateStrategy } from '@/state/fusion/actions'
import { useV3DerivedMintInfo, useV3MintActionHandlers, useV3MintState } from '@/state/fusion/hooks'
import { usePairInfo, usePools } from '@/state/pools/hooks'
import { useChainSettings } from '@/state/settings/hooks'
import cn from '@/utils/classes'
import { formatAmount, getDisplayedStrategy, getLiquidityRangeType, wrappedAddress } from '@/utils/utils'

function DepositIcon({ sub, title }) {
  if (ICHI_TYPES.includes(title)) {
    return (
      <div className='flex flex-col items-center gap-1.5'>
        <CircleImage alt={title} className='size-4' src={sub.allowed.logoURI} />
        <Paragraph className='text-xs text-neutral-400 xl:text-xs'>Deposit</Paragraph>
      </div>
    )
  }

  if (GAMMA_TYPES.includes(title)) {
    return (
      <div className='flex flex-col items-center gap-1'>
        <IconGroup
          className='*:not-first:-ml-2'
          classNames={{ image: 'outline-2 size-4' }}
          logo1={sub.token0.logoURI}
          logo2={sub.token1.logoURI}
        />
        <Paragraph className='text-xs text-neutral-400 xl:text-xs'>Deposit</Paragraph>
      </div>
    )
  }

  return null
}

const transformStrategy = sub => ({
  title: sub.title,
  tvl: sub.tvl?.toNumber() ?? sub.gauge?.tvl?.toNumber() ?? 0,
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
  isAutomatic: !MANUAL_TYPES.includes(sub.title),
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

function StrategyItem({ sub, t }) {
  return (
    <div className='flex flex-1 items-center justify-between'>
      <div>
        <TextHeading className='text-sm text-[10px]! leading-4! font-medium'>
          {getDisplayedStrategy(sub.title, sub.version)}
        </TextHeading>
        <div className='mt-0.5 flex flex-wrap gap-2'>
          <div className='flex items-center gap-1'>
            <TextHeading className='text-[10px]! leading-4! text-neutral-400'>{t('TVL')}:</TextHeading>
            <Paragraph className='text-xs text-[10px]! leading-4! font-medium text-neutral-300 xl:text-xs'>
              ${formatAmount(sub.tvl ?? sub.gauge.tvl)}
            </Paragraph>
          </div>
        </div>
      </div>

      <TextHeading className='text-primary-600 text-sm! leading-5! font-semibold'>
        {formatAmount(sub.gauge.apr, true)}%
      </TextHeading>

      <div className='flex flex-wrap justify-end gap-2'>
        <DepositIcon sub={sub} title={sub.title} />
      </div>
    </div>
  )
}

export const useGaugeAlive = (address = '') => {
  const pools = usePools()
  return pools.find(pool => pool.address.toLowerCase() === address?.toLowerCase())?.gauge?.isAlive
}

function AddLiquidityClPool({ pool, handleBack }) {
  const { networkId } = useChainSettings()
  const { isReverse } = useSelector(state => state.fusion)
  const { strategy } = useV3MintState()
  const prevStrategyRef = useRef()
  const dispatch = useDispatch()
  const t = useTranslations()
  const { isXlDown } = useMediaQuery()

  const searchParams = useSearchParams()
  const pairType = searchParams.get('type')
  const strategyParam = searchParams.get('strategy')

  const poolAddress = searchParams.get('poolAddress') || pool?.address
  const firstAddress = searchParams.get('firstAddress') || pool?.token0?.address
  const secondAddress = searchParams.get('secondAddress') || pool?.token1?.address
  const pid = searchParams.get('pid')

  // Logic for automated pool ex: ichi, gama
  const title = searchParams.get('title')
  const staked = searchParams.get('staked')
  const isStaked = useMemo(() => staked === 'true', [staked])

  const updateSearchParams = useUpdateSearchParams()

  const pools = usePools()
  const vaults = useVaults()
  const userPool = useMemo(
    () =>
      [...pools, ...vaults].find(
        item =>
          item.account.totalLp.gt(0) &&
          item?.basePool?.toLowerCase() === poolAddress?.toLowerCase() &&
          item.title === title,
      ),
    [poolAddress, pools, title, vaults],
  )

  const positionStaked = useStakedPosition(isStaked && userPool ? [userPool] : [])
  const positionNotStaked = useNotStakedPositions(!isStaked && userPool ? [userPool] : [])

  const manualPosition = usePositionInfo({ tokenId: pid, poolAddress, type: pairType })

  const position = title ? (isStaked ? positionStaked[0] : positionNotStaked[0]) : manualPosition
  const firstAsset = useGetAsset(firstAddress)
  const secondAsset = useGetAsset(secondAddress)

  const currencyA = useCurrency(firstAddress)
  const currencyB = useCurrency(secondAddress)

  const [firstCurrency, secondCurrency] = useMemo(
    () => (position ? [position.baseCurrency, position.quoteCurrency] : [currencyA, currencyB]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [position, currencyB?.wrapped?.address, currencyA?.wrapped?.address],
  )

  const [baseCurrency, setBaseCurrency] = useState(firstCurrency)
  const [quoteCurrency, setQuoteCurrency] = useState(secondCurrency)
  const [isAutomatic, setIsAutomatic] = useState(strategyParam === STRATEGY_TYPES.AUTO)
  const [lastPrice, setLastPrice] = useState(null)
  const [fullRangeWarningShown, setFullRangeWarningShown] = useState(true)

  useEffect(() => {
    setBaseCurrency(isReverse ? secondCurrency : firstCurrency)
    setQuoteCurrency(isReverse ? firstCurrency : secondCurrency)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firstCurrency?.wrapped?.address, secondCurrency?.wrapped?.address, isReverse])

  const isBaseBNB = useMemo(
    () => baseCurrency?.wrapped?.address?.toLowerCase() === WBNB[networkId].address.toLowerCase(),
    [baseCurrency?.wrapped?.address, networkId],
  )

  const isQuoteBNB = useMemo(
    () => quoteCurrency?.wrapped?.address?.toLowerCase() === WBNB[networkId].address.toLowerCase(),
    [networkId, quoteCurrency?.wrapped.address],
  )

  const pair = usePairInfo({
    token0Address: wrappedAddress(firstAsset),
    token1Address: wrappedAddress(secondAsset),
    type: PAIR_TYPES.LSD,
    poolAddress,
  })

  const existingPosition = useMemo(() => {
    if (position && position?._position) {
      return position?._position
    }
    return undefined
  }, [position])

  const mintInfo = useV3DerivedMintInfo(baseCurrency, quoteCurrency, 3000, baseCurrency, existingPosition)
  const { [Bound.LOWER]: priceLower, [Bound.UPPER]: priceUpper } = useMemo(() => mintInfo.pricesAtTicks, [mintInfo])
  const { onLeftRangeInput, onRightRangeInput, onChangeLiquidityRangeType } = useV3MintActionHandlers(
    mintInfo.noLiquidity,
  )

  useEffect(() => {
    onLeftRangeInput('')
    onRightRangeInput('')
    dispatch(updateSelectedPreset({ preset: null }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    updateSearchParams({
      strategy: isAutomatic ? STRATEGY_TYPES.AUTO : strategyParam,
    })
  }, [isAutomatic, strategyParam, updateSearchParams])

  useEffect(() => {
    if (!baseCurrency && firstCurrency && mintInfo.noLiquidity) {
      setBaseCurrency(firstCurrency)
    }
    if (!quoteCurrency && secondCurrency && mintInfo.noLiquidity) {
      setQuoteCurrency(secondCurrency)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    baseCurrency?.wrapped?.address,
    firstCurrency?.wrapped?.address,
    quoteCurrency?.wrapped?.address,
    secondCurrency?.wrapped?.address,
    mintInfo.noLiquidity,
  ])

  const currentPrice = useMemo(() => {
    if (position) {
      const isSorted = baseCurrency && quoteCurrency && baseCurrency?.wrapped.sortsBefore(quoteCurrency?.wrapped)
      return isSorted ? position.currentPrice : 1 / position.currentPrice
    }
    if (!mintInfo.price) return
    const price = mintInfo.invertPrice ? mintInfo.price.invert().toSignificant(5) : mintInfo.price.toSignificant(5)
    if (price) return parseFloat(price)
  }, [baseCurrency, mintInfo.invertPrice, mintInfo.price, position, quoteCurrency])

  const setStrategy = useCallback(
    strategyInfo => {
      // Prevent unnecessary updates
      if (prevStrategyRef.current?.address === strategyInfo?.address) return

      onLeftRangeInput('')
      onRightRangeInput('')
      dispatch(updateStrategy({ strategy: strategyInfo }))
      onChangeLiquidityRangeType(getLiquidityRangeType(strategyInfo?.title))

      prevStrategyRef.current = strategyInfo
    },
    [dispatch, onChangeLiquidityRangeType, onLeftRangeInput, onRightRangeInput],
  )

  useEffect(() => {
    if (strategyParam === null) {
      setIsAutomatic(strategy?.isAutomatic ?? strategyParam === STRATEGY_TYPES.AUTO)
    }
  }, [strategy?.isAutomatic, strategyParam])

  const sortedSubPools = useMemo(() => {
    const priority = {
      CL_Farming: 1,
      CL_SwapFee: 2,
      ICHI_Farming: 3,
      Narrow_Farming: 4,
      Wide_Farming: 5,
    }
    return (pair?.subpools || []).sort((a, b) => (priority[a.title] || 6) - (priority[b.title] || 6))
  }, [pair?.subpools])

  // Stable callback for choosing strategy
  const handleChooseStrategy = useCallback(
    sub => {
      if (!sub) return setStrategy(null)

      const transformedStrategy = transformStrategy(sub)
      const _isAutomatic = transformedStrategy.isAutomatic

      setIsAutomatic(_isAutomatic)
      setStrategy(transformedStrategy)
    },
    [setIsAutomatic, setStrategy],
  )

  const strategyAutoData = useMemo(
    () =>
      sortedSubPools
        .filter(item => !MANUAL_TYPES.includes(item.title))
        .map(sub => ({
          content: <StrategyItem sub={sub} t={t} />,
          active: strategy?.address === sub.address,
          onClickHandler: () => strategy?.address !== sub.address && handleChooseStrategy(sub),
        })),
    [sortedSubPools, strategy?.address, handleChooseStrategy, t],
  )

  const isLoadingPositions = usePositionsLoading()
  const isLoading = useMemo(() => {
    if (pair && isLoadingPositions && (pairType === 'CL_Farming' || pairType === 'CL_SwapFee' || !isAutomatic)) {
      return true
    }
    return false
  }, [isAutomatic, isLoadingPositions, pair, pairType])

  useEffect(() => {
    if (position && (!strategy || strategy?.title !== position.title)) {
      setStrategy({
        title: position?.title,
        tvl: position?.tvl?.toNumber() ?? 0,
        apr: position?.gauge?.apr?.toNumber() ?? 0,
        account: {
          totalLp: position?.account?.totalLp?.toNumber(),
          gaugeBalance: position?.account?.gaugeBalance?.toNumber(),
        },
        allowed: position?.allowed,
        token0: {
          ...position?.token0,
          reserve: position?.token0?.reserve?.toNumber(),
          balance: position?.token0?.balance?.toNumber(),
          totalValue: position?.token0?.totalValue,
        },
        token1: {
          ...position?.token1,
          reserve: position?.token1?.reserve?.toNumber(),
          balance: position?.token1?.balance?.toNumber(),
          totalValue: position?.token1?.totalValue,
        },
        address: position?.address,
        isFarming: position?.title?.includes('Farming'),
        isAutomatic: !MANUAL_TYPES.includes(position?.title) && position?.type === PAIR_TYPES.LSD,
        isDefault: true,
        version: position.version,
        fee: position?.fee,
      })
    }
  }, [strategy, position, setStrategy])

  useEffect(() => {
    if (strategyParam === STRATEGY_TYPES.AUTO && !position && !strategy?.isAutomatic) {
      setStrategy(sortedSubPools.find(sub => !MANUAL_TYPES.includes(sub.title)))
    }
  }, [strategyParam, sortedSubPools, setStrategy, position, strategy?.isAutomatic])

  const gaugeAlive = useGaugeAlive(pair?.address)

  return (
    <>
      <div className='flex flex-col gap-4'>
        <HeaderCLSection
          firstAsset={currencyA}
          secondAsset={currencyB}
          mintInfo={mintInfo}
          pair={pair}
          position={position}
          isAutomatic={isAutomatic}
          setIsAutomatic={setIsAutomatic}
          setFullRangeWarningShown={setFullRangeWarningShown}
          fullRangeWarningShown={fullRangeWarningShown}
          lastPrice={lastPrice}
          type={pairType}
          isLoading={isLoading}
        />
        {isLoading ? (
          <Skeleton className='h-[400px]' />
        ) : (
          <>
            {!strategy?.isAutomatic && !isAutomatic ? (
              <RangeAndPricePanel
                currencyA={baseCurrency ?? undefined}
                currencyB={quoteCurrency ?? undefined}
                mintInfo={mintInfo}
                currentPrice={currentPrice}
                position={position}
                priceLower={priceLower}
                priceUpper={priceUpper}
                onLeftRangeInput={onLeftRangeInput}
                onRightRangeInput={onRightRangeInput}
                setLastPrice={setLastPrice}
                viewMode={Boolean(position)}
                pair={pair}
              />
            ) : (
              <div
                className={cn(
                  'grid grid-cols-1 gap-8 rounded-xl bg-neutral-900 p-4 outline-1 outline-neutral-600 xl:grid-cols-[1fr_368px]',
                  !position && 'pb-2.5',
                )}
              >
                <AutomaticLiquidityChart
                  label='Liquidity Range'
                  currencyA={currencyA ?? undefined}
                  currencyB={currencyB ?? undefined}
                  strategy={strategy}
                  position={null}
                  pair={pair}
                  handleShow={!!strategy}
                />
                {strategyAutoData.length > 0 && !position && (
                  <AutomaticStrategy
                    classNames={{ item: 'bg-neutral-950 max-h-[73px]' }}
                    strategyAutoData={strategyAutoData}
                    isGrid={false}
                  />
                )}
                {position && (
                  <div className='flex flex-col justify-end gap-4'>
                    <FusionAdd
                      gaugeAlive={gaugeAlive}
                      label={`${getDisplayedStrategy(position.title)} Strategy`}
                      strategy={strategy}
                      onShowModalSuccess={() => {}}
                      handleBack={handleBack}
                      isSmall={!isXlDown}
                      classNames={{ wrapperInput: 'grid grid-cols-1! xl:grid-cols-1 gap-2', input: 'bg-neutral-950' }}
                    />
                  </div>
                )}
              </div>
            )}
            {!position && (
              <DepositCLPanel
                baseCurrency={baseCurrency}
                quoteCurrency={quoteCurrency}
                setBaseCurrency={isBaseBNB ? setBaseCurrency : null}
                setQuoteCurrency={isQuoteBNB ? setQuoteCurrency : null}
                mintInfo={mintInfo}
                currentPrice={currentPrice}
                strategy={strategy}
                position={position}
                handleBack={handleBack}
                pair={pair}
              />
            )}
          </>
        )}
      </div>
    </>
  )
}

export default AddLiquidityClPool
