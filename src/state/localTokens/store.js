import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { erc20Abi, getAddress } from 'viem'
import { useReadContracts } from 'wagmi'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import useWallet from '@/hooks/useWallet'
import { fromWei } from '@/lib/utils'
import { getTokenCurrentUSDPrice } from '@/modules/SwapChart/fetch'

export const useTokensState = create()(
  persist(
    set => ({
      localTokens: [],

      addLocalToken: token =>
        set(state => ({
          localTokens: [...state.localTokens, token],
        })),

      removeLocalToken: address =>
        set(({ localTokens }) => ({
          localTokens: localTokens.filter(item => getAddress(item.address) !== getAddress(address)),
        })),
    }),
    {
      name: 'tokens-storage',
      partialize: state => ({
        localTokens: state.localTokens,
      }),
    },
  ),
)

export const useLocalTokens = () => {
  const { localTokens, addLocalToken, removeLocalToken } = useTokensState()
  const { account } = useWallet()

  const { data: balances } = useReadContracts({
    contracts: localTokens.map(token => ({
      abi: erc20Abi,
      address: token.address,
      functionName: 'balanceOf',
      args: [account],
    })),
    query: {
      enabled: Boolean(account),
    },
  })

  // Get prices
  const { data: tokenPrices = [] } = useQuery({
    queryKey: ['tokenPrices', localTokens.map(t => t.address).join(',')],
    queryFn: async () => {
      const prices = await Promise.all(localTokens.map(token => getTokenCurrentUSDPrice(token.address, token.chainId)))
      return prices // array of numbers
    },
    enabled: localTokens.length > 0,
    staleTime: 60 * 1000, // cache for 1 min
  })

  const localTokensWithBalances = useMemo(
    () =>
      localTokens.map((tk, index) => ({
        ...tk,
        price: tokenPrices?.[index] ?? tk.price ?? 0,
        balance: fromWei(balances?.[index]?.result || 0n, tk.decimals),
      })),
    [balances, localTokens, tokenPrices],
  )

  return {
    localTokens: localTokensWithBalances,
    addLocalToken,
    removeLocalToken,
  }
}
