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
      customTokens: [],

      addTokenCustom: token =>
        set(state => ({
          customTokens: [...state.customTokens, token],
        })),

      removeTokenCustom: address =>
        set(({ customTokens }) => ({
          customTokens: customTokens.filter(item => getAddress(item.address) !== getAddress(address)),
        })),
    }),
    {
      name: 'tokens-storage',
      partialize: state => ({
        customTokens: state.customTokens,
      }),
    },
  ),
)

export const useCustomTokens = () => {
  const { customTokens, addTokenCustom, removeTokenCustom } = useTokensState()
  const { account } = useWallet()

  const { data: balances } = useReadContracts({
    contracts: customTokens.map(token => ({
      abi: ERC20Abi,
      address: token.address,
      functionName: 'balanceOf',
      args: [account],
    })),
    query: {
      enabled: Boolean(account),
    },
  })

  const customTokensWithBalances = useMemo(
    () =>
      customTokens.map((tk, index) => ({
        ...tk,
        price: 0,
        balance: fromWei(balances?.[index]?.result || 0n, tk.decimals),
      })),
    [balances, customTokens],
  )

  return {
    customTokens: customTokensWithBalances,
    addTokenCustom,
    removeTokenCustom,
  }
}
