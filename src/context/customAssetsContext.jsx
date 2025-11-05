import BigNumber from 'bignumber.js'
import React, { createContext, useContext, useMemo, useRef } from 'react'
import useSWRImmutable from 'swr/immutable'
import { erc20Abi, formatUnits } from 'viem'

import useWallet from '@/hooks/useWallet'
import { fetchCustomAssets } from '@/lib/api'
import { callMulti } from '@/lib/contractActions'
import { useChainSettings } from '@/state/settings/hooks'

const initialState = {
  mutateCustomAssets: () => {},
  customAssets: [],
}

const fetchAssetsBalances = async (assets, account, networkId) => {
  const res = await callMulti(
    assets.map(asset => ({
      address: asset.address,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [account],
      chainId: networkId,
    })),
  )
  return res.map((ele, index) => formatUnits(ele ?? 0, assets[index].decimals || 18))
}

const fetchUserCustomAssetsData = async (customAssets, account, networkId) => {
  const userBalances = await fetchAssetsBalances(customAssets, account, networkId)

  return customAssets.map((asset, index) => ({
    ...asset,
    balance: userBalances[index],
  }))
}

const CustomAssetsContext = createContext(initialState)

function CustomAssetsContextProvider({ children }) {
  const { account } = useWallet()
  const { networkId } = useChainSettings()

  const { data: customAssets = [] } = useSWRImmutable(
    ['custom-assets/total', networkId],
    async () => await fetchCustomAssets(networkId),
    {
      refreshInterval: 120000,
      revalidateOnFocus: false,
    },
  )

  const { data: userCustomAssets, mutate: mutateCustomAssets } = useSWRImmutable(
    customAssets.length > 0 && account && ['custom-assets/user', account, networkId],
    async () => {
      const data = await fetchUserCustomAssetsData(customAssets, account, networkId)
      return data.map(ele => ({
        ...ele,
        balance: new BigNumber(ele.balance),
        totalValue: 0,
      }))
    },
    {
      refreshInterval: 120000,
      revalidateOnFocus: false,
    },
  )

  const final = useMemo(() => {
    if (!account) {
      return {
        mutateCustomAssets: () => {},
        customAssets,
      }
    }
    if (!userCustomAssets || !userCustomAssets.length) {
      return {
        mutateCustomAssets,
        customAssets,
      }
    }
    return {
      mutateCustomAssets,
      customAssets: userCustomAssets,
    }
  }, [customAssets, account, userCustomAssets, mutateCustomAssets])

  return <CustomAssetsContext.Provider value={final}>{children}</CustomAssetsContext.Provider>
}

const useCustomAssets = () => {
  const { customAssets } = useContext(CustomAssetsContext)

  const prevAssetsRef = useRef(customAssets)

  if (customAssets.length === 0) {
    return prevAssetsRef.current
  }

  prevAssetsRef.current = customAssets
  return customAssets
}

const useMutateCustomAssets = () => {
  const { mutateCustomAssets } = useContext(CustomAssetsContext)
  return mutateCustomAssets
}

export { CustomAssetsContext, CustomAssetsContextProvider, useCustomAssets, useMutateCustomAssets }
