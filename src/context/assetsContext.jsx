import { getBalance } from '@wagmi/core'
import BigNumber from 'bignumber.js'
import React, { createContext, useContext, useMemo } from 'react'
import useSWRImmutable from 'swr/immutable'
import { formatEther, formatUnits } from 'viem'

import { ERC20Abi } from '@/constant/abi'
import { fetchAssets } from '@/lib/api'
import { callMulti } from '@/lib/contractActions'
import useWallet from '@/lib/wallets/useWallet'
import { liquidityHub } from '@/modules/LiquidityHub'
import { useChainSettings } from '@/state/settings/hooks'

import { wagmiConfig } from './Web3Modal'

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
  const { data: assets } = useSWRImmutable(['assets/total', networkId, liquidityHubEnabled], async () => {
    const data = await fetchAssets(networkId, liquidityHubEnabled)
    return data
  })
  const { data: userAssets, mutate: mutateAssets } = useSWRImmutable(
    assets && assets.length > 0 && account && ['assets/user', account, networkId],
    async () => {
      const data = await fetchUserAssetsData(assets, account, networkId)
      return data
        .map(ele => ({
          ...ele,
          balance: new BigNumber(ele.balance),
        }))
        .sort((a, b) => {
          if (a.balance.times(a.price).lt(b.balance.times(b.price))) return 1
          if (a.balance.times(a.price).gt(b.balance.times(b.price))) return -1
          return 0
        })
    },
  )
  const final = useMemo(() => {
    if (!account) {
      return {
        mutateAssets: () => {},
        assets: assets || [],
      }
    }
    if (!userAssets || !userAssets.length) {
      return {
        mutateAssets,
        assets: assets || [],
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
  return assets
}

const useMutateAssets = () => {
  const { mutateAssets } = useContext(AssetsContext)
  return mutateAssets
}

export { AssetsContext, AssetsContextProvider, useAssets, useMutateAssets }
