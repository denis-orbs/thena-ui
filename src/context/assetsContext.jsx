import { getBalance } from '@wagmi/core'
import BigNumber from 'bignumber.js'
import React, { createContext, useContext, useMemo, useRef } from 'react'
import useSWRImmutable from 'swr/immutable'
import { formatEther, formatUnits } from 'viem'

import { ERC20Abi } from '@/constant/abi'
import useWallet from '@/hooks/useWallet'
import { fetchAssets } from '@/lib/api'
import { callMulti } from '@/lib/contractActions'
import { liquidityHub } from '@/modules/LiquidityHub'
import { useChainSettings } from '@/state/settings/hooks'
import { wagmiConfig } from '@/wallets/rainbowkit'

const initialState = {
  mutateAssets: () => {},
  assets: [],
}

const fetchAssetsBalances = async (assets, account, networkId) => {
  console.log('----------------- user assets ------------------')
  const res = await callMulti(
    assets.map(asset => ({
      address: asset.address,
      abi: ERC20Abi,
      functionName: 'balanceOf',
      args: [account],
      chainId: networkId,
    })),
  )
  return res.map((ele, index) => formatUnits(ele ?? 0, assets[index].decimals || 18))
}

const fetchUserAssetsData = async (assets, account, networkId) => {
  const nonBnbAssets = assets.slice(1)
  const { value: bnbBalance } = await getBalance(wagmiConfig, {
    address: account,
  })
  const userBalances = await fetchAssetsBalances(nonBnbAssets, account, networkId)

  const bnbAssetInfo = {
    ...assets[0],
    balance: formatEther(bnbBalance),
  }

  const nonBnbAssetsInfo = nonBnbAssets.map((asset, index) => ({
    ...asset,
    balance: userBalances[index],
  }))
  return [bnbAssetInfo, ...nonBnbAssetsInfo]
}

const AssetsContext = createContext(initialState)

function AssetsContextProvider({ children }) {
  const { account } = useWallet()
  const { networkId } = useChainSettings()
  const { liquidityHubEnabled } = liquidityHub.useLiquidtyHubSettings()

  const { data: assets = [] } = useSWRImmutable(
    ['assets/total', networkId, liquidityHubEnabled],
    async () => {
      const data = await fetchAssets(networkId, liquidityHubEnabled)
      return data
    },
    {
      revalidateOnFocus: false,
    },
  )

  const { data: userAssets, mutate: mutateAssets } = useSWRImmutable(
    assets.length > 0 && account && ['assets/user', account, networkId],
    async () => {
      const data = await fetchUserAssetsData(assets, account, networkId)
      return data
        .map(ele => ({
          ...ele,
          balance: BigNumber(ele.balance),
          totalValue: Number(ele.balance) * Number(ele.price),
        }))
        .sort((a, b) => b.totalValue - a.totalValue)
    },
    {
      refreshInterval: 10000,
      revalidateOnFocus: false,
    },
  )

  const final = useMemo(() => {
    if (!account) {
      return {
        mutateAssets: () => {},
        assets,
      }
    }
    if (!userAssets || !userAssets.length) {
      return {
        mutateAssets,
        assets,
      }
    }
    return {
      mutateAssets,
      assets: userAssets,
    }
  }, [assets, account, userAssets, mutateAssets])

  return <AssetsContext.Provider value={final}>{children}</AssetsContext.Provider>
}

const useAssets = () => {
  const { assets } = useContext(AssetsContext)

  const prevAssetsRef = useRef(assets)

  if (assets.length === 0) {
    return prevAssetsRef.current
  }

  prevAssetsRef.current = assets
  return assets
}

const useMutateAssets = () => {
  const { mutateAssets } = useContext(AssetsContext)
  return mutateAssets
}

export { AssetsContext, AssetsContextProvider, useAssets, useMutateAssets }
