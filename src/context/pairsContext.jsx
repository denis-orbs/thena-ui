import React, { createContext, useContext, useMemo } from 'react'
import useSWR from 'swr'
import { ChainId } from 'thena-sdk-core'

import { PAIR_TYPES, UNKNOWN_LOGO } from '@/constant'
import { useAssets } from '@/context/assetsContext'
import { fetchBscPairs, fetchBscTestnetPairsV3, fetchOpPairs, fetchWeightedPools } from '@/lib/api'
import { formatAmount, isoDateToFormatDate } from '@/lib/utils'
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
  97: {
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

  const { data: bscTestnetPairsV3 = [], isLoading: bscTestnetV3Loading } = useSWR(
    networkId === 97 ? 'bscTestnet pairs api version 3' : null,
    { fetcher: fetchBscTestnetPairsV3 },
    {
      refreshInterval: 60000,
    },
  )

  const { data: weightedPools = [], isLoading: weightedLoading } = useSWR(
    networkId === 97 && ['weighted pool api'],
    () => fetchWeightedPools(networkId),
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
      97: { data: [...weightedPools, ...(bscTestnetPairsV3 || [])], isLoading: bscTestnetV3Loading || weightedLoading },
    }),
    [bscPairs, bscLoading, opPairs, opLoading, weightedPools, bscTestnetPairsV3, bscTestnetV3Loading, weightedLoading],
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
        // Weighted pools
        if (ele.tokens && Array.isArray(ele.tokens)) {
          const tokens = ele.tokens.map(token => {
            const tokenDetail = assets.find(asset => asset?.address?.toLowerCase() === token?.address?.toLowerCase())
            tokenDetail.symbol = tokenDetail?.symbol === 'WBNB' ? 'BNB' : tokenDetail?.symbol || 'UNKNOWN'

            return {
              ...token,
              ...tokenDetail,
            }
          })

          return {
            ...ele,
            tokens,
            type: PAIR_TYPES.WEIGHTED,
            createdAt: isoDateToFormatDate(ele?.createdAt),
            subpools: [],
          }
        }
        const asset0 = assets.find(asset => asset.address.toLowerCase() === ele.token0)
        const asset1 = assets.find(asset => asset.address.toLowerCase() === ele.token1)
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
        if (pair.type === PAIR_TYPES.WEIGHTED) {
          return pair // TODO: don't have subpools for Pair type `weighted`
        }
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
            : subpools.length === 1 || lowApr === highApr
              ? `${formatAmount(highApr)}%`
              : `${formatAmount(lowApr)} ~ ${formatAmount(highApr)}%`
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
