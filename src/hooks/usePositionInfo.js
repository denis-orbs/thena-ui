import BigNumber from 'bignumber.js'
import { useCallback, useMemo, useState } from 'react'
import { CurrencyAmount } from 'thena-sdk-core'
import { nearestUsableTick, Position, TICK_SPACING, TickMath } from 'thenafi-fusion-sdk'

import { PAIR_TYPES, ZERO_ADDRESS } from '@/constant'
import { useManuals } from '@/context/manualsContext'
import { usePairs } from '@/context/pairsContext'
import { getTickToPrice, maxAmountSpend, tryParseAmount } from '@/lib/fusion'
import { formatTickPrice } from '@/lib/fusion/formatTickPrice'
import { formatAmount, formatAmountLP } from '@/lib/utils'
import { Bound, Field } from '@/state/fusion/actions'

import { useCurrency } from './fusion/Tokens'
import { useCurrencyBalances } from './fusion/useCurrencyBalances'
import { useCalculateAPR } from './fusion/useEstimateAPR'
import { useFusionState } from './fusion/useFusions'
import usePrevious from './usePrevious'

export const usePositionInfo = ({ tokenId, poolAddress, type }) => {
  const { pairs } = usePairs()
  const manuals = useManuals()
  const [independentField, setIndependentField] = useState(Field.CURRENCY_A)
  const [typedValue, setTypedValue] = useState('')

  const pair = useMemo(() => {
    const lowerAddress = poolAddress?.toLowerCase()
    return pairs.find(
      ({ address, addressPoolFee }) =>
        address.toLowerCase() === lowerAddress || addressPoolFee?.toLowerCase() === lowerAddress,
    )
  }, [poolAddress, pairs])

  const userPools = useMemo(() => {
    if (!pair) return []

    const subPoolsPositions = (pair?.subpools || []).filter(({ account }) => account.totalLp.gt(0))

    if (pair.type !== PAIR_TYPES.LSD) {
      const v3Pos = subPoolsPositions.find(({ account }) => account.version === 3)
      const v2Pos = subPoolsPositions.find(({ account }) => account.version === 2)

      if (v3Pos && v2Pos && v2Pos.account.walletBalance.gt(0)) {
        v2Pos.account.walletBalance = new BigNumber(0)
      }
    }

    return subPoolsPositions
  }, [pair])

  const userManuals = useMemo(() => {
    if (!pair || pair.type === PAIR_TYPES.WEIGHTED) return []

    const { token0, token1 } = pair
    const token0Address = token0.address.toLowerCase()
    const token1Address = token1.address.toLowerCase()

    return manuals.filter(
      ({ token0Address: manualToken0, token1Address: manualToken1 }) =>
        [token0Address, token1Address].includes(manualToken0.toLowerCase()) &&
        [token0Address, token1Address].includes(manualToken1.toLowerCase()),
    )
  }, [manuals, pair])

  const userPositions = useMemo(() => [...userPools, ...userManuals].filter(Boolean), [userManuals, userPools])
  const pool = useMemo(() => userPositions.find(({ tokenId: id }) => id === Number(tokenId)), [tokenId, userPositions])
  const subpool = useMemo(() => (pair?.subpools || []).find(({ title }) => title === type), [pair?.subpools, type])

  const { asset0, asset1, liquidity, tickLower, tickUpper, version } = pool || {}

  const currencyA = useCurrency(asset0?.address)
  const currencyB = useCurrency(asset1?.address)
  const currencies = useMemo(
    () => ({
      [Field.CURRENCY_A]: currencyA,
      [Field.CURRENCY_B]: currencyB,
    }),
    [currencyA, currencyB],
  )
  // formatted with tokens
  const [tokenA, tokenB] = useMemo(() => [currencyA?.wrapped, currencyB?.wrapped], [currencyA, currencyB])

  const balances = useCurrencyBalances([currencies[Field.CURRENCY_A], currencies[Field.CURRENCY_B]])
  const currencyBalances = useMemo(
    () => ({
      [Field.CURRENCY_A]: balances[0],
      [Field.CURRENCY_B]: balances[1],
    }),
    [balances],
  )

  const independentCurrency = useMemo(() => currencies[independentField], [currencies, independentField])

  const [fusionState, fusion] = useFusionState({
    currencyA,
    currencyB,
    isFarmingPool: pool?.deployer === ZERO_ADDRESS,
    version,
  })
  const [prevFusionState, prevFusion] = usePrevious([fusionState, fusion]) || []

  const ticksAtLimit = useMemo(
    () => ({
      [Bound.LOWER]: tickLower ? tickLower === nearestUsableTick(TickMath.MIN_TICK, TICK_SPACING) : undefined,
      [Bound.UPPER]: tickUpper ? tickUpper === nearestUsableTick(TickMath.MAX_TICK, TICK_SPACING) : undefined,
    }),
    [tickLower, tickUpper],
  )

  const [, _fusion] = useMemo(() => {
    if (!fusion && prevFusion && prevFusionState) {
      return [prevFusionState, prevFusion]
    }
    return [fusionState, fusion]
  }, [fusion, fusionState, prevFusion, prevFusionState])

  const position = useMemo(() => {
    if (_fusion) {
      return new Position({
        pool: _fusion,
        liquidity: new BigNumber(liquidity).toString(10),
        tickLower,
        tickUpper,
      })
    }
    return undefined
  }, [liquidity, _fusion, tickLower, tickUpper])

  const [token0, token1] = useMemo(
    () =>
      tokenA && tokenB ? (tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA]) : [undefined, undefined],
    [tokenA, tokenB],
  )

  const pricesAtTicks = useMemo(
    () => ({
      [Bound.LOWER]: getTickToPrice(token0, token1, Number(tickLower)),
      [Bound.UPPER]: getTickToPrice(token0, token1, Number(tickUpper)),
    }),
    [token0, token1, tickLower, tickUpper],
  )

  const { [Bound.LOWER]: priceLower, [Bound.UPPER]: priceUpper } = pricesAtTicks

  const independentAmount = useMemo(
    () => tryParseAmount(typedValue, independentCurrency),
    [typedValue, independentCurrency],
  )

  const dependentAmount = useMemo(() => {
    // we wrap the currencies just to get the price in terms of the other token
    const wrappedIndependentAmount = independentAmount?.wrapped
    const dependentCurrency = independentField === Field.CURRENCY_A ? currencyB : currencyA
    if (
      independentAmount &&
      wrappedIndependentAmount &&
      typeof tickLower === 'number' &&
      typeof tickUpper === 'number'
    ) {
      const pos = wrappedIndependentAmount.currency.equals(_fusion.token0)
        ? Position.fromAmount0({
            pool: _fusion,
            tickLower,
            tickUpper,
            amount0: independentAmount.quotient,
            useFullPrecision: true, // we want full precision for the theoretical position
          })
        : Position.fromAmount1({
            pool: _fusion,
            tickLower,
            tickUpper,
            amount1: independentAmount.quotient,
          })

      const dependentTokenAmount = wrappedIndependentAmount.currency.equals(_fusion.token0) ? pos.amount1 : pos.amount0
      return dependentCurrency && CurrencyAmount.fromRawAmount(dependentCurrency, dependentTokenAmount.quotient)
    }

    return undefined
  }, [independentAmount, _fusion, currencyB, currencyA, tickLower, tickUpper, independentField])

  const parsedAmounts = useMemo(
    () => ({
      [Field.CURRENCY_A]: independentField === Field.CURRENCY_A ? independentAmount : dependentAmount,
      [Field.CURRENCY_B]: independentField === Field.CURRENCY_A ? dependentAmount : independentAmount,
    }),
    [dependentAmount, independentAmount, independentField],
  )

  const pos = useMemo(() => {
    if (!_fusion || !tokenA || !tokenB || typeof tickLower !== 'number' || typeof tickUpper !== 'number') {
      return undefined
    }

    // mark as 0 if disabled because out of range
    const amount0 = parsedAmounts?.[tokenA?.equals(_fusion?.token0) ? Field.CURRENCY_A : Field.CURRENCY_B]?.quotient
    const amount1 = parsedAmounts?.[tokenA?.equals(_fusion?.token0) ? Field.CURRENCY_B : Field.CURRENCY_A]?.quotient

    if (amount0 !== undefined && amount1 !== undefined) {
      return Position.fromAmounts({
        pool: _fusion,
        tickLower,
        tickUpper,
        amount0,
        amount1,
        useFullPrecision: true, // we want full precision for the theoretical position
      })
    }
    return undefined
  }, [parsedAmounts, _fusion, tokenA, tokenB, tickLower, tickUpper])

  const depositADisabled = useMemo(() => position && position.pool.tickCurrent > position.tickUpper, [position])
  const depositBDisabled = useMemo(() => position && position.pool.tickCurrent < position.tickLower, [position])

  // get formatted amounts
  const formattedAmounts = useMemo(() => {
    const dependentField = Field.CURRENCY_A === independentField ? Field.CURRENCY_B : Field.CURRENCY_A
    return {
      [independentField]: typedValue,
      [dependentField]: parsedAmounts[dependentField]?.toExact() ?? '',
    }
  }, [typedValue, independentField, parsedAmounts])

  const maxAmounts = [Field.CURRENCY_A, Field.CURRENCY_B].reduce(
    (accumulator, field) => ({
      ...accumulator,
      [field]: maxAmountSpend(currencyBalances[field]),
    }),
    {},
  )

  const amount0 = useMemo(
    () =>
      tokenA && _fusion && parsedAmounts
        ? parsedAmounts[tokenA.equals(_fusion.token0) ? Field.CURRENCY_A : Field.CURRENCY_B]?.quotient
        : 0,
    [_fusion, parsedAmounts, tokenA],
  )

  const amount1 = useMemo(
    () =>
      tokenA && _fusion && parsedAmounts
        ? parsedAmounts?.[tokenA?.equals(_fusion?.token0) ? Field.CURRENCY_B : Field.CURRENCY_A]?.quotient
        : 0,
    [_fusion, parsedAmounts, tokenA],
  )

  const amountAsset0 = useMemo(() => position?.amount0.toExact() || 0, [position])
  const amountAsset1 = useMemo(() => position?.amount1.toExact() || 0, [position])
  const amount0InUsd = useMemo(() => BigNumber(amountAsset0).multipliedBy(asset0?.price || 0), [amountAsset0, asset0])
  const amount1InUsd = useMemo(() => BigNumber(amountAsset1).multipliedBy(asset1?.price || 0), [amountAsset1, asset1])
  const fiatValueOfLiquidity = useMemo(() => amount0InUsd.plus(amount1InUsd), [amount0InUsd, amount1InUsd])

  const minPrice = useMemo(() => {
    const price = formatTickPrice(position?.token0PriceLower, ticksAtLimit, Bound.LOWER)
    return Number(price)
  }, [position?.token0PriceLower, ticksAtLimit])

  const maxPrice = useMemo(() => {
    const price = formatTickPrice(position?.token0PriceUpper, ticksAtLimit, Bound.UPPER)
    return Number(price)
  }, [position?.token0PriceUpper, ticksAtLimit])

  const currentPrice = useMemo(() => {
    const price = _fusion?.token0Price ? _fusion.token0Price.toSignificant(6) : 0
    return Number(formatAmountLP(price))
  }, [_fusion])

  const depositInUSD = useMemo(() => formatAmount(fiatValueOfLiquidity), [fiatValueOfLiquidity])
  const outOfRange = _fusion ? _fusion.tickCurrent < tickLower || _fusion.tickCurrent >= tickUpper : false

  const onFieldAInput = useCallback(
    val => {
      setIndependentField(Field.CURRENCY_A)
      setTypedValue(val)
    },
    [setTypedValue, setIndependentField],
  )

  const onFieldBInput = useCallback(
    val => {
      setIndependentField(Field.CURRENCY_B)
      setTypedValue(val)
    },
    [setTypedValue, setIndependentField],
  )

  const errorMessage = useMemo(() => {
    if (!parsedAmounts[Field.CURRENCY_A] || !parsedAmounts[Field.CURRENCY_B]) {
      return 'Invalid Amount'
    }

    const { [Field.CURRENCY_A]: currencyAAmount, [Field.CURRENCY_B]: currencyBAmount } = parsedAmounts

    if (currencyAAmount && currencyBalances?.[Field.CURRENCY_A]?.lessThan(currencyAAmount)) {
      return `Insufficient ${currencies[Field.CURRENCY_A]?.symbol} balance`
    }

    if (currencyBAmount && currencyBalances?.[Field.CURRENCY_B]?.lessThan(currencyBAmount)) {
      return `Insufficient ${currencies[Field.CURRENCY_B]?.symbol} balance`
    }
    return null
  }, [parsedAmounts, currencyBalances, currencies])

  const firstPercent = useMemo(
    () => (amount0InUsd.div(amount0InUsd.plus(amount1InUsd).toNumber()) * 100).toFixed(2),
    [amount0InUsd, amount1InUsd],
  )

  const apr = useCalculateAPR({
    position: pool,
    poolAddress: subpool?.address,
    totalLiquidity: _fusion?.liquidity,
    tvl: Number(depositInUSD ?? 0),
  })

  return position
    ? {
        dependentField: independentField === Field.CURRENCY_A ? Field.CURRENCY_B : Field.CURRENCY_A,
        currencies,
        pool: { ...pool, tvl: subpool?.tvl ?? 0 },
        poolAddress: pool.address,
        currencyBalances,
        parsedAmounts,
        pricesAtTicks,
        errorMessage,
        outOfRange,
        depositADisabled,
        depositBDisabled,
        ticksAtLimit,
        amount0,
        amount1,
        amountAsset0,
        amountAsset1,
        minPrice,
        maxPrice,
        priceLower,
        priceUpper,
        currentPrice,
        depositInUSD,
        baseCurrency: currencyA,
        quoteCurrency: currencyB,
        formattedAmounts,
        maxAmounts,
        apr,
        firstPercent,
        tokenId,
        pos,
        onFieldAInput,
        onFieldBInput,
        setTypedValue,
      }
    : undefined
}
