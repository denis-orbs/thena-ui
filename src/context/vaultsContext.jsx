import React, { createContext, useContext, useMemo } from 'react'
import useSWR from 'swr'

import { ICHI_SINGLE_SIDED, PAIR_TYPES } from '@/constant'
import { useAssets } from '@/context/assetsContext'
import useWallet from '@/hooks/useWallet'
import { fetchUserVaultsData } from '@/lib/vaults/fetchUserVaults'
import { fetchVaultsData } from '@/lib/vaults/fetchVaults'
import { useChainSettings } from '@/state/settings/hooks'
import { fromWei, ZERO_VALUE } from '@/utils/utils'

const VaultsContext = createContext([])

export function VaultsContextProvider({ children }) {
  const { networkId } = useChainSettings()
  const { account } = useWallet()
  const assets = useAssets()
  const {
    data: vaultsData,
    error,
    isLoading: isLoadingVaultsData,
  } = useSWR(['vaults/total', networkId], () => fetchVaultsData(networkId), {
    refreshInterval: 60000,
  })
  const {
    data: userInfo,
    error: userError,
    isLoading: isLoadingUserInfo,
  } = useSWR(account ? ['vaults/user', account, networkId] : null, () => fetchUserVaultsData(account, networkId), {
    refreshInterval: 60000,
  })

  const isLoading = isLoadingVaultsData || isLoadingUserInfo

  const vaults = useMemo(() => {
    if (!vaultsData || vaultsData.chainId !== networkId || error || userError || !assets || !assets.length) return []

    return vaultsData.vaults.map(vault => {
      const asset0 = assets.find(asset => asset.address.toLowerCase() === vault.token0Address.toLowerCase())
      const asset1 = assets.find(asset => asset.address.toLowerCase() === vault.token1Address.toLowerCase())
      const asset2 = assets.find(asset => asset.address.toLowerCase() === vault.rewardAddress.toLowerCase())
      const reserve0 = fromWei(vault.reserve0, asset0?.decimals)
      const reserve1 = fromWei(vault.reserve1, asset1?.decimals)
      const tvl = reserve0.times(asset0?.price).plus(reserve1.times(asset1?.price))
      const lpPrice = vault.totalSupply.isZero() ? ZERO_VALUE : tvl.div(vault.totalSupply)
      const gaugeTvl = vault.gaugeSupply.times(lpPrice)
      const reward0PerYearInUsd = fromWei(vault.rewardRate0, asset0?.decimals)
        .times(asset0?.price)
        .times(86400 * 365)
      const reward1PerYearInUsd = fromWei(vault.rewardRate1, asset1?.decimals)
        .times(asset1?.price)
        .times(86400 * 365)
      const reward2PerYearInUsd = fromWei(vault.rewardRate2, asset2?.decimals)
        .times(asset2?.price)
        .times(86400 * 365)
      const isTwoRewards = [asset0?.address.toLowerCase(), asset1?.address.toLowerCase()].includes(
        asset2?.address.toLowerCase(),
      )
      const totalRewards = reward0PerYearInUsd.plus(reward1PerYearInUsd).plus(isTwoRewards ? 0 : reward2PerYearInUsd)
      const apr = gaugeTvl.isZero() ? ZERO_VALUE : totalRewards.div(gaugeTvl).times(100)
      const firstApr = gaugeTvl.isZero() ? ZERO_VALUE : reward0PerYearInUsd.div(gaugeTvl).times(100)
      const secondApr = gaugeTvl.isZero() ? ZERO_VALUE : reward1PerYearInUsd.div(gaugeTvl).times(100)
      const thirdApr = gaugeTvl.isZero() || isTwoRewards ? null : reward2PerYearInUsd.div(gaugeTvl).times(100)
      const apr_list = []
      apr_list.push({
        symbol: asset0?.symbol,
        apr: firstApr,
      })

      apr_list.push({
        symbol: asset1?.symbol,
        apr: secondApr,
      })

      if (thirdApr) {
        apr_list.push({
          symbol: asset2?.symbol,
          apr: thirdApr,
        })
      }

      const found = userInfo && userInfo.find(item => item.address.toLowerCase() === vault.address.toLowerCase())
      let user = {
        walletBalance: ZERO_VALUE,
        gaugeBalance: ZERO_VALUE,
        gaugeEarned: ZERO_VALUE,
        totalLp: ZERO_VALUE,
        staked0: ZERO_VALUE,
        staked1: ZERO_VALUE,
        stakedUsd: ZERO_VALUE,
        earned0: ZERO_VALUE,
        earned1: ZERO_VALUE,
        earnedUsd: ZERO_VALUE,
        total0: ZERO_VALUE,
        total1: ZERO_VALUE,
        totalUsd: ZERO_VALUE,
      }
      if (found) {
        const earned0 = fromWei(found.earned0, asset0?.decimals)
        const earned1 = fromWei(found.earned1, asset1?.decimals)
        const earned2 = fromWei(found.earned2, asset2?.decimals)

        user = {
          ...found,
          staked0: vault.totalSupply ? found.gaugeBalance.times(reserve0).div(vault.totalSupply) : ZERO_VALUE,
          staked1: vault.totalSupply ? found.gaugeBalance.times(reserve1).div(vault.totalSupply) : ZERO_VALUE,
          stakedUsd: found.gaugeBalance.times(lpPrice),
          total0: vault.totalSupply ? found.totalLp.times(reserve0).div(vault.totalSupply) : ZERO_VALUE,
          total1: vault.totalSupply ? found.totalLp.times(reserve1).div(vault.totalSupply) : ZERO_VALUE,
          totalUsd: found.totalLp.times(lpPrice),
          earned0,
          earned1,
          earned2: isTwoRewards ? null : earned2,
          earnedUsd: earned0
            .times(asset0?.price)
            .plus(earned1.times(asset1?.price))
            .plus(isTwoRewards ? 0 : earned2.times(asset2?.price)),
        }
      }

      return {
        address: vault.address,
        symbol: vault.symbol,
        title: ICHI_SINGLE_SIDED,
        type: PAIR_TYPES.LSD,
        totalSupply: vault.totalSupply,
        lpPrice,
        token0: {
          ...asset0,
          reserve: reserve0,
          allowed: vault.allowed0,
        },
        token1: {
          ...asset1,
          reserve: reserve1,
          allowed: vault.allowed1,
        },
        reward: asset2,
        allowed: vault.allowed0 ? asset0 : asset1,
        gauge: {
          address: vault.gaugeAddress,
          tvl: gaugeTvl,
          apr,
          apr_list,
          pooled0: vault.totalSupply ? reserve0.times(vault.gaugeSupply).div(vault.totalSupply) : ZERO_VALUE,
          pooled1: vault.totalSupply ? reserve1.times(vault.gaugeSupply).div(vault.totalSupply) : ZERO_VALUE,
        },
        account: user,
        algebraV2: vault.algebraV2Address,
        algebra: vault.algebraAddress,
        basePool: vault.basePool,
        version: vault.version,
      }
    })
  }, [vaultsData, userInfo, assets, error, userError, networkId])

  return (
    <VaultsContext.Provider value={vaults} isLoading={isLoading}>
      {children}
    </VaultsContext.Provider>
  )
}

export const useVaults = () => {
  const vaults = useContext(VaultsContext)
  return vaults
}

export const useIsLoadingVaults = () => {
  const { isLoading } = useContext(VaultsContext)
  return isLoading
}
