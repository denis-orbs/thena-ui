import { useMemo } from 'react'
import { getAddress } from 'viem'
import { useReadContracts } from 'wagmi'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { ERC20Abi } from '@/constant/abi'
import useWallet from '@/hooks/useWallet'
import { fromWei } from '@/lib/utils'

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
      abi: ERC20Abi,
      address: token.address,
      functionName: 'balanceOf',
      args: [account],
    })),
    query: {
      enabled: Boolean(account),
    },
  })

  const localTokensWithBalances = useMemo(
    () =>
      localTokens.map((tk, index) => ({
        ...tk,
        price: 0,
        balance: fromWei(balances?.[index]?.result || 0n, tk.decimals),
      })),
    [balances, localTokens],
  )

  return {
    localTokens: localTokensWithBalances,
    addLocalToken,
    removeLocalToken,
  }
}
