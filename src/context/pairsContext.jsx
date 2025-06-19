import BigNumber from 'bignumber.js'
import React, { createContext, useContext, useEffect, useMemo, useRef } from 'react'
import useSWR, { mutate } from 'swr'
import { zeroAddress } from 'viem'

import { ICHI_SINGLE_SIDED, PAIR_TYPES } from '@/constant'
import { useAssets } from '@/context/assetsContext'
import { fetchTopPairs, fetchWeightedPools } from '@/lib/api'
import { getTokenInfo } from '@/lib/helper'
import { formatAmount } from '@/lib/utils'
import { usePools } from '@/state/pools/hooks'
import { useChainSettings } from '@/state/settings/hooks'

import { useCustomAssets } from './customAssetsContext'
import { useVaults } from './vaultsContext'

const initialState = {
  data: [],
  isLoading: false,
}

const PairsContext = createContext(initialState)

function PairsContextProvider({ children }) {
  const { networkId } = useChainSettings()
  const { data: pairList = [], isLoading: pairsLoading } = useSWR(
    ['pairs api v3', networkId],
    { fetcher: () => fetchTopPairs({ networkId }) },
    {
      refreshInterval: 60000,
    },
  )

  const { data: weightedPools = [], isLoading: weightedLoading } = useSWR(
    ['weighted pool api', networkId],
    { fetcher: () => fetchWeightedPools({ networkId }) },
    {
      refreshInterval: 60000,
    },
  )
  const prevNetworkId = useRef(networkId)
  useEffect(() => {
    if (networkId && networkId !== prevNetworkId.current) {
      mutate(['pairs api v3', networkId])
      mutate(['weighted pool api', networkId])
      prevNetworkId.current = networkId
    }
  }, [networkId])

  const pairs = useMemo(
    () => ({
      data: [...weightedPools, ...pairList],
      isLoading: pairsLoading || weightedLoading,
    }),
    [weightedPools, pairList, pairsLoading, weightedLoading],
  )

  return <PairsContext.Provider value={pairs}>{children}</PairsContext.Provider>
}

const usePairs = () => {
  const pairs = useContext(PairsContext)
  const assets = useAssets()
  const customAssets = useCustomAssets()
  const pools = usePools()
  const vaults = useVaults()
  const prevPair = useRef([])

  return useMemo(() => {
    const { data, isLoading } = pairs
    if (!assets.length || !pools.length || !data) {
      return {
        pairs: prevPair.current,
        isLoading,
      }
    }

    const weightedPoolsData = []

    const result = data
      .map(ele => {
        // Weighted pools
        if (ele.tokens && Array.isArray(ele.tokens)) {
          const tokens = ele.tokens.map(token => {
            const tokenDetail = getTokenInfo({ tokenAddress: token.address, assets, customAssets })
            const symbol = tokenDetail?.symbol === 'WBNB' ? 'BNB' : tokenDetail?.symbol || 'UNKNOWN'

            return {
              ...token,
              ...tokenDetail,
              symbol,
              weight: Number(token.weight),
            }
          })

          const value = {
            ...ele,
            apr: `${formatAmount(ele.apr) || 0}%`,
            aprNumber: ele.apr,
            gauge: {
              ...ele.gauge,
              voteApr: new BigNumber(ele?.gauge?.voteApr || 0),
            },
            tokens,
            type: PAIR_TYPES.WEIGHTED,
            subpools: [],
          }

          weightedPoolsData.push(value)

          return value
        }

        return ele
      })
      .map(pair => {
        if (pair.type === PAIR_TYPES.WEIGHTED) {
          return pair // NOTE: Weighted pools dont have subpools
        }

        const subpools = [...pools, ...vaults]
          .filter(ele => ele.basePool.toLowerCase() === pair.address.toLowerCase())
          .sort((a, b) => b.gauge.apr.minus(a.gauge.apr).toNumber())

        const v3Subpools = subpools.filter(ele => {
          const isV3 = ele.version === 3
          const isNotCLSwapFee = ele.gauge.address !== zeroAddress ? ele.title !== 'CL_SwapFee' : true
          const isSingleSided = ele.title === ICHI_SINGLE_SIDED
          return (isV3 && isNotCLSwapFee) || isSingleSided
        })
        const highApr = v3Subpools.length > 0 ? v3Subpools[0].gauge.apr.toNumber() : 0
        const poolsWithApr = v3Subpools.filter(ele => ele.gauge.apr.gt(0))
        const lowApr = poolsWithApr.length > 0 ? poolsWithApr[poolsWithApr.length - 1].gauge.apr.toNumber() : 0
        const apr =
          !v3Subpools.length || !highApr
            ? '0%'
            : v3Subpools.length === 1 || lowApr === highApr || lowApr === 0
              ? `${formatAmount(highApr, true)}%`
              : `${formatAmount(lowApr, true)} ~ ${formatAmount(highApr, true)}%`

        const singleSideVault = vaults.find(v => v.algebra === pair.address)

        return {
          ...pair,
          apr,
          lowApr,
          highApr,
          subpools,
          tvlUSD: singleSideVault
            ? BigNumber(singleSideVault?.gauge?.tvl || 0)
                .plus(BigNumber(pair.tvlUSD))
                .toNumber()
            : pair.tvlUSD,
          reserve0: singleSideVault
            ? BigNumber(singleSideVault?.token0?.reserve || 0)
                .plus(BigNumber(pair.reserve0))
                .toNumber()
            : pair.reserve0,
          reserve1: singleSideVault
            ? BigNumber(singleSideVault?.token1?.reserve || 0)
                .plus(BigNumber(pair.reserve1))
                .toNumber()
            : pair.reserve1,
        }
      })

    prevPair.current = result

    return {
      pairs: result,
      weightedPools: weightedPoolsData,
      isLoading,
    }
  }, [pairs, assets, pools, customAssets, vaults])
}

export { PairsContext, PairsContextProvider, usePairs }
