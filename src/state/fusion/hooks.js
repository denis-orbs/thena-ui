import { useCallback, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import useSWR from 'swr'
import {
  encodeSqrtRatioX96,
  nearestUsableTick,
  Pool,
  Position,
  priceToClosestTick,
  TICK_SPACING,
  TickMath,
  tickToPrice,
} from 'thena-fusion-sdk'
import { CurrencyAmount, JSBI, Price, Rounding, WBNB } from 'thena-sdk-core'
import { formatUnits, parseUnits } from 'viem'

import { FusionRangeType } from '@/constant'
import { gammaUniProxyAbi } from '@/constant/abi/fusion'
import Contracts from '@/constant/contracts'
import { useCurrency } from '@/hooks/fusion/Tokens'
import { useCurrencyBalance, useCurrencyBalances } from '@/hooks/fusion/useCurrencyBalances'
import { PoolState, useFusion } from '@/hooks/fusion/useFusions'
import { callMulti } from '@/lib/contractActions'
import { getTickToPrice, maxAmountSpend, tryParseAmount } from '@/lib/fusion'
import { toWei } from '@/lib/utils'
import useWallet from '@/lib/wallets/useWallet'

import {
  Bound,
  Field,
  setFullRange,
  typeInput,
  typeLeftRangeInput,
  typeRightRangeInput,
  typeStartPriceInput,
  updateLiquidityRangeType,
  updatePresetRange,
} from './actions'
import { tryParseTick } from './utils'

const BIG_INT_ZERO = JSBI.BigInt(0)

export const useV3MintState = () => useSelector(state => state.fusion)

export const useV3MintActionHandlers = noLiquidity => {
  const dispatch = useDispatch()

  const onFieldAInput = useCallback(
    typedValue => {
      dispatch(
        typeInput({
          field: Field.CURRENCY_A,
          typedValue,
          noLiquidity: noLiquidity === true,
        }),
      )
    },
    [dispatch, noLiquidity],
  )

  const onFieldBInput = useCallback(
    typedValue => {
      dispatch(
        typeInput({
          field: Field.CURRENCY_B,
          typedValue,
          noLiquidity: noLiquidity === true,
        }),
      )
    },
    [dispatch, noLiquidity],
  )

  const onLeftRangeInput = useCallback(
    typedValue => {
      dispatch(typeLeftRangeInput({ typedValue }))
    },
    [dispatch],
  )

  const onRightRangeInput = useCallback(
    typedValue => {
      dispatch(typeRightRangeInput({ typedValue }))
    },
    [dispatch],
  )

  const onStartPriceInput = useCallback(
    typedValue => {
      dispatch(typeStartPriceInput({ typedValue }))
    },
    [dispatch],
  )

  const onChangeLiquidityRangeType = useCallback(
    value => {
      dispatch(updateLiquidityRangeType({ liquidityRangeType: value }))
    },
    [dispatch],
  )

  const onChangePresetRange = useCallback(
    value => {
      dispatch(updatePresetRange({ presetRange: value }))
    },
    [dispatch],
  )

  return {
    onFieldAInput,
    onFieldBInput,
    onLeftRangeInput,
    onRightRangeInput,
    onStartPriceInput,
    onChangeLiquidityRangeType,
    onChangePresetRange,
  }
}

const fetchGammaDepositAmounts = async (address, currencies, chainId) => {
  const depositAmounts = await callMulti(
    currencies.map(currency => ({
      address: Contracts.gammaUniProxy[chainId],
      abi: gammaUniProxyAbi,
      functionName: 'getDepositAmount',
      args: [address, currency?.wrapped.address, parseUnits('1', currency?.wrapped.decimals ?? 0)],
      chainId,
    })),
  )

  const quoteDepositAmount = {
    amountMin: Number(formatUnits(depositAmounts[0][0], currencies[1].wrapped.decimals)),
    amountMax: Number(formatUnits(depositAmounts[0][1], currencies[1].wrapped.decimals)),
  }

  const baseDepositAmount = {
    amountMin: Number(formatUnits(depositAmounts[1][0], currencies[0].wrapped.decimals)),
    amountMax: Number(formatUnits(depositAmounts[1][1], currencies[0].wrapped.decimals)),
  }
  return {
    quoteDepositAmount,
    baseDepositAmount,
  }
}

export const useV3DerivedMintInfo = (
  currencyA,
  currencyB,
  feeAmount,
  baseCurrency,
  // override for existing position
  existingPosition,
) => {
  const { chainId } = useWallet()
  const {
    independentField,
    typedValue,
    leftRangeTypedValue,
    rightRangeTypedValue,
    startPriceTypedValue,
    liquidityRangeType,
    presetRange,
  } = useV3MintState()
  const gammaCurrencies = currencyA && currencyB ? [currencyA, currencyB] : []
  const { data: gammaData } = useSWR(
    presetRange && presetRange.address && gammaCurrencies.length > 0
      ? ['gamma/depositAmounts', presetRange.address, currencyA, currencyB, chainId]
      : null,
    () => fetchGammaDepositAmounts(presetRange.address, gammaCurrencies, chainId),
  )

  const dependentField = independentField === Field.CURRENCY_A ? Field.CURRENCY_B : Field.CURRENCY_A
  const bnb = useCurrency('bnb')

  // currencies
  const currencies = useMemo(
    () => ({
      [Field.CURRENCY_A]: currencyA,
      [Field.CURRENCY_B]: currencyB,
    }),
    [currencyA, currencyB],
  )

  // formatted with tokens
  const [tokenA, tokenB, baseToken] = useMemo(
    () => [currencyA?.wrapped, currencyB?.wrapped, baseCurrency?.wrapped],
    [currencyA, currencyB, baseCurrency],
  )

  const [token0, token1] = useMemo(
    () =>
      tokenA && tokenB ? (tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA]) : [undefined, undefined],
    [tokenA, tokenB],
  )

  const ethBalance = useCurrencyBalance(bnb)
  const wethBalance = useCurrencyBalance(WBNB[chainId])
  const maxSpendETH = maxAmountSpend(ethBalance)
  // balances
  const balances = useCurrencyBalances([currencies[Field.CURRENCY_A], currencies[Field.CURRENCY_B]])

  const currencyBalances = {
    [Field.CURRENCY_A]:
      [FusionRangeType.GAMMA_RANGE, FusionRangeType.DEFIEDGE_RANGE].includes(liquidityRangeType) &&
      currencyA &&
      chainId &&
      currencyA.wrapped.address.toLowerCase() === WBNB[chainId].address.toLowerCase()
        ? CurrencyAmount.fromRawAmount(
            currencyA,
            JSBI.ADD(
              JSBI.BigInt(wethBalance ? wethBalance.numerator.toString() : '0'),
              JSBI.BigInt(maxSpendETH ? maxSpendETH.numerator.toString() : '0'),
            ),
          )
        : balances[0],
    [Field.CURRENCY_B]:
      [FusionRangeType.GAMMA_RANGE, FusionRangeType.DEFIEDGE_RANGE].includes(liquidityRangeType) &&
      currencyB &&
      chainId &&
      currencyB.wrapped.address.toLowerCase() === WBNB[chainId].address.toLowerCase()
        ? CurrencyAmount.fromRawAmount(
            currencyB,
            JSBI.ADD(
              JSBI.BigInt(wethBalance ? wethBalance.numerator.toString() : '0'),
              JSBI.BigInt(maxSpendETH ? maxSpendETH.numerator.toString() : '0'),
            ),
          )
        : balances[1],
  }

  // pool
  // TODO
  const [poolState, pool] = useFusion(currencies[Field.CURRENCY_A], currencies[Field.CURRENCY_B])
  const noLiquidity = poolState === PoolState.NOT_EXISTS

  const dynamicFee = pool ? pool.fee : 3000

  // note to parse inputs in reverse
  const invertPrice = Boolean(baseToken && token0 && !baseToken.equals(token0))

  // always returns the price with 0 as base token
  const price = useMemo(() => {
    // if no liquidity use typed value
    if (noLiquidity) {
      const parsedQuoteAmount = tryParseAmount(startPriceTypedValue, invertPrice ? token0 : token1)
      if (parsedQuoteAmount && token0 && token1) {
        const baseAmount = tryParseAmount('1', invertPrice ? token1 : token0)
        const baseprice =
          baseAmount && parsedQuoteAmount
            ? new Price(
                baseAmount.currency,
                parsedQuoteAmount.currency,
                baseAmount.quotient,
                parsedQuoteAmount.quotient,
              )
            : undefined
        return (invertPrice ? baseprice?.invert() : baseprice) ?? undefined
      }
      return undefined
    }
    // get the amount of quote currency
    return pool && token0 ? pool.priceOf(token0) : undefined
  }, [noLiquidity, startPriceTypedValue, invertPrice, token1, token0, pool])

  // check for invalid price input (converts to invalid ratio)
  const invalidPrice = useMemo(() => {
    const sqrtRatioX96 = price ? encodeSqrtRatioX96(price.numerator, price.denominator) : undefined
    const invalid =
      price &&
      sqrtRatioX96 &&
      !(
        JSBI.greaterThanOrEqual(sqrtRatioX96, TickMath.MIN_SQRT_RATIO) &&
        JSBI.lessThan(sqrtRatioX96, TickMath.MAX_SQRT_RATIO)
      )
    return invalid
  }, [price])

  // used for ratio calculation when pool not initialized
  const mockPool = useMemo(() => {
    if (tokenA && tokenB && feeAmount && price && !invalidPrice) {
      const currentTick = priceToClosestTick(price)
      const currentSqrt = TickMath.getSqrtRatioAtTick(currentTick)
      return new Pool(tokenA, tokenB, feeAmount, currentSqrt, JSBI.BigInt(0), currentTick, [])
    }
    return undefined
  }, [feeAmount, invalidPrice, price, tokenA, tokenB])

  // if pool exists use it, if not use the mock pool
  const poolForPosition = pool ?? mockPool

  // lower and upper limits in the tick space for `feeAmount`
  const tickSpaceLimits = useMemo(
    () => ({
      [Bound.LOWER]: feeAmount ? nearestUsableTick(TickMath.MIN_TICK, TICK_SPACING) : undefined,
      [Bound.UPPER]: feeAmount ? nearestUsableTick(TickMath.MAX_TICK, TICK_SPACING) : undefined,
    }),
    [feeAmount],
  )

  // parse typed range values and determine closest ticks
  // lower should always be a smaller tick
  const ticks = useMemo(
    () => ({
      [Bound.LOWER]:
        typeof existingPosition?.tickLower === 'number'
          ? existingPosition.tickLower
          : (invertPrice && typeof rightRangeTypedValue === 'boolean') ||
              (!invertPrice && typeof leftRangeTypedValue === 'boolean')
            ? tickSpaceLimits[Bound.LOWER]
            : invertPrice
              ? tryParseTick(token1, token0, feeAmount, rightRangeTypedValue.toString())
              : tryParseTick(token0, token1, feeAmount, leftRangeTypedValue.toString()),
      [Bound.UPPER]:
        typeof existingPosition?.tickUpper === 'number'
          ? existingPosition.tickUpper
          : (!invertPrice && typeof rightRangeTypedValue === 'boolean') ||
              (invertPrice && typeof leftRangeTypedValue === 'boolean')
            ? tickSpaceLimits[Bound.UPPER]
            : invertPrice
              ? tryParseTick(token1, token0, feeAmount, leftRangeTypedValue.toString())
              : tryParseTick(token0, token1, feeAmount, rightRangeTypedValue.toString()),
    }),
    [
      existingPosition,
      feeAmount,
      invertPrice,
      leftRangeTypedValue,
      rightRangeTypedValue,
      token0,
      token1,
      tickSpaceLimits,
    ],
  )

  const { [Bound.LOWER]: tickLower, [Bound.UPPER]: tickUpper } = ticks || {}

  // specifies whether the lower and upper ticks is at the exteme bounds
  const ticksAtLimit = useMemo(
    () => ({
      [Bound.LOWER]: feeAmount && tickLower === tickSpaceLimits.LOWER,
      [Bound.UPPER]: feeAmount && tickUpper === tickSpaceLimits.UPPER,
    }),
    [tickSpaceLimits, tickLower, tickUpper, feeAmount],
  )

  // mark invalid range
  const invalidRange = Boolean(typeof tickLower === 'number' && typeof tickUpper === 'number' && tickLower >= tickUpper)

  // always returns the price with 0 as base token
  const pricesAtTicks = useMemo(
    () => ({
      [Bound.LOWER]: getTickToPrice(token0, token1, ticks[Bound.LOWER]),
      [Bound.UPPER]: getTickToPrice(token0, token1, ticks[Bound.UPPER]),
    }),
    [token0, token1, ticks],
  )
  const { [Bound.LOWER]: lowerPrice, [Bound.UPPER]: upperPrice } = pricesAtTicks

  // liquidity range warning
  const outOfRange = Boolean(
    !invalidRange && price && lowerPrice && upperPrice && (price.lessThan(lowerPrice) || price.greaterThan(upperPrice)),
  )

  const independentCurrency = currencies[independentField]

  const independentAmount = tryParseAmount(
    typedValue,
    [FusionRangeType.GAMMA_RANGE, FusionRangeType.DEFIEDGE_RANGE].includes(liquidityRangeType) &&
      independentCurrency &&
      independentCurrency.isNative
      ? independentCurrency.wrapped
      : independentCurrency,
  )

  const baseDepositAmount = useMemo(() => gammaData && gammaData.baseDepositAmount, [gammaData])
  const quoteDepositAmount = useMemo(() => gammaData && gammaData.quoteDepositAmount, [gammaData])

  const dependentAmount = useMemo(() => {
    if (liquidityRangeType === FusionRangeType.GAMMA_RANGE) {
      if (
        !independentAmount ||
        !presetRange ||
        !presetRange.address ||
        !quoteDepositAmount ||
        !baseDepositAmount ||
        !currencyA ||
        !currencyB
      ) {
        return
      }

      if (independentField === Field.CURRENCY_A) {
        const quoteDeposit = toWei(
          (
            ((quoteDepositAmount.amountMin + quoteDepositAmount.amountMax) / 2) *
            Number(independentAmount.toSignificant())
          ).toFixed(currencyB.wrapped.decimals),
          currencyB.wrapped.decimals,
        )
        return CurrencyAmount.fromRawAmount(
          currencyB.isNative ? currencyB.wrapped : currencyB,
          JSBI.BigInt(quoteDeposit),
        )
      }
      const baseDeposit = toWei(
        (
          ((baseDepositAmount.amountMin + baseDepositAmount.amountMax) / 2) *
          Number(independentAmount.toSignificant())
        ).toFixed(currencyA.wrapped.decimals),
        currencyA.wrapped.decimals,
      )
      return CurrencyAmount.fromRawAmount(currencyA.isNative ? currencyA.wrapped : currencyA, JSBI.BigInt(baseDeposit))
    }
    // we wrap the currencies just to get the price in terms of the other token
    const wrappedIndependentAmount = independentAmount?.wrapped
    const dependentCurrency = dependentField === Field.CURRENCY_B ? currencyB : currencyA
    if (
      independentAmount &&
      wrappedIndependentAmount &&
      typeof tickLower === 'number' &&
      typeof tickUpper === 'number' &&
      poolForPosition
    ) {
      // if price is out of range or invalid range - return 0 (single deposit will be independent)
      if (outOfRange || invalidRange) {
        return undefined
      }

      const position = wrappedIndependentAmount.currency.equals(poolForPosition.token0)
        ? Position.fromAmount0({
            pool: poolForPosition,
            tickLower,
            tickUpper,
            amount0: independentAmount.quotient,
            useFullPrecision: true, // we want full precision for the theoretical position
          })
        : Position.fromAmount1({
            pool: poolForPosition,
            tickLower,
            tickUpper,
            amount1: independentAmount.quotient,
          })

      const dependentTokenAmount = wrappedIndependentAmount.currency.equals(poolForPosition.token0)
        ? position.amount1
        : position.amount0
      return dependentCurrency && CurrencyAmount.fromRawAmount(dependentCurrency, dependentTokenAmount.quotient)
    }

    return undefined
  }, [
    liquidityRangeType,
    independentAmount,
    dependentField,
    currencyB,
    currencyA,
    tickLower,
    tickUpper,
    poolForPosition,
    presetRange,
    quoteDepositAmount,
    baseDepositAmount,
    independentField,
    outOfRange,
    invalidRange,
  ])

  const parsedAmounts = useMemo(
    () => ({
      [Field.CURRENCY_A]: independentField === Field.CURRENCY_A ? independentAmount : dependentAmount,
      [Field.CURRENCY_B]: independentField === Field.CURRENCY_A ? dependentAmount : independentAmount,
    }),
    [dependentAmount, independentAmount, independentField],
  )

  // single deposit only if price is out of range
  const deposit0Disabled = Boolean(
    typeof tickUpper === 'number' && poolForPosition && poolForPosition.tickCurrent >= tickUpper,
  )
  const deposit1Disabled = Boolean(
    typeof tickLower === 'number' && poolForPosition && poolForPosition.tickCurrent <= tickLower,
  )

  // sorted for token order
  const depositADisabled =
    liquidityRangeType === FusionRangeType.MANUAL_RANGE &&
    (invalidRange ||
      Boolean(
        (deposit0Disabled && poolForPosition && tokenA && poolForPosition.token0.equals(tokenA)) ||
          (deposit1Disabled && poolForPosition && tokenA && poolForPosition.token1.equals(tokenA)),
      ))
  const depositBDisabled =
    liquidityRangeType === FusionRangeType.MANUAL_RANGE &&
    (invalidRange ||
      Boolean(
        (deposit0Disabled && poolForPosition && tokenB && poolForPosition.token0.equals(tokenB)) ||
          (deposit1Disabled && poolForPosition && tokenB && poolForPosition.token1.equals(tokenB)),
      ))

  // create position entity based on users selection
  const position = useMemo(() => {
    if (
      !poolForPosition ||
      !tokenA ||
      !tokenB ||
      typeof tickLower !== 'number' ||
      typeof tickUpper !== 'number' ||
      invalidRange
    ) {
      return undefined
    }

    // mark as 0 if disabled because out of range
    const amount0 = !deposit0Disabled
      ? parsedAmounts?.[tokenA.equals(poolForPosition.token0) ? Field.CURRENCY_A : Field.CURRENCY_B]?.quotient
      : BIG_INT_ZERO
    const amount1 = !deposit1Disabled
      ? parsedAmounts?.[tokenA.equals(poolForPosition.token0) ? Field.CURRENCY_B : Field.CURRENCY_A]?.quotient
      : BIG_INT_ZERO

    if (amount0 !== undefined && amount1 !== undefined) {
      return Position.fromAmounts({
        pool: poolForPosition,
        tickLower,
        tickUpper,
        amount0,
        amount1,
        useFullPrecision: true, // we want full precision for the theoretical position
      })
    }
    return undefined
  }, [
    parsedAmounts,
    poolForPosition,
    tokenA,
    tokenB,
    deposit0Disabled,
    deposit1Disabled,
    invalidRange,
    tickLower,
    tickUpper,
  ])

  let errorMessage
  let errorCode

  if (poolState === PoolState.INVALID) {
    errorMessage = errorMessage ?? 'Invalid pair'
    errorCode = errorCode ?? 1
  }

  if (invalidPrice) {
    errorMessage = errorMessage ?? 'Invalid price input'
    errorCode = errorCode ?? 2
  }

  if (
    (!parsedAmounts[Field.CURRENCY_A] && !depositADisabled) ||
    (!parsedAmounts[Field.CURRENCY_B] && !depositBDisabled)
  ) {
    errorMessage = errorMessage ?? 'Invalid amount'
    errorCode = errorCode ?? 3
  }

  const { [Field.CURRENCY_A]: currencyAAmount, [Field.CURRENCY_B]: currencyBAmount } = parsedAmounts

  if (currencyAAmount && currencyBalances?.[Field.CURRENCY_A]?.lessThan(currencyAAmount)) {
    errorMessage = `Insufficient ${currencies[Field.CURRENCY_A]?.symbol} balance`
    errorCode = errorCode ?? 4
  }

  if (currencyBAmount && currencyBalances?.[Field.CURRENCY_B]?.lessThan(currencyBAmount)) {
    errorMessage = `Insufficient ${currencies[Field.CURRENCY_B]?.symbol} balance`
    errorCode = errorCode ?? 5
  }

  const invalidPool = poolState === PoolState.INVALID

  return {
    dependentField,
    currencies,
    pool,
    poolState,
    currencyBalances,
    parsedAmounts,
    ticks,
    price,
    pricesAtTicks,
    position,
    noLiquidity,
    errorMessage,
    errorCode,
    invalidPool,
    invalidRange,
    outOfRange,
    depositADisabled,
    depositBDisabled,
    invertPrice,
    ticksAtLimit,
    dynamicFee,
    lowerPrice,
    upperPrice,
    liquidityRangeType,
    presetRange,
  }
}

