import BigNumber from 'bignumber.js'
import moment from 'moment'
import { useMemo } from 'react'
import { CurrencyAmount } from 'thena-sdk-core'
import { Position } from 'thenafi-fusion-sdk'
import { zeroAddress } from 'viem'

import Contracts from '@/constant/contracts'
import { batchCallMulti, simulateCall } from '@/lib/contractActions'
import { getFarmingCenterContract, getIncentiveContract } from '@/lib/contracts'
import { getCollectedRewards, getFusionFarmingData, getFusionFeesData } from '@/lib/subgraph'
import { fromWei, ZERO_VALUE } from '@/lib/utils'

import { useGetAssetFn } from '../fusion/Tokens'
import { getFarmInfoList } from '../fusion/useEstimateAPR'
import { getListComputePoolAddress, PoolState, useGetMultipleFusionState } from '../fusion/useFusions'
import { useCachedSWR } from '../useCachedSWR'
import usePrevious from '../usePrevious'
import useWallet from '../useWallet'

const REFRESH_INTERVAL = 60000 // every 1 minute

const getPoolKey = async (farmAddress, chainId) => {
  const incentiveMaker = getIncentiveContract(chainId)
  return batchCallMulti(
    farmAddress.map(address => ({
      ...incentiveMaker,
      functionName: 'poolToKey',
      args: [address],
    })),
  )
}

const getFarmRewardList = async (positions, poolKeys, chainId, account) => {
  const farmingCenter = getFarmingCenterContract(chainId)
  const farmRewardsList = []

  const rewards = await getCollectedRewards(account, chainId)

  for (let i = 0; i < positions.length; i++) {
    const pos = positions[i]
    const poolKey = poolKeys[i]

    try {
      const collectRewards = await simulateCall(farmingCenter, 'collectRewards', [poolKey, pos?.tokenId], chainId)
      const reward = rewards[pos?.tokenId] || {}

      farmRewardsList.push([
        BigNumber(collectRewards[0]).plus(reward[Contracts.THE[chainId].toLowerCase()] ?? '0'),
        BigNumber(collectRewards[1]).plus(reward[Contracts.WBNB[chainId].toLowerCase()] ?? '0'),
      ])
    } catch (error) {
      farmRewardsList.push([0n, 0n])
    }
  }

  return farmRewardsList
}

