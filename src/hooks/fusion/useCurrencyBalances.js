import { useMemo } from 'react'
import { BNB, CurrencyAmount, JSBI } from 'thena-sdk-core'

import { toWei } from '@/lib/utils'
import { useAssets } from '@/state/assets/hooks'

export function useCurrencyBalances(currencies) {
  const assets = useAssets()

  return useMemo(
    () =>
      currencies.map(currency => {
        if (!currency) return undefined
        if (currency.isToken) {
          const { address } = currency
          if (!address) return undefined
          const found = assets.find(asset => asset.address === address.toLowerCase())
          const amount =
            found && found.balance ? JSBI.BigInt(toWei(found.balance, found.decimals).toString(10)) : undefined
          return amount ? CurrencyAmount.fromRawAmount(currency, amount) : undefined
        }
        if (currency.isNative) {
          const found = assets.find(asset => asset.address === 'BNB')
          if (!found) return undefined
          const val = toWei(found.balance).toString(10)
          return CurrencyAmount.fromRawAmount(BNB.onChain(found.chainId), JSBI.BigInt(val))
        }
        return undefined
      }) ?? [],
    [assets, currencies],
  )
}

export function useCurrencyBalance(currency) {
  return useCurrencyBalances([currency])[0]
}
