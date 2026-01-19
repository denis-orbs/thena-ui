import BigNumber from 'bignumber.js'

import { formatAmount, fromWei } from './utils'

export function getSwapOutAmount({
  isSolidlySwap,
  solidlyQuoteData,
  isFallbackLH,
  tradeLH,
  tradeThenaSwapToUse,
  bestTrade,
}) {
  if (isSolidlySwap) {
    const outAmountThenaQuote = solidlyQuoteData ? Number(solidlyQuoteData[0]) : ''
    return outAmountThenaQuote
  }

  if (isFallbackLH) return tradeLH?.outAmount
  if (tradeThenaSwapToUse?.outAmount) return tradeThenaSwapToUse.outAmount

  return bestTrade?.outAmounts[0] || ''
}

export function convertOutAmountToDisplay(outAmount, toAsset) {
  if (!outAmount || !toAsset) return ''
  const amount = typeof outAmount === 'string' ? outAmount : outAmount.toString()
  if (amount === '' || amount === '0' || Number(amount) <= 0) return ''

  try {
    return fromWei(amount, toAsset.decimals).toString(10)
  } catch (error) {
    console.error('Error converting outAmount to display format:', error)
    return ''
  }
}

export function calculateMinimumReceived({ toAsset, outAmount, isFallbackLH, tradeLH, tradeThenaSwapToUse, slippage }) {
  if (!toAsset || !outAmount) return ''

  if (isFallbackLH && tradeLH?.minAmountOut) {
    return `${formatAmount(fromWei(tradeLH.minAmountOut, toAsset.decimals))} ${toAsset.symbol}`
  }

  if (tradeThenaSwapToUse?.outAmount) {
    const { minAmountOut } = tradeThenaSwapToUse
    return `${formatAmount(fromWei(minAmountOut, toAsset.decimals))} ${toAsset.symbol}`
  }

  if (slippage && Boolean(Number(slippage))) {
    const minAmount = new BigNumber(outAmount).times(1 - slippage / 100)
    return `${formatAmount(fromWei(minAmount.toString(), toAsset.decimals))} ${toAsset.symbol}`
  }

  return `${formatAmount(fromWei(outAmount, toAsset.decimals))} ${toAsset.symbol}`
}
