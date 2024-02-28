import { Fraction, JSBI, Percent } from 'thena-sdk-core'

const ONE_HUNDRED_PERCENT = new Percent(JSBI.BigInt(10000), JSBI.BigInt(10000))

// computes realized lp fee as a percent
export function computeRealizedLPFeePercent(trade) {
  const percent = ONE_HUNDRED_PERCENT.subtract(
    trade.route.pools.reduce(
      (currentFee, pool) => currentFee.multiply(ONE_HUNDRED_PERCENT.subtract(new Fraction(pool.fee, 1_000_000))),
      ONE_HUNDRED_PERCENT,
    ),
  )

  return new Percent(percent.numerator, percent.denominator)
}
