import BigNumber from 'bignumber.js'
import { gql } from 'graphql-request'
import moment from 'moment'
import { useMemo } from 'react'
import { Position } from 'thena-fusion-sdk'
import { CurrencyAmount } from 'thena-sdk-core'
import { zeroAddress } from 'viem'

import Contracts from '@/constant/contracts'
import { batchCallMulti, simulateCall } from '@/lib/contractActions'
import { getFarmingCenterContract, getIncentiveContract } from '@/lib/contracts'
import { fusionClient, fusionFarmingClient } from '@/lib/graphql'
import { fromWei } from '@/lib/utils'

import { useGetAssetFn } from '../fusion/Tokens'
import { getFarmInfoList } from '../fusion/useEstimateAPR'
import { getListComputePoolAddress, PoolState, useGetMultipleFusionState } from '../fusion/useFusions'
import { useCachedSWR } from '../useCachedSWR'
import usePrevious from '../usePrevious'
import useWallet from '../useWallet'

const getFusionFarmingListData = async ({ chainId, poolIds }) => {
  try {
    const { eternalFarmings = [] } = await fusionFarmingClient[chainId].request(
      gql`
        query ($poolIds: [String!]) {
          eternalFarmings(where: { pool_in: $poolIds }) {
            id
            virtualPool
            pool
            rewardToken
            bonusRewardToken
            rewardRate
            bonusRewardRate
          }
        }
      `,
      {
        poolIds,
      },
    )
    const uniquePools = []
    const seen = new Set()

    for (const item of eternalFarmings) {
      if (!seen.has(item.pool)) {
        uniquePools.push(item)
        seen.add(item.pool)
      }
    }
    return uniquePools
  } catch (error) {
    console.log(error)
  }
}

function groupAndAverageByPool(poolDayDatas) {
  const result = poolDayDatas.reduce((acc, item) => {
    const poolId = item.pool.id
    const feesUSD = parseFloat(item.feesUSD)

    if (acc[poolId]) {
      acc[poolId].sumDayFees += feesUSD
      acc[poolId].length += 1
    } else {
      acc[poolId] = {
        sumDayFees: feesUSD,
        length: 1,
      }
    }

    return acc
  }, {})

  // Calculate the average for each pool
  for (const poolId in result) {
    if (Object.prototype.hasOwnProperty.call(result, poolId)) {
      const avgPoolDayFees = result[poolId].sumDayFees / result[poolId].length
      result[poolId].avgPoolDayFees = avgPoolDayFees
      result[poolId].annualPoolFees = avgPoolDayFees * 365
    }
  }
  return result
}

const getFusionFeesData = async ({ chainId, poolIds }) => {
  try {
    // get 30 days pool fees data
    const { poolDayDatas = [] } = await fusionClient[3][chainId].request(
      gql`
        query pools($poolIds: [String!], $date: Int!) {
          poolDayDatas(first: 1000, where: { pool_in: $poolIds, date_gt: $date }, orderBy: date) {
            feesUSD
            pool {
              id
            }
          }
        }
      `,
      {
        poolIds,
        date: moment().subtract(7, 'days').unix(), // last 7 day
      },
    )

    const result = groupAndAverageByPool(poolDayDatas)
    return result
  } catch (error) {
    console.error(`[${chainId}] fusion fees data fetch error: ${JSON.stringify(error)}`)
    return 0
  }
}

const getPoolKey = async (farmAddress, chainId) => {
  const incentiveMaker = getIncentiveContract(chainId)
  const poolKeys = batchCallMulti(
    farmAddress.map(address => ({
      ...incentiveMaker,
      functionName: 'poolToKey',
      args: [address],
    })),
  )
  return poolKeys
}

const getFarmRewardList = async (positions, poolKeys, chainId) => {
  const farmingCenter = getFarmingCenterContract(chainId)
  const farmRewardsList = []

  for (let i = 0; i < positions.length; i++) {
    const pos = positions[i]
    const poolKey = poolKeys[i]

    try {
      const result = await simulateCall(farmingCenter, 'collectRewards', [poolKey, pos?.tokenId], chainId)
      farmRewardsList.push(result)
    } catch (error) {
      console.error(`Simulate failed for position ${pos?.tokenId}:`, error)
      farmRewardsList.push([0n, 0n])
    }
  }
  return farmRewardsList
}

