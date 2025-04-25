import BigNumber from 'bignumber.js'
import { gql } from 'graphql-request'
import moment from 'moment'
import { useMemo, useRef } from 'react'
import useSWR from 'swr'
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
    console.log(error)
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

  const prevFarmAddressList = useRef([])
  const { data: farmAddressList, isLoading: isLoadingFarmAddress } = useSWR(
    farmPositions.length && account && chainId > 0 && ['get pool address list', chainId, account, farmPositions],
    () => getListComputePoolAddress(farmPositions, chainId, getAsset),
    {
      refreshInterval: 60000,
    },
  )

  const _farmAddressList = useMemo(() => {
    if (!farmAddressList || isLoadingFarmAddress) {
      return prevFarmAddressList.current
    }

    prevFarmAddressList.current = farmAddressList
    return farmAddressList
  }, [farmAddressList, isLoadingFarmAddress])

  const prevFarmingList = useRef([])
  const { data: farmingList, isLoading: isLoadingFarmingList } = useSWR(
    _farmAddressList.length > 0 &&
      account &&
      chainId && ['getFusionFarmingDataList', chainId, account, _farmAddressList],
    () =>
      getFusionFarmingListData({
        // call to subgraph
        poolIds: _farmAddressList,
        chainId,
      }),
    {
      refreshInterval: 60000,
    },
  )
  const _farmingList = useMemo(() => {
    if (!farmingList || isLoadingFarmingList) {
      return prevFarmingList.current
    }

    prevFarmingList.current = farmingList
    return farmingList
  }, [farmingList, isLoadingFarmingList])

  const prevAnnualPoolFeesPools = useRef([])
  const { data: annualPoolFeesPools, isLoading: isLoadingAnnualPool } = useSWR(
    _farmAddressList.length > 0 && account && chainId && ['get fusion fees pools', chainId, account, _farmAddressList],
    () => getFusionFeesData({ chainId, poolIds: _farmAddressList }),
    {
      refreshInterval: 60000,
    },
  )
  const _annualPoolFeesPools = useMemo(() => {
    if (!annualPoolFeesPools || isLoadingAnnualPool) {
      return prevAnnualPoolFeesPools.current
    }

    prevAnnualPoolFeesPools.current = annualPoolFeesPools
    return annualPoolFeesPools
  }, [annualPoolFeesPools, isLoadingAnnualPool])

  const fusionStates = useGetMultipleFusionState(farmPositions, _farmAddressList)

  const prevPoolKeys = useRef([])
  const { data: poolKeys = [], isLoading: isLoadingPoolKeys } = useSWR(
    _farmAddressList.length > 0 && chainId && account && ['getPoolToKey', chainId, account, _farmAddressList],
    () => getPoolKey(_farmAddressList, chainId),
    {
      refreshInterval: 60000,
    },
  )
  const _poolKeys = useMemo(() => {
    if (!poolKeys || isLoadingPoolKeys) {
      return prevPoolKeys.current
    }

    prevAnnualPoolFeesPools.current = poolKeys
    return poolKeys
  }, [isLoadingPoolKeys, poolKeys])

  const prevFarmRewardsList = useRef([])
  const { data: farmRewardsList = [], isLoading: isLoadingFarmRewards } = useSWR(
    poolKeys.length > 0 && account && ['getFarmRewardsList', poolKeys, chainId, account],
    () => getFarmRewardList(farmPositions, poolKeys, chainId, account),
    {
      refreshInterval: 60000,
    },
  )

  const _farmRewardsList = useMemo(() => {
    if (!farmRewardsList || isLoadingFarmRewards) {
      return prevFarmRewardsList.current
    }

    prevFarmRewardsList.current = farmRewardsList
    return farmRewardsList
  }, [isLoadingFarmRewards, farmRewardsList])

  const prevFarmInfoList = useRef([])
  const { data: farmInfoList = [], isLoadingFarmInfoList } = useSWR(
    _farmAddressList.length > 0 &&
      account &&
      _farmingList.length > 0 &&
      chainId && ['getFarmInfoList', account, _farmAddressList, _farmingList, chainId],
    () => getFarmInfoList(_farmAddressList, _farmingList),
    {
      refreshInterval: 60000,
    },
  )
  const _farmInfoList = useMemo(() => {
    if (!farmInfoList || isLoadingFarmInfoList) {
      return prevFarmInfoList.current
    }

    prevFarmInfoList.current = farmInfoList
    return farmInfoList
  }, [farmInfoList, isLoadingFarmInfoList])

  const prevFusionStates = usePrevious(fusionStates)

  const _fusionStates = useMemo(() => {
    if ((!fusionStates || fusionStates.length <= 0) && prevFusionStates) {
      return prevFusionStates || []
    }

    return fusionStates
  }, [fusionStates, prevFusionStates])

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
            const farmRewardData = _farmRewardsList[index]

            const farmingData = _farmingList.find(item => item.pool.toLowerCase() === _farmAddressList[index]) ?? {}
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
              const farmInfo = _farmInfoList[index]
              const { earnPercent = 0, totalLiquidityInFarm } = farmInfo || {}
              const tvl = amount0InUsd + amount1InUsd
              const totalLiquidity = fusion && fusion.liquidity ? fusion.liquidity : undefined
              const annualPoolFees = _annualPoolFeesPools?.[poolAddress.toLowerCase()]?.annualPoolFees || NaN

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
              key: _poolKeys[index],
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
      _annualPoolFeesPools,
      _farmAddressList,
      _farmInfoList,
      _farmRewardsList,
      _farmingList,
      _fusionStates,
      _poolKeys,
      chainId,
      farmPositions,
      getAsset,
    ],
  )

  return result
}
