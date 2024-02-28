import { tickToPrice } from 'thena-fusion-sdk'
import { BNB, CurrencyAmount, JSBI, WBNB } from 'thena-sdk-core'
import { parseUnits } from 'viem'

// try to parse a user entered amount for a given token
export function tryParseAmount(value, currency) {
  if (!value || !currency) {
    return undefined
  }
  try {
    const typedValueParsed = parseUnits(value, currency.decimals).toString()
    if (typedValueParsed !== '0') {
      return CurrencyAmount.fromRawAmount(currency, JSBI.BigInt(typedValueParsed))
    }
  } catch (error) {
    // should fail if the user specifies too many decimal places of precision (or maybe exceed max uint?)
    console.debug(`Failed to parse input amount: "${value}"`, error)
  }
  // necessary for all paths to return a value
  return undefined
}

const MIN_NATIVE_CURRENCY_FOR_GAS = JSBI.multiply(JSBI.BigInt(5), JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(15))) // .005 BNB
/**
 * Given some token amount, return the max that can be spent of it
 * @param currencyAmount to return max of
 */
export function maxAmountSpend(currencyAmount) {
  if (!currencyAmount) return undefined
  if (currencyAmount.currency.isNative) {
    if (JSBI.greaterThan(currencyAmount.quotient, MIN_NATIVE_CURRENCY_FOR_GAS)) {
      return CurrencyAmount.fromRawAmount(
        currencyAmount.currency,
        JSBI.subtract(currencyAmount.quotient, MIN_NATIVE_CURRENCY_FOR_GAS),
      )
    }
    return CurrencyAmount.fromRawAmount(currencyAmount.currency, JSBI.BigInt(0))
  }
  return currencyAmount
}

export function unwrappedToken(currency) {
  if (currency.isNative) return currency
  if (currency.equals(WBNB[currency.chainId])) return BNB.onChain(currency.chainId)
  return currency
}

export function isZero(hexNumberString) {
  return /^0x0*$/.test(hexNumberString)
}

export function getTickToPrice(baseToken, quoteToken, tick) {
  if (!baseToken || !quoteToken || typeof tick !== 'number') {
    return undefined
  }
  return tickToPrice(baseToken, quoteToken, tick)
}