export const useFarmPositions = farmPositions => {
  const { chainId, account } = useWallet()
  const { getAsset } = useGetAssetFn()

  // Generate SWR keys
  const farmAddressListKey = useMemo(
    () =>
      farmPositions.length && account && chainId > 0
        ? ['get pool address list', chainId, account, farmPositions]
        : null,
    [farmPositions, account, chainId],
  )

  // Farm address list
  const { data: farmAddressList } = useCachedSWR(
    farmAddressListKey,
    () => getListComputePoolAddress(farmPositions, chainId, getAsset),
    { refreshInterval: 60000 },
  )

  // Farming list
  const farmingListKey = useMemo(
    () =>
      farmAddressList?.length > 0 && account && chainId
        ? ['getFusionFarmingDataList', chainId, account, farmAddressList]
        : null,
    [farmAddressList, account, chainId],
  )

  const { data: farmingList } = useCachedSWR(
    farmingListKey,
    () => getFusionFarmingListData({ poolIds: farmAddressList, chainId }),
    { refreshInterval: 60000 },
  )

  // Annual pool fees
  const annualPoolKey = useMemo(
    () =>
      farmAddressList?.length > 0 && account && chainId
        ? ['get fusion fees pools', chainId, account, farmAddressList]
        : null,
    [farmAddressList, account, chainId],
  )

  const { data: annualPoolFeesPools } = useCachedSWR(
    annualPoolKey,
    () => getFusionFeesData({ chainId, poolIds: farmAddressList }),
    { refreshInterval: 60000 },
  )

  // Fusion states
  const fusionStates = useGetMultipleFusionState(farmPositions, farmAddressList)
  const prevFusionStates = usePrevious(fusionStates)

  const _fusionStates = useMemo(() => {
    if ((!fusionStates || fusionStates.length <= 0) && prevFusionStates) {
      return prevFusionStates || []
    }
    return fusionStates
  }, [fusionStates, prevFusionStates])

  // Pool keys
  const poolKeysKey = useMemo(
    () =>
      farmAddressList?.length > 0 && chainId && account ? ['getPoolToKey', chainId, account, farmAddressList] : null,
    [farmAddressList, chainId, account],
  )

  const { data: poolKeys = [] } = useCachedSWR(poolKeysKey, () => getPoolKey(farmAddressList, chainId), {
    refreshInterval: 60000,
  })

  // Farm rewards
  const farmRewardsKey = useMemo(
    () => (poolKeys?.length > 0 && account ? ['getFarmRewardsList', poolKeys, chainId, account] : null),
    [poolKeys, account, chainId],
  )

  const { data: farmRewardsList = [] } = useCachedSWR(
    farmRewardsKey,
    () => getFarmRewardList(farmPositions, poolKeys, chainId, account),
    { refreshInterval: 60000 },
  )

  // Farm info list
  const farmInfoKey = useMemo(
    () =>
      farmAddressList?.length > 0 && account && farmingList?.length > 0 && chainId
        ? ['getFarmInfoList', account, farmAddressList, farmingList, chainId]
        : null,
    [farmAddressList, account, farmingList, chainId],
  )

  const { data: farmInfoList = [] } = useCachedSWR(farmInfoKey, () => getFarmInfoList(farmAddressList, farmingList), {
    refreshInterval: 60000,
  })

  const result = useMemo(
    () =>
      !_fusionStates || _fusionStates.length <= 0
        ? []
        : farmPositions.map((farmPos, index) => {
            const { asset0, asset1, liquidity, tickLower, tickUpper } = farmPos
            const [fusionState, fusion, poolAddress = zeroAddress] = _fusionStates?.[index] || [
              PoolState.NOT_EXISTS,
              null,
            ]
            const farmRewardData = farmRewardsList[index]

            const farmingData = farmingList.find(item => item.pool.toLowerCase() === farmAddressList[index]) ?? {}
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
            const amount0InUsd = BigNumber(amount0) * asset0.price
            const amount1InUsd = BigNumber(amount1) * asset1.price

            const {
              rewardRate = '0',
              rewardToken,
              bonusRewardRate = '0',
              bonusRewardToken,
              virtualPool,
            } = farmingData || {}
            const tokenReward = getAsset(rewardToken)
            const tokenBonus = getAsset(Number(bonusRewardRate) !== 0 ? bonusRewardToken : null)
            const rewardPerSecond = fromWei(rewardRate)
              .times(tokenReward?.price ?? 0)
              .plus(fromWei(bonusRewardRate).times(tokenBonus?.price ?? 0))
            // -----------------ok--------
            const apr = (() => {
              if (!tickLower || !tickUpper || !position) return BigNumber(0)
              const farmInfo = farmInfoList[index]
              const { earnPercent = 0, totalLiquidityInFarm } = farmInfo || {}
              const tvl = amount0InUsd + amount1InUsd
              const totalLiquidity = fusion && fusion.liquidity ? fusion.liquidity : undefined
              const annualPoolFees = annualPoolFeesPools?.[poolAddress.toLowerCase()]?.annualPoolFees || NaN

              const farmRatio = BigNumber(position?.liquidity ?? 0).div(totalLiquidityInFarm)
              const farmApr = tvl
                ? rewardPerSecond
                    .times(farmRatio)
                    .times(86400 * 365)
                    .div(tvl)
                    .times(100)
                : BigNumber(0)

              const feeRatio = totalLiquidity ? BigNumber(liquidity).div(totalLiquidity) : BigNumber(0)
              const feeAPR = tvl ? feeRatio.times(annualPoolFees).div(tvl).times(earnPercent) : BigNumber(0)
              return farmApr.plus(feeAPR)
            })()

            const THE = getAsset(Contracts.THE[chainId])
            const WBNB = getAsset(Contracts.WBNB[chainId])

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
              let usdFee = new BigNumber(0)
              if (farmRewardData) {
                usdFee = usdFee
                  .plus(fromWei(farmRewardData[0]).times(THE.price))
                  .plus(fromWei(farmRewardData[1]).times(WBNB.price))
              }
              return usdFee
            })()
            const fiatValueOfLiquidity = amount0InUsd + amount1InUsd

            const firstPercent = ((amount0InUsd / (amount0InUsd + amount1InUsd)) * 100).toFixed(2)
            return {
              ...farmPos,
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
            }
          }),
    [
      annualPoolFeesPools,
      farmAddressList,
      farmInfoList,
      farmRewardsList,
      farmingList,
      _fusionStates,
      poolKeys,
      chainId,
      farmPositions,
      getAsset,
    ],
  )

  return result
}