export const useRangeHopCallbacks = (baseCurrency, quoteCurrency, feeAmount, tickLower, tickUpper, pool) => {
  const dispatch = useDispatch()

  const baseToken = useMemo(() => baseCurrency?.wrapped, [baseCurrency])
  const quoteToken = useMemo(() => quoteCurrency?.wrapped, [quoteCurrency])

  const getDecrementLower = useCallback(
    (rate = 1) => {
      if (baseToken && quoteToken && typeof tickLower === 'number' && feeAmount) {
        const newPrice = tickToPrice(baseToken, quoteToken, tickLower - TICK_SPACING * rate)
        return newPrice.toSignificant(5, undefined, Rounding.ROUND_UP)
      }
      // use pool current tick as starting tick if we have pool but no tick input

      if (!(typeof tickLower === 'number') && baseToken && quoteToken && feeAmount && pool) {
        const newPrice = tickToPrice(baseToken, quoteToken, pool.tickCurrent - TICK_SPACING * rate)
        return newPrice.toSignificant(5, undefined, Rounding.ROUND_UP)
      }
      return ''
    },
    [baseToken, quoteToken, tickLower, feeAmount, pool],
  )

  const getIncrementLower = useCallback(
    (rate = 1) => {
      if (baseToken && quoteToken && typeof tickLower === 'number' && feeAmount) {
        const newPrice = tickToPrice(baseToken, quoteToken, tickLower + TICK_SPACING * rate)
        return newPrice.toSignificant(5, undefined, Rounding.ROUND_UP)
      }
      // use pool current tick as starting tick if we have pool but no tick input
      if (!(typeof tickLower === 'number') && baseToken && quoteToken && feeAmount && pool) {
        const newPrice = tickToPrice(baseToken, quoteToken, pool.tickCurrent + TICK_SPACING * rate)
        return newPrice.toSignificant(5, undefined, Rounding.ROUND_UP)
      }
      return ''
    },
    [baseToken, quoteToken, tickLower, feeAmount, pool],
  )

  const getDecrementUpper = useCallback(
    (rate = 1) => {
      if (baseToken && quoteToken && typeof tickUpper === 'number' && feeAmount) {
        const newPrice = tickToPrice(baseToken, quoteToken, tickUpper - TICK_SPACING * rate)
        return newPrice.toSignificant(5, undefined, Rounding.ROUND_UP)
      }
      // use pool current tick as starting tick if we have pool but no tick input
      if (!(typeof tickUpper === 'number') && baseToken && quoteToken && feeAmount && pool) {
        const newPrice = tickToPrice(baseToken, quoteToken, pool.tickCurrent - TICK_SPACING * rate)
        return newPrice.toSignificant(5, undefined, Rounding.ROUND_UP)
      }
      return ''
    },
    [baseToken, quoteToken, tickUpper, feeAmount, pool],
  )

  const getIncrementUpper = useCallback(
    (rate = 1) => {
      if (baseToken && quoteToken && typeof tickUpper === 'number' && feeAmount) {
        const newPrice = tickToPrice(baseToken, quoteToken, tickUpper + TICK_SPACING * rate)
        return newPrice.toSignificant(5, undefined, Rounding.ROUND_UP)
      }
      // use pool current tick as starting tick if we have pool but no tick input
      if (!(typeof tickUpper === 'number') && baseToken && quoteToken && feeAmount && pool) {
        const newPrice = tickToPrice(baseToken, quoteToken, pool.tickCurrent + TICK_SPACING * rate)
        return newPrice.toSignificant(5, undefined, Rounding.ROUND_UP)
      }
      return ''
    },
    [baseToken, quoteToken, tickUpper, feeAmount, pool],
  )

  const getSetRange = useCallback(
    numTicks => {
      if (baseToken && quoteToken && feeAmount && pool) {
        // calculate range around current price given `numTicks`
        const newPriceLower = tickToPrice(
          baseToken,
          quoteToken,
          Math.max(TickMath.MIN_TICK, pool.tickCurrent - numTicks),
        )
        const newPriceUpper = tickToPrice(
          baseToken,
          quoteToken,
          Math.min(TickMath.MAX_TICK, pool.tickCurrent + numTicks),
        )

        return [
          newPriceLower.toSignificant(5, undefined, Rounding.ROUND_UP),
          newPriceUpper.toSignificant(5, undefined, Rounding.ROUND_UP),
        ]
      }
      return ['', '']
    },
    [baseToken, quoteToken, feeAmount, pool],
  )

  const getSetFullRange = useCallback(() => {
    dispatch(setFullRange())
  }, [dispatch])

  return {
    getDecrementLower,
    getIncrementLower,
    getDecrementUpper,
    getIncrementUpper,
    getSetRange,
    getSetFullRange,
  }
}

export const useActivePreset = () => {
  const preset = useSelector(state => state.fusion.preset)
  return useMemo(() => preset, [preset])
}

export const useAddLiquidityTxHash = () => {
  const txHash = useSelector(state => state.fusion.txHash)
  return useMemo(() => txHash, [txHash])
}

export const useInitialTokenPrice = () => {
  const initialTokenPrice = useSelector(state => state.fusion.initialTokenPrice)
  return useMemo(() => initialTokenPrice, [initialTokenPrice])
}

export const useCurrentStep = () => {
  const currentStep = useSelector(state => state.fusion.currentStep)
  return useMemo(() => currentStep, [currentStep])
}
