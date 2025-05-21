import { useMemo } from 'react'
import useSWR from 'swr'
import { zeroAddress } from 'viem'

import { GAMMA_TYPES, ICHI_TYPES, MANUAL_TYPES, PAIR_TYPES, UNKNOWN_LOGO } from '@/constant'
import { useAssets } from '@/context/assetsContext'
import { fetchFusionPools } from '@/lib/api'
import { useChainSettings } from '@/state/settings/hooks'

export const usePoolWithoutGauge = () => {
  const assets = useAssets()
  const { networkId } = useChainSettings()

  const { data: [fusionPoolsV3 = [], fusionPoolsV2 = []] = [] } = useSWR(
    ['fusions api', networkId],
    () =>
      Promise.all([
        fetchFusionPools({
          networkId,
          version: 3,
        }),
        fetchFusionPools({
          networkId,
          version: 2,
        }),
      ]),
    {
      refreshInterval: 60000,
    },
  )

  const { data: fusionSolidlyV3 = [] } = useSWR(
    ['fusions solid v3 api', networkId],
    () =>
      fetchFusionPools({
        networkId,
        version: 3,
        type: 'solidly',
      }),
    {
      refreshInterval: 60000,
    },
  )

  const solidlyV3Addresses = useMemo(() => fusionSolidlyV3.map(p => p.address), [fusionSolidlyV3])
  const filteredFusionPoolsV2 = useMemo(
    () => fusionPoolsV2.filter(p => !solidlyV3Addresses.includes(p.address)),
    [fusionPoolsV2, solidlyV3Addresses],
  )

  const pools = useMemo(() => [...fusionPoolsV3, ...filteredFusionPoolsV2], [fusionPoolsV3, filteredFusionPoolsV2])

  let userInfo = []

  if (pools.length > 0 && assets.length > 0) {
    userInfo = pools.map(fusion => {
      const { gauge } = fusion
      let kind
      if ([...GAMMA_TYPES, ...MANUAL_TYPES, ...ICHI_TYPES, 'DefiEdge'].includes(fusion.type)) {
        kind = PAIR_TYPES.LSD
      } else {
        kind = fusion.type === 'Stable' ? PAIR_TYPES.STABLE : PAIR_TYPES.CLASSIC
      }

      const asset0 = assets.find(ele => ele.address.toLowerCase() === fusion?.token0?.address?.toLowerCase())
      const asset1 = assets.find(ele => ele.address.toLowerCase() === fusion?.token1?.address?.toLowerCase())
      const allowed = assets.find(ele => ele.address.toLowerCase() === fusion?.allowed?.address?.toLowerCase())
      const token0 = {
        address: asset0?.address || fusion?.token0?.address,
        symbol: asset0?.symbol || 'UNKNOWN',
        decimals: asset0?.decimals || 18,
        logoURI: asset0?.logoURI || UNKNOWN_LOGO,
        price: asset0?.price || 0,
      }
      const token1 = {
        address: asset1?.address || fusion?.token1?.address,
        symbol: asset1?.symbol || 'UNKNOWN',
        decimals: asset1?.decimals || 18,
        logoURI: asset1?.logoURI || UNKNOWN_LOGO,
        price: asset1?.price || 0,
      }
      const token0Reserve = fusion.token0.reserve
      const token1Reserve = fusion.token1.reserve
      let totalTvl
      if (token0.price > 0 && token1.price > 0) {
        totalTvl = token0Reserve * token0.price + token1Reserve * token1.price
      } else if (token0.price > 0) {
        totalTvl = token0Reserve * token0.price * 2
      } else if (token1.price > 0) {
        totalTvl = token1Reserve * token1.price * 2
      } else {
        totalTvl = 0
      }
      const gaugeTvl = fusion.tvl
      let bribeUsd = 0
      const poolBribes = gauge.bribes
      let finalBribes = { fee: null, bribe: null }
      if (poolBribes) {
        if (poolBribes.bribe) {
          finalBribes.bribe = []
          poolBribes.bribe.forEach(ele => {
            const found = assets.find(asset => asset.address.toLowerCase() === ele.address.toLowerCase())
            bribeUsd += ele.amount * (found?.price || 0)
            finalBribes = {
              bribe: [
                ...finalBribes.bribe,
                {
                  address: ele.address,
                  decimals: found?.decimals || 18,
                  amount: ele.amount,
                  symbol: found?.symbol || 'UNKNOWN',
                },
              ],
            }
          })
        }
        if (poolBribes.fee) {
          finalBribes.fee = []
          poolBribes.fee.forEach(ele => {
            const found = assets.find(asset => asset.address.toLowerCase() === ele.address.toLowerCase())
            bribeUsd += ele.amount * (found?.price || 0)
            finalBribes = {
              ...finalBribes,
              fee: [
                ...finalBribes.fee,
                {
                  address: ele.address,
                  decimals: found?.decimals || 18,
                  amount: ele.amount,
                  symbol: found?.symbol || 'UNKNOWN',
                },
              ],
            }
          })
        }
      }

      return {
        ...fusion,
        stable: fusion.type === 'Stable',
        type: kind,
        title: fusion.type,
        tvl: totalTvl,
        token0: {
          ...token0,
          reserve: fusion.token0.reserve,
        },
        token1: {
          ...token1,
          reserve: fusion.token1.reserve,
        },
        allowed: {
          address: allowed?.address,
          symbol: allowed?.symbol,
          decimals: allowed?.decimals,
          logoURI: allowed?.logoURI,
          price: allowed?.price,
        },
        gauge: {
          ...fusion.gauge,
          bribes: finalBribes,
          tvl: gaugeTvl,
          apr: fusion.gauge.apr,
          bribeUsd,
          pooled0: fusion.totalSupply ? (fusion.token0.reserve * fusion.gauge.totalSupply) / fusion.totalSupply : 0,
          pooled1: fusion.totalSupply ? (fusion.token1.reserve * fusion.gauge.totalSupply) / fusion.totalSupply : 0,
        },
      }
    })
  }

  return userInfo.filter(
    pair =>
      pair &&
      (pair.gauge.address === zeroAddress ||
        (pair.version === 2 && [PAIR_TYPES.CLASSIC, PAIR_TYPES.STABLE].includes(pair?.title))) &&
      (pair.type === PAIR_TYPES.LSD ? pair?.title === 'CL_Farming' : true),
  )
}
