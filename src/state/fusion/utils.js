import { JSBI, Price } from 'thena-sdk-core'
import { encodeSqrtRatioX96, nearestUsableTick, priceToClosestTick, TICK_SPACING, TickMath } from 'thenafi-fusion-sdk'

export function tryParsePrice(baseToken, quoteToken, value) {
  if (!baseToken || !quoteToken || !value) {
    return undefined
  }

  value = Number(value)
    .toFixed(18)
    .replace(/\.?0+$/, '')

  if (!value.match(/^\d*\.?\d+$/)) {
    return undefined
  }

  const [whole, fraction] = value.split('.')

  const decimals = fraction?.length ?? 0
  const withoutDecimals = JSBI.BigInt((whole ?? '') + (fraction ?? ''))

  return new Price(
    baseToken,
    quoteToken,
    JSBI.multiply(JSBI.BigInt(10 ** decimals), JSBI.BigInt(10 ** baseToken.decimals)),
    JSBI.multiply(withoutDecimals, JSBI.BigInt(10 ** quoteToken.decimals)),
  )
}

export function tryParseTick(baseToken, quoteToken, feeAmount, value, tickSpacing) {
  if (!baseToken || !quoteToken || !feeAmount || !value) {
    return undefined
  }

  const price = tryParsePrice(baseToken, quoteToken, value)

  if (!price) {
    return undefined
  }

  let tick

  // check price is within min/max bounds, if outside return min/max
  const sqrtRatioX96 = encodeSqrtRatioX96(price.numerator, price.denominator)

  if (JSBI.greaterThanOrEqual(sqrtRatioX96, TickMath.MAX_SQRT_RATIO)) {
    tick = TickMath.MAX_TICK
  } else if (JSBI.lessThanOrEqual(sqrtRatioX96, TickMath.MIN_SQRT_RATIO)) {
    tick = TickMath.MIN_TICK
  } else {
    // this function is agnostic to the base, will always return the correct tick
    tick = priceToClosestTick(price)
  }

  // TODO: CHECK
  return nearestUsableTick(tick, tickSpacing ?? TICK_SPACING)
}
