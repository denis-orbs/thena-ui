import { useMemo } from 'react'
import { CurrencyAmount, Price } from 'thena-sdk-core'

import { USDT as USDT_V3_TOKEN } from '@/constant/fusion/routing'
import { useChainSettings } from '@/state/settings/hooks'

import { useBestV3TradeExactOut } from './useBestV3Trade'

/**
 * Returns the price in USDT of the input currency
 * @param currency currency to compute the USDT price of
 */
export default function useUSDTPrice(currency, allLiquidity) {
  const { networkId } = useChainSettings()

  const amountOut = useMemo(() => {
    const STABLECOIN_AMOUNT_OUT_ALL = CurrencyAmount.fromRawAmount(USDT_V3_TOKEN[networkId], 1)
    const STABLECOIN_AMOUNT_OUT_FILTERED = CurrencyAmount.fromRawAmount(USDT_V3_TOKEN[networkId], 1_000e1)
    return allLiquidity ? STABLECOIN_AMOUNT_OUT_ALL : STABLECOIN_AMOUNT_OUT_FILTERED
  }, [networkId, allLiquidity])

  const v3USDTTrade = useBestV3TradeExactOut(currency, amountOut)

  return useMemo(() => {
    const stablecoin = amountOut?.currency
    if (!currency || !stablecoin) {
      return undefined
    }

    // handle usdc
    if (currency?.wrapped.equals(stablecoin)) {
      return new Price(stablecoin, stablecoin, '1', '1')
    }

    if (v3USDTTrade.trade) {
      const { numerator, denominator } = v3USDTTrade.trade.route.midPrice
      return new Price(currency, stablecoin, denominator, numerator)
    }

    return undefined
  }, [currency, amountOut, v3USDTTrade.trade])
}

export function useUSDTValue(currencyAmount, allLiquidity = false) {
  const price = useUSDTPrice(currencyAmount?.currency, allLiquidity)

  return useMemo(() => {
    if (!price || !currencyAmount) return null
    try {
      return price.quote(currencyAmount)
    } catch (error) {
      return null
    }
  }, [currencyAmount, price])
}
