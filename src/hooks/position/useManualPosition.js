import BigNumber from 'bignumber.js'
import { gql } from 'graphql-request'
import moment from 'moment'
import { useMemo, useRef } from 'react'
import useSWR from 'swr'
import { Position } from 'thena-fusion-sdk'
import { CurrencyAmount } from 'thena-sdk-core'
import { maxUint128, zeroAddress } from 'viem'

import { simulateCall } from '@/lib/contractActions'
import { getPositionManagerContract } from '@/lib/contracts'
import { fusionClient, fusionFarmingClient } from '@/lib/graphql'
import { fromWei } from '@/lib/utils'

import { getToken, useGetAssetFn } from '../fusion/Tokens'
import { getFarmInfoList } from '../fusion/useEstimateAPR'
import { getListComputePoolAddress, PoolState, useGetMultipleFusionState } from '../fusion/useFusions'
import usePrevious from '../usePrevious'
import useWallet from '../useWallet'

const fetchManualInfo = async (positions, account, chainId) => {
  const manualBalances = []
  for (let i = 0; i < positions.length; i++) {
    const pos = positions[i]
    const algebraContract = getPositionManagerContract(chainId, pos.version ?? 3)
    try {
      const balance = await simulateCall(
        algebraContract,
        'collect',
        [
          [
            pos.tokenId,
            account, // some tokens might fail if transferred to address(0)
            maxUint128,
            maxUint128,
          ],
        ],
        chainId,
      )
      manualBalances.push(balance)
    } catch (error) {
      console.error(`Simulate failed for position ${pos?.tokenId}:`, error)
      manualBalances.push(null)
    }
  }
  return manualBalances
}

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

export const useManualPositions = manualPositions => {
  const { chainId, account } = useWallet()
  // const pools = usePools()
  const { getAsset } = useGetAssetFn()

  const prevFeesList = useRef([])
  const { data: feesList, isLoading: isLoadingFeesList } = useSWR(
    account && manualPositions.length > 0 ? ['manuals/fee', manualPositions, account, chainId] : null,
    () => fetchManualInfo(manualPositions, account, chainId),
    {
      refreshInterval: 60000,
    },
  )

  const _feesList = useMemo(() => {
    if (!feesList || isLoadingFeesList) {
      return prevFeesList.current
    }
    prevFeesList.current = feesList
    return feesList
  }, [feesList, isLoadingFeesList])

  const prevAddressList = useRef([])
  const { data: addressList, isLoading: isLoadingAddress } = useSWR(
    manualPositions.length && chainId > 0 && ['get pool address list manual', chainId, account, manualPositions],
    () => getListComputePoolAddress(manualPositions, chainId, getAsset),
    {
      refreshInterval: 0,
    },
  )

  const _addressList = useMemo(() => {
    if (!addressList || isLoadingAddress) {
      return prevAddressList.current
    }

    prevAddressList.current = addressList
    return addressList
  }, [addressList, isLoadingAddress])

  const fusionStates = useGetMultipleFusionState(manualPositions, _addressList)

  const prevFusionStates = usePrevious(fusionStates)

  const _fusionStates = useMemo(() => {
    if ((!fusionStates || fusionStates.length <= 0) && prevFusionStates) {
      return prevFusionStates || []
    }

    return fusionStates
  }, [fusionStates, prevFusionStates])

  const prevFarmingList = useRef([])
  const { data: farmingList, isLoading: isLoadingFarmingList } = useSWR(
    _addressList.length > 0 && chainId && ['getFusionFarmingDataList manual', chainId, account, _addressList],
    () =>
      getFusionFarmingListData({
        // call to subgraph
        poolIds: _addressList,
        chainId,
      }),
    {
      refreshInterval: 0,
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
    _addressList.length > 0 && chainId && ['get fusion fees pools', chainId, account, _addressList],
    () => getFusionFeesData({ chainId, poolIds: _addressList }),
    {
      refreshInterval: 0,
    },
  )

  const _annualPoolFeesPools = useMemo(() => {
    if (!annualPoolFeesPools || isLoadingAnnualPool) {
      return prevAnnualPoolFeesPools.current
    }

    prevAnnualPoolFeesPools.current = annualPoolFeesPools
    return annualPoolFeesPools
  }, [annualPoolFeesPools, isLoadingAnnualPool])

  const prevFarmInfoList = useRef([])
  const { data: farmInfoList = [], isLoadingFarmInfoList } = useSWR(
    _addressList.length > 0 && ['getFarmInfoList manual'],
    () => getFarmInfoList(_addressList, _farmingList),
    {
      refreshInterval: 0,
    },
  )
  const _farmInfoList = useMemo(() => {
    if (!farmInfoList || isLoadingFarmInfoList) {
      return prevFarmInfoList.current
    }

    prevFarmInfoList.current = farmInfoList
    return farmInfoList
  }, [farmInfoList, isLoadingFarmInfoList])

  if (!_fusionStates || _fusionStates.length <= 0) return []
  const result = manualPositions.map((farmPos, index) => {
    const { asset0, asset1, liquidity, tickLower, tickUpper } = farmPos
    const [fusionState, fusion, poolAddress = zeroAddress] = _fusionStates?.[index] || [PoolState.NOT_EXISTS, null]
    const fees = _feesList[index]
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
    const token0 = getToken(asset0.address, getAsset)
    const token1 = getToken(asset1.address, getAsset)
    const apr = (() => {
      if (!tickLower || !tickUpper || !position) return BigNumber(0)
      const farmInfo = _farmInfoList[index]
      const { earnPercent = 0 } = farmInfo || {}
      const tvl = amount0InUsd + amount1InUsd

      const totalLiquidity = fusion && fusion.liquidity ? fusion.liquidity : undefined
      const annualPoolFees = _annualPoolFeesPools?.[poolAddress.toLowerCase()]?.annualPoolFees || NaN
      const feeRatio = totalLiquidity ? BigNumber(liquidity).div(totalLiquidity) : BigNumber(0)
      const feeAPR = tvl ? feeRatio.times(annualPoolFees).div(tvl).times(earnPercent) : BigNumber(0)
      return feeAPR
    })()

    const { reward0, reward1 } = {
      reward0: {
        token: token0,
        amount: CurrencyAmount.fromRawAmount(token0, BigNumber(fees?.[0] ?? 0n)),
      },
      reward1: {
        token: token1,
        amount: CurrencyAmount.fromRawAmount(token1, BigNumber(fees?.[1] ?? 0n)),
      },
    }

    const feesInUsd = (() => {
      let usdFee = new BigNumber(0)
      if (fees) {
        usdFee = fromWei(fees ? fees[0] : 0, asset0.decimals)
          .times(asset0?.price ?? 0)
          .plus(fromWei(fees ? fees[1] : 0, asset1.decimals).times(asset1?.price ?? 0))
      }
      return usdFee
    })()
    const fiatValueOfLiquidity = amount0InUsd + amount1InUsd

    const firstPercent = ((amount0InUsd / (amount0InUsd + amount1InUsd)) * 100).toFixed(2)
    return {
      ...farmPos,
      apr: apr.toNumber(),
      fees,
      feesInUsd,
      fiatValueOfLiquidity,
      firstPercent,
      rewards: [reward0, reward1],
      rewardUsd: Number(feesInUsd),
      virtualPool: null,
      fusionState,
      fusion,
      poolAddress,
    }
  })

  return result
}
