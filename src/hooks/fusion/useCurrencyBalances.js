import BigNumber from 'bignumber.js'
import { useMemo } from 'react'
import { BNB, CurrencyAmount, JSBI } from 'thena-sdk-core'
import { useReadContracts } from 'wagmi'

import { ERC20Abi } from '@/constant/abi'
import { useAssets } from '@/context/assetsContext'
import { toWei } from '@/lib/utils'

import useWallet from '../useWallet'

export function useCurrencyBalances(currencies) {
  const assets = useAssets()
  const { account } = useWallet()

  const { data: balancesOf } = useReadContracts({
    contracts: currencies.map(c => ({
      abi: ERC20Abi,
      address: c?.address,
      functionName: 'balanceOf',
      args: [account],
    })),
    query: {
      enabled: !!account,
    },
  })

  return useMemo(
    () =>
      currencies.map((currency, index) => {
        if (!currency) return undefined

        if (currency.isToken) {
          const { address } = currency
          if (!address) return undefined
          // const found = assets.find(asset => asset.address.toLowerCase() === address.toLowerCase())
          // const amount = found?.balance ? JSBI.BigInt(toWei(found.balance, found.decimals).toString(10)) : undefined

          const amountBN = JSBI.BigInt(new BigNumber(balancesOf?.[index]?.result || 0n))
          return CurrencyAmount.fromRawAmount(currency, amountBN)
        }

        if (currency.isNative) {
          const found = assets.find(asset => asset.address === 'BNB')
          if (!found) return undefined
          const val = toWei(found.balance).toString(10)
          return CurrencyAmount.fromRawAmount(BNB.onChain(found.chainId), JSBI.BigInt(val))
        }

        return undefined
      }) ?? [],
    [assets, balancesOf, currencies],
  )
}

export function useCurrencyBalance(currency) {
  return useCurrencyBalances([currency])[0]
}
