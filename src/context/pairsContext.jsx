import React, { createContext, useContext, useMemo } from 'react'
import useSWR from 'swr'
import { ChainId } from 'thena-sdk-core'

import { PAIR_TYPES, UNKNOWN_LOGO } from '@/constant'
import { fetchBscPairs, fetchOpPairs } from '@/lib/api'
import { formatAmount } from '@/lib/utils'
import { useAssets } from '@/state/assets/hooks'
import { usePools } from '@/state/pools/hooks'
import { useChainSettings } from '@/state/settings/hooks'

import { useVaults } from './vaultsContext'

const initialState = {
  [ChainId.BSC]: {
    data: [],
    isLoading: false,
  },
  [ChainId.OPBNB]: {
    data: [],
    isLoading: false,
  },
}

const PairsContext = createContext(initialState)

function PairsContextProvider({ children }) {
  const { networkId } = useChainSettings()
  const { data: bscPairs, isLoading: bscLoading } = useSWR(
    networkId === ChainId.BSC ? 'bsc pairs api' : null,
    { fetcher: fetchBscPairs },
    {
      refreshInterval: 60000,
    },
  )
  const { data: opPairs, isLoading: opLoading } = useSWR(
    networkId === ChainId.OPBNB ? 'opbnb pairs api' : null,
    {
      fetcher: fetchOpPairs,
    },
    {
      refreshInterval: 60000,
    },
  )

  const pairs = useMemo(
    () => ({
      [ChainId.BSC]: { data: bscPairs || [], isLoading: bscLoading },
      [ChainId.OPBNB]: { data: opPairs || [], isLoading: opLoading },
    }),
    [bscPairs, bscLoading, opPairs, opLoading],
  )

  return <PairsContext.Provider value={pairs}>{children}</PairsContext.Provider>
}

const usePairs = () => {
  const { networkId } = useChainSettings()
  const pairs = useContext(PairsContext)
  const assets = useAssets()
  const pools = usePools()
  const vaults = useVaults()

  return useMemo(() => {
    const { data, isLoading } = pairs[networkId]
    if (!assets.length || !pools.length || !data) {
      return {
        pairs: [],
        isLoading,
      }
    }
    const result = data
      .map(ele => {
        const asset0 = assets.find(asset => asset.address === ele.token0)
        const asset1 = assets.find(asset => asset.address === ele.token1)
        const symbol0 = asset0?.symbol === 'WBNB' ? 'BNB' : asset0?.symbol || 'UNKNOWN'
        const symbol1 = asset1?.symbol === 'WBNB' ? 'BNB' : asset1?.symbol || 'UNKNOWN'
        return {
          ...ele,
          type: ele.isFusion ? PAIR_TYPES.LSD : ele.isStable ? PAIR_TYPES.STABLE : PAIR_TYPES.CLASSIC,
          symbol: `${symbol0}/${symbol1}`,
          token0: {
            address: ele.token0,
            symbol: symbol0,
            derived: ele.token0Derived,
            logoURI: asset0?.logoURI || UNKNOWN_LOGO,
          },
          token1: {
            address: ele.token1,
            symbol: symbol1,
            derived: ele.token1Derived,
            logoURI: asset1?.logoURI || UNKNOWN_LOGO,
          },
        }
      })
      .map(pair => {
        const subpools = [...pools, ...vaults]
          .filter(
            ele =>
              [ele.token0.address, ele.token1.address].includes(pair.token0.address) &&
              [ele.token0.address, ele.token1.address].includes(pair.token1.address) &&
              ele.type === pair.type,
          )
          .sort((a, b) => b.gauge.apr.minus(a.gauge.apr).toNumber())
        const highApr = subpools.length > 0 ? subpools[0].gauge.apr.toNumber() : 0
        const poolsWithApr = subpools.filter(ele => ele.gauge.apr.gt(1))
        const lowApr = poolsWithApr.length > 0 ? poolsWithApr[poolsWithApr.length - 1].gauge.apr.toNumber() : 0
        const apr =
          !subpools.length || !highApr
            ? '0%'
            : subpools.length === 1
              ? `${formatAmount(highApr)}%`
              : `${formatAmount(lowApr)} - ${formatAmount(highApr)}%`
        return {
          ...pair,
          apr,
          lowApr,
          highApr,
          subpools,
        }
      })
    return {
      pairs: result,
      isLoading,
    }
  }, [pairs, assets, pools, vaults, networkId])
}

export { PairsContext, PairsContextProvider, usePairs }