export const useFarmPositions = positions => {
  const { chainId, account } = useWallet()
  const { getAsset } = useGetAssetFn()

  // Generate SWR keys with memoization
  const farmAddressesKey = useMemo(
    () => (positions.length && account && chainId ? ['getFarmPoolAddress', chainId, account, positions] : null),
    [positions, chainId, account],
  )

  // Farm address list
  const { data: farmAddresses } = useCachedSWR(
    farmAddressesKey,
    () => getListComputePoolAddress(positions, chainId, getAsset),
    { refreshInterval: REFRESH_INTERVAL },
  )

  // Farming list
  const fusionFarmingKey = useMemo(
    () =>
      farmAddresses?.length > 0 && account && chainId
        ? ['getFusionFarmingData', chainId, account, farmAddresses]
        : null,
    [farmAddresses, chainId, account],
  )

  const { data: fusionFarmings } = useCachedSWR(
    fusionFarmingKey,
    () => getFusionFarmingData({ poolIds: farmAddresses, chainId }),
    { refreshInterval: REFRESH_INTERVAL },
  )

  // Annual pool fees
  const annualPoolKey = useMemo(
    () =>
      farmAddresses?.length > 0 && account && chainId ? ['getFusionFeesData', chainId, account, farmAddresses] : null,
    [farmAddresses, chainId, account],
  )

  const { data: annualPoolFeesPools } = useCachedSWR(
    annualPoolKey,
    () => getFusionFeesData({ chainId, poolIds: farmAddresses, date: moment().subtract(7, 'days').unix() }),
    { refreshInterval: REFRESH_INTERVAL },
  )

  // Fusion states
  const fusionStates = useGetMultipleFusionState(positions, farmAddresses)
  const prevFusionStates = usePrevious(fusionStates)

  const _fusionStates = useMemo(() => {
    if ((!fusionStates || fusionStates.length <= 0) && prevFusionStates) {
      return prevFusionStates || []
    }
    return fusionStates
  }, [fusionStates, prevFusionStates])

  // Pool keys
  const poolKeysKey = useMemo(
    () => (farmAddresses?.length > 0 && account && chainId ? ['getPoolToKey', chainId, account, farmAddresses] : null),
    [farmAddresses, chainId, account],
  )

  const { data: poolKeys = [] } = useCachedSWR(poolKeysKey, () => getPoolKey(farmAddresses, chainId), {
    refreshInterval: REFRESH_INTERVAL,
  })

  // Farm rewards
  const farmRewardsKey = useMemo(
    () => (poolKeys?.length > 0 && account ? ['getFarmRewardsList', poolKeys, chainId, account] : null),
    [poolKeys, account, chainId],
  )

  const { data: farmRewardsList = [] } = useCachedSWR(
    farmRewardsKey,
    () => getFarmRewardList(positions, poolKeys, chainId, account),
    { refreshInterval: REFRESH_INTERVAL },
  )

  // Farm info list
  const farmInfoKey = useMemo(
    () =>
      farmAddresses?.length > 0 && fusionFarmings?.length > 0 && account && chainId
        ? ['getFarmInfoList', account, farmAddresses, fusionFarmings, chainId]
        : null,
    [farmAddresses, account, fusionFarmings, chainId],
  )

  const { data: farmInfoList = [] } = useCachedSWR(farmInfoKey, () => getFarmInfoList(farmAddresses, fusionFarmings), {
    refreshInterval: REFRESH_INTERVAL,
  })

  const THE = useMemo(() => getAsset(Contracts.THE[chainId]), [chainId, getAsset])
  const WBNB = useMemo(() => getAsset(Contracts.WBNB[chainId]), [chainId, getAsset])

  const result = useMemo(() => {
    if (!_fusionStates || !_fusionStates.length) return []

    return positions.map((farmPos, index) => {
      const { asset0, asset1, liquidity, tickLower, tickUpper } = farmPos
      const [fusionState, fusion, poolAddress = zeroAddress, tickSpacing] = _fusionStates?.[index] || [
        PoolState.NOT_EXISTS,
        null,
      ]
      const farmRewardData = farmRewardsList[index]

      const farmingData = fusionFarmings.find(item => item.pool.toLowerCase() === farmAddresses[index]) ?? {}
      const position = fusion
        ? new Position({
            pool: fusion,
            liquidity: new BigNumber(liquidity).toString(10),
            tickLower,
            tickUpper,
          })
        : undefined

      const amount0 = position ? position.amount0.toExact() : 0
      const amount1 = position ? position.amount1.toExact() : 0
      const amount0InUsd = BigNumber(amount0).multipliedBy(asset0.price)
      const amount1InUsd = BigNumber(amount1).multipliedBy(asset1.price)

      const { rewardRate = '0', rewardToken, bonusRewardRate = '0', bonusRewardToken, virtualPool } = farmingData || {}

      const tokenReward = getAsset(rewardToken)
      const tokenBonus = getAsset(Number(bonusRewardRate) !== 0 ? bonusRewardToken : null)
      const rewardPerSecond = fromWei(rewardRate)
        .times(tokenReward?.price ?? 0)
        .plus(fromWei(bonusRewardRate).times(tokenBonus?.price ?? 0))

      const apr = (() => {
        if (!tickLower || !tickUpper || !position) return ZERO_VALUE

        const farmInfo = farmInfoList[index] || {}
        const { earnPercent = 0, totalLiquidityInFarm, rewardReserve } = farmInfo

        const tvl = amount0InUsd.plus(amount1InUsd)
        const totalLiquidity = fusion?.liquidity
        const annualPoolFees = annualPoolFeesPools?.[poolAddress.toLowerCase()]?.annualPoolFees || ZERO_VALUE
        const hasEmission = Number(rewardReserve?.[0]) > 0 || Number(rewardReserve?.[1]) > 0n

        const farmRatio =
          Number(totalLiquidityInFarm) > 0 ? BigNumber(position?.liquidity ?? 0).div(totalLiquidityInFarm) : ZERO_VALUE
        const farmApr =
          tvl.gt(0) && hasEmission
            ? rewardPerSecond
                .times(farmRatio)
                .times(86400 * 365)
                .div(tvl)
                .times(100)
            : ZERO_VALUE

        const feeRatio = Number(totalLiquidity) > 0 ? BigNumber(liquidity).div(totalLiquidity) : ZERO_VALUE
        const feeAPR = Number(tvl) > 0 ? feeRatio.times(annualPoolFees).div(tvl).times(earnPercent) : ZERO_VALUE

        return farmApr.plus(feeAPR)
      })()

      const { reward0, reward1 } = {
        reward0: {
          token: THE,
          amount: CurrencyAmount.fromRawAmount(THE, BigNumber(farmRewardData?.[0] ?? 0n)),
        },
        reward1: {
          token: WBNB,
          amount: CurrencyAmount.fromRawAmount(WBNB, BigNumber(farmRewardData?.[1] ?? 0n)),
        },
      }

      const feesInUsd = (() => {
        if (!farmRewardData) return new BigNumber(0)
        return fromWei(farmRewardData[0]).times(THE.price).plus(fromWei(farmRewardData[1]).times(WBNB.price))
      })()

      const fiatValueOfLiquidity = amount0InUsd.plus(amount1InUsd)
      const firstPercent = amount0InUsd.div(fiatValueOfLiquidity).multipliedBy(100).toNumber().toFixed(2)

      return {
        ...farmPos,
        amount0: Number(amount0),
        amount1: Number(amount1),
        key: poolKeys[index],
        apr: apr.toNumber(),
        feesInUsd,
        fiatValueOfLiquidity,
        firstPercent,
        rewards: [reward0, reward1],
        rewardUsd: Number(feesInUsd),
        virtualPool,
        farmRewardData,
        fusionState,
        fusion,
        poolAddress,
        tickSpacing,
      }
    })
  }, [
    _fusionStates,
    positions,
    farmRewardsList,
    fusionFarmings,
    farmAddresses,
    farmInfoList,
    annualPoolFeesPools,
    poolKeys,
    THE,
    WBNB,
    getAsset,
  ])

  return result
}
