import BigNumber from 'bignumber.js'
import { useEffect, useMemo } from 'react'
import useSWR from 'swr'
import { Position } from 'thena-fusion-sdk'
import { CurrencyAmount } from 'thena-sdk-core'
import { zeroAddress } from 'viem'
import { useReadContract, useSimulateContract } from 'wagmi'

import Contracts from '@/constant/contracts'
import { useCurrency, useGetAsset, useToken } from '@/hooks/fusion/Tokens'
import { useCalculateAPR } from '@/hooks/fusion/useEstimateAPR'
import { useFusionState } from '@/hooks/fusion/useFusions'
import usePrevious from '@/hooks/usePrevious'
import useWallet from '@/hooks/useWallet'
import { getFarmingCenterContract, getIncentiveContract } from '@/lib/contracts'
import { fromWei } from '@/lib/utils'

import { fetchManualInfo } from './ManualItem'

function ManualCalculator({ position, onData = () => {}, index }) {
  const isFarming = useMemo(() => position?.deployer === zeroAddress, [position?.deployer])
  const { chainId, account } = useWallet()
  const { asset0, asset1, liquidity, tickLower, tickUpper, version, tokenId } = position
  const currency0 = useCurrency(asset0.address)
  const currency1 = useCurrency(asset1.address)
  const [fusionState, fusion, poolAddress] = useFusionState({
    currencyA: currency0,
    currencyB: currency1,
    isFarmingPool: isFarming,
    version,
  })

  const [prevFusionState, prevFusion] = usePrevious([fusionState, fusion]) || []

  const [, _fusion] = useMemo(() => {
    if (!fusion && prevFusion && prevFusionState) {
      return [prevFusionState, prevFusion]
    }

    return [fusionState, fusion]
  }, [fusion, fusionState, prevFusion, prevFusionState])

  const _position = useMemo(() => {
    if (_fusion) {
      return new Position({
        pool: _fusion,
        liquidity: new BigNumber(liquidity).toString(10),
        tickLower,
        tickUpper,
      })
    }
    return undefined
  }, [liquidity, _fusion, tickLower, tickUpper])

  const amount0 = useMemo(() => (_position ? _position.amount0.toExact() : 0), [_position])
  const amount1 = useMemo(() => (_position ? _position.amount1.toExact() : 0), [_position])
  const amount0InUsd = useMemo(() => {
    if (!isFarming) {
      return BigNumber(amount0).times(asset0.price).toNumber()
    }
    return BigNumber(amount0) * asset0.price
  }, [amount0, asset0.price, isFarming])

  const amount1InUsd = useMemo(() => {
    if (position?.deployer !== zeroAddress) {
      return BigNumber(amount1).times(asset1.price).toNumber()
    }
    return BigNumber(amount1) * asset1.price
  }, [amount1, asset1.price, position?.deployer])

  const apr = useCalculateAPR({
    position,
    poolAddress,
    totalLiquidity: _fusion?.liquidity,
    tvl: amount0InUsd + amount1InUsd,
  })

  const token0 = useToken(asset0.address)
  const token1 = useToken(asset1.address)

  // Reward farming:
  const incentiveMaker = getIncentiveContract(chainId)
  const { data: poolKey } = useReadContract({
    ...incentiveMaker,
    functionName: 'poolToKey',
    args: [poolAddress],
    query: {
      enabled: !!poolAddress && isFarming,
      staleTime: Infinity,
    },
  })
  const farmingCenter = getFarmingCenterContract(chainId)
  const { data: farmRewards } = useSimulateContract({
    ...farmingCenter,
    functionName: 'collectRewards',
    args: [poolKey, position?.tokenId],
    query: {
      enabled: !!poolKey && !!position?.tokenId && isFarming,
    },
  })
  const farmRewardData = farmRewards?.result

  const THE = useGetAsset(Contracts.THE[chainId])
  const WBNB = useGetAsset(Contracts.WBNB[chainId])

  // for manual
  const { data: fees } = useSWR(
    account && tokenId && !isFarming ? ['manuals/fee', tokenId, account, chainId] : null,
    () => fetchManualInfo(account, tokenId, chainId, version),
    {
      refreshInterval: 60000,
    },
  )

  const feesInUsd = useMemo(() => {
    let usdFee = new BigNumber(0)

    if (!isFarming) {
      usdFee = fromWei(fees ? fees[0] : 0, asset0.decimals)
        .times(asset0?.price ?? 0)
        .plus(fromWei(fees ? fees[1] : 0, asset1.decimals).times(asset1?.price ?? 0))
    } else if (farmRewardData) {
      usdFee = usdFee
        .plus(fromWei(farmRewardData[0]).times(THE.price))
        .plus(fromWei(farmRewardData[1]).times(WBNB.price))
    }

    return usdFee
  }, [
    isFarming,
    farmRewardData,
    fees,
    asset0.decimals,
    asset0?.price,
    asset1.decimals,
    asset1?.price,
    THE.price,
    WBNB.price,
  ])

  const fiatValueOfLiquidity = useMemo(() => amount0InUsd + amount1InUsd, [amount0InUsd, amount1InUsd])

  const { reward0, reward1 } = useMemo(
    () => ({
      reward0: {
        token: isFarming ? THE : token0,
        amount: CurrencyAmount.fromRawAmount(token0, BigNumber(fees?.[0] ?? 0n)),
      },
      reward1: {
        token: isFarming ? WBNB : token1,
        amount: CurrencyAmount.fromRawAmount(token1, BigNumber(fees?.[1] ?? 0n)),
      },
    }),
    [isFarming, THE, token0, fees, WBNB, token1],
  )

  useEffect(() => {
    onData({
      position: {
        ...position,
        key: isFarming ? poolKey : position.key,
      },
      apr: apr.toNumber(),
      depositLiquidity: fiatValueOfLiquidity,
      rewards: [reward0, reward1],
      rewardUsd: Number(feesInUsd),
      index,
    })
  }, [apr, feesInUsd, fiatValueOfLiquidity, index, isFarming, onData, poolKey, position, reward0, reward1])
  return null
}

export default ManualCalculator
