/* eslint-disable no-bitwise */
import { useQuery } from '@tanstack/react-query'
import BigNumber from 'bignumber.js'
import { gql } from 'graphql-request'
import moment from 'moment'
import { nearestUsableTick, Position, TICK_SPACING, TickMath } from 'thenafi-fusion-sdk'
import { zeroAddress } from 'viem'
import { useReadContracts } from 'wagmi'

import { eternalVirtualPoolAbi, newPoolAbi } from '@/constant/abi/fusion'
import { batchCallMulti, callMulti } from '@/lib/contractActions'
import { fusionClient, fusionFarmingClient } from '@/lib/graphql'
import { fromWei, toWei } from '@/lib/utils'
import { Presets } from '@/state/fusion/reducer'
import { tryParseTick } from '@/state/fusion/utils'
import { useChainSettings } from '@/state/settings/hooks'

import { useGetAsset } from './Tokens'

const getFusionFeesData = async ({ chainId, pool }) => {
  try {
    // get 30 days pool fees data
    const { poolDayDatas = [] } = await fusionClient[3][chainId].request(
      gql`
        query pools($pool: String!, $date: Int!) {
          poolDayDatas(first: 1000, where: { pool: $pool, date_gt: $date }, orderBy: date) {
            feesUSD
          }
        }
      `,
      {
        pool: pool.toLowerCase(),
        date: moment().subtract(7, 'days').unix(), // last 7 day
      },
    )
    const avgPoolDayFees =
      poolDayDatas.length > 0 ? poolDayDatas.reduce((acc, v) => acc + Number(v.feesUSD), 0) / poolDayDatas.length : 0
    const annualPoolFees = avgPoolDayFees * 365
    return annualPoolFees
  } catch (error) {
    console.error(`[${chainId}] fusion fees data fetch error: ${JSON.stringify(error)}`)
    return 0
  }
}

const getFusionFarmingData = async ({ chainId, pool }) => {
  try {
    const { eternalFarmings = [] } = await fusionFarmingClient[chainId].request(
      gql`
        query ($pool: String!) {
          eternalFarmings(
            first: 1000
            where: { pool: $pool, isDeactivated: false }
            orderBy: nonce
            orderDirection: desc
          ) {
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
      { pool },
    )

    return eternalFarmings?.at(0) ?? {}
  } catch (error) {
    console.error(`[${chainId}] fusion fees data fetch error: ${JSON.stringify(error)}`)
  }
}

const calAPR = ({ positionLiquidity, poolLiquidity, reward, tvl, earnPercent, isFarming }) => {
  if (tvl.isZero()) return BigNumber(0)
  const ratio = BigNumber(positionLiquidity).div(BigNumber(poolLiquidity))

  if (isFarming) {
    return reward
      .times(ratio)
      .times(86400 * 365)
      .times(100)
      .div(tvl)
  }

  return reward
    .times(ratio)
    .times(earnPercent * 100)
    .div(tvl)
}

export const useEstimateAPR = ({
  pool,
  poolAddress,
  tickUpper,
  tickLower,
  token0,
  amount0 = 0,
  token1,
  amount1 = 0,
  isFarming = true,
  estimatedLiquidity = 0,
}) => {
  const { networkId: chainId } = useChainSettings()
  const currency0 = useGetAsset(token0?.address)
  const currency1 = useGetAsset(token1?.address)

  // pool fees in USD
  const { data: annualPoolFees = 0 } = useQuery({
    queryKey: ['fusionFeesData', poolAddress],
    queryFn: () => getFusionFeesData({ chainId, pool: poolAddress }),
    enabled: !!poolAddress,
    staleTime: Infinity,
  })

  const { data: farmingData = {} } = useQuery({
    queryKey: ['getFusionFarmingData', poolAddress],
    queryFn: () => getFusionFarmingData({ chainId, pool: poolAddress }),
    enabled: !!poolAddress && isFarming,
    staleTime: Infinity,
  })
  const { rewardRate = '0', rewardToken, bonusRewardRate = '0', bonusRewardToken, virtualPool } = farmingData

  const tokenReward = useGetAsset(rewardToken)
  const tokenBonus = useGetAsset(Number(bonusRewardRate) !== 0 ? bonusRewardToken : null)
  const rewardPerSecond = fromWei(rewardRate)
    .times(tokenReward?.price ?? 0)
    .plus(fromWei(bonusRewardRate).times(tokenBonus?.price ?? 0))

  const { data: farmInfo } = useReadContracts({
    contracts: [
      {
        functionName: 'globalState',
        address: poolAddress,
        abi: newPoolAbi,
      },
      {
        functionName: 'currentLiquidity',
        address: virtualPool ?? zeroAddress,
        abi: eternalVirtualPoolAbi,
      },
    ],
    query: {
      enabled: Boolean(poolAddress),
    },
  })
  const communityFee = BigNumber(farmInfo?.[0]?.result?.[4] || 0n)
  const farmLiquidity = BigNumber(farmInfo?.[1]?.result ?? 1n)
  const earnPercent = BigNumber(1).minus(communityFee.div(1000))

  if (!tickLower || !tickUpper || !pool) return {}
  if (tickUpper <= tickLower) return {}

  const _amount0 =
    typeof amount0 === 'object'
      ? BigNumber(amount0)
      : toWei(
          BigNumber(amount0)
            .decimalPlaces(currency0?.decimals ?? 18, BigNumber.ROUND_DOWN)
            .toString(),
          currency0?.decimals ?? 18,
        )
  const _amount1 =
    typeof amount1 === 'object'
      ? BigNumber(amount1)
      : toWei(
          BigNumber(amount1)
            .decimalPlaces(currency1?.decimals ?? 18, BigNumber.ROUND_DOWN)
            .toString(),
          currency1?.decimals ?? 18,
        )

  const poolPrice = pool?._token0Price.toSignificant(5)
  const _token0 = pool.token0
  const _token1 = pool.token1

  const presetPositions = [
    {
      min: 0,
      max: Infinity,
      title: Presets.FULL,
    },
    {
      min: 0.8,
      max: 1.2,
      title: Presets.SAFE,
    },
    {
      min: 0.9,
      max: 1.1,
      title: Presets.NORMAL,
    },
    {
      min: 0.95,
      max: 1.05,
      title: Presets.RISK,
    },
    {
      min: 0.984,
      max: 1.016,
      title: Presets.STABLE,
    },
    {
      title: 'current',
    },
  ].map(({ min, max, title }) => {
    const _tickLower =
      title === 'current'
        ? tickLower
        : title === Presets.FULL
          ? nearestUsableTick(TickMath.MIN_TICK, TICK_SPACING)
          : tryParseTick(_token0, _token1, 3000, (Number(poolPrice) * min).toString())

    const _tickUpper =
      title === 'current'
        ? tickUpper
        : title === Presets.FULL
          ? nearestUsableTick(TickMath.MAX_TICK, TICK_SPACING)
          : tryParseTick(_token0, _token1, 3000, (Number(poolPrice) * max).toString())

    let _position = null
    if (token0 && token1) {
      _position = Position.fromAmounts({
        pool,
        tickLower: _tickLower,
        tickUpper: _tickUpper,
        amount0: _token0 === currency0.address ? Math.round(_amount0.toNumber()) : Math.round(_amount1.toNumber()),
        amount1: _token1 === currency1.address ? Math.round(_amount1.toNumber()) : Math.round(_amount0.toNumber()),
        useFullPrecision: true,
      })
    } else {
      _position = { liquidity: estimatedLiquidity }
    }
    return {
      title,
      position: _position,
    }
  })

  const reward = isFarming ? rewardPerSecond : BigNumber(annualPoolFees)
  const poolLiquidity = isFarming ? BigNumber(farmLiquidity) : BigNumber(pool.liquidity)
  const tvl = fromWei(_amount0, currency0?.decimals ?? 18)
    .times(currency0?.price ?? 0)
    .plus(fromWei(_amount1, currency1?.decimals ?? 18).times(currency1?.price ?? 0))

  return presetPositions.reduce((acc, { title, position: p }) => {
    if (!p) {
      acc[title] = BigNumber(0)
    } else {
      acc[title] = calAPR({
        reward,
        tvl,
        poolLiquidity: BigNumber(poolLiquidity).plus(p.liquidity),
        positionLiquidity: p.liquidity,
        isFarming,
        earnPercent,
      })
    }
    return acc
  }, {})
}

export const useCalculateAPR = ({ position, poolAddress, totalLiquidity, tvl }) => {
  const { liquidity, tickLower, tickUpper } = position || {}
  const { networkId: chainId } = useChainSettings()

  // pool fees in USD
  const { data: annualPoolFees = 0 } = useQuery({
    queryKey: ['fusionFeesData', poolAddress],
    queryFn: () => getFusionFeesData({ chainId, pool: poolAddress }),
    enabled: !!poolAddress,
    staleTime: Infinity,
  })

  const { data: farmingData = {} } = useQuery({
    queryKey: ['getFusionFarmingData', poolAddress],
    queryFn: () => getFusionFarmingData({ chainId, pool: poolAddress }),
    enabled: !!poolAddress && position?.isFarming,
    staleTime: Infinity,
  })
  const { rewardRate = '0', rewardToken, bonusRewardRate = '0', bonusRewardToken, virtualPool } = farmingData || {}
  const tokenReward = useGetAsset(rewardToken)
  const tokenBonus = useGetAsset(Number(bonusRewardRate) !== 0 ? bonusRewardToken : null)
  const rewardPerSecond = fromWei(rewardRate)
    .times(tokenReward?.price ?? 0)
    .plus(fromWei(bonusRewardRate).times(tokenBonus?.price ?? 0))
  const { data: farmInfo } = useReadContracts({
    contracts: [
      {
        functionName: 'globalState',
        address: poolAddress,
        abi: newPoolAbi,
      },
      {
        functionName: 'currentLiquidity',
        address: virtualPool ?? zeroAddress,
        abi: eternalVirtualPoolAbi,
      },
    ],
    query: {
      enabled: Boolean(poolAddress),
    },
  })
  const communityFee = BigNumber(farmInfo?.[0]?.result?.[4] || 200n)
  const totalLiquidityInFarm = BigNumber(farmInfo?.[1]?.result ?? 1n)

  const earnPercent = BigNumber(1).minus(communityFee.div(1000)).times(100)
  if (!tickLower || !tickUpper || !position) return BigNumber(0)

  const farmRatio = BigNumber(position?.liquidity ?? 0).div(totalLiquidityInFarm)
  const farmApr =
    Number(tvl) > 0
      ? rewardPerSecond
          .times(farmRatio)
          .times(86400 * 365)
          .div(tvl)
          .times(100)
      : BigNumber(0)

  const feeRatio = Number(totalLiquidity) > 0 ? BigNumber(liquidity).div(totalLiquidity) : BigNumber(0)
  const feeAPR = Number(tvl) > 0 ? feeRatio.times(annualPoolFees).div(tvl).times(earnPercent) : BigNumber(0)
  return farmApr.plus(feeAPR)
}

export const calculateAPR = async ({ position, poolAddress, totalLiquidity, tvl, chainId, getAsset = () => {} }) => {
  const { liquidity, tickLower, tickUpper } = position || {}

  if (!tickLower || !tickUpper || !position) return BigNumber(0)

  let annualPoolFees
  if (poolAddress) {
    annualPoolFees = await getFusionFeesData({ chainId, pool: poolAddress })
  }

  let farmingData
  if (!!poolAddress && position?.isFarming) {
    farmingData = await getFusionFarmingData({ chainId, pool: poolAddress })
  }

  const { rewardRate = '0', rewardToken, bonusRewardRate = '0', bonusRewardToken, virtualPool } = farmingData || {}

  let farmInfo
  if (poolAddress) {
    farmInfo = await callMulti([
      {
        functionName: 'globalState',
        address: poolAddress,
        abi: newPoolAbi,
      },
      {
        functionName: 'currentLiquidity',
        address: virtualPool ?? zeroAddress,
        abi: eternalVirtualPoolAbi,
      },
    ])
  }
  const tokenReward = getAsset(rewardToken)
  const tokenBonus = getAsset(Number(bonusRewardRate) !== 0 ? bonusRewardToken : null, chainId)

  const rewardPerSecond = fromWei(rewardRate)
    .times(tokenReward?.price ?? 0)
    .plus(fromWei(bonusRewardRate).times(tokenBonus?.price ?? 0))

  const communityFee = BigNumber(farmInfo?.[0]?.[4] || 200n)
  const totalLiquidityInFarm = BigNumber(farmInfo?.[1] ?? 1n)

  const earnPercent = BigNumber(1).minus(communityFee.div(1000)).times(100)

  const farmRatio = BigNumber(position?.liquidity ?? 0).div(totalLiquidityInFarm)
  const farmApr =
    Number(tvl) > 0
      ? rewardPerSecond
          .times(farmRatio)
          .times(86400 * 365)
          .div(tvl)
          .times(100)
      : BigNumber(0)

  const feeRatio = Number(totalLiquidity) > 0 ? BigNumber(liquidity).div(totalLiquidity) : BigNumber(0)
  const feeAPR = Number(tvl) > 0 ? feeRatio.times(annualPoolFees).div(tvl).times(earnPercent) : BigNumber(0)
  return farmApr.plus(feeAPR)
}

const getAddress = (farmDatas, address) => {
  const found = (farmDatas || []).find(farm => farm.pool.toLowerCase() === address)
  if (!found) return zeroAddress
  return found.virtualPool ?? zeroAddress
}

export const getFarmInfoList = async (poolAddressList, farmDatas) => {
  const globalStates = await batchCallMulti(
    poolAddressList.map(address => ({
      functionName: 'globalState',
      address,
      abi: newPoolAbi,
    })),
  )

  const currentLiquidities = await batchCallMulti(
    poolAddressList.map(address => ({
      functionName: 'currentLiquidity',
      address: getAddress(farmDatas, address),
      abi: eternalVirtualPoolAbi,
    })),
  )

  const result = (globalStates || []).map((states, index) => {
    const communityFee = BigNumber(states?.[4] || 200n)
    const totalLiquidityInFarm = BigNumber(currentLiquidities?.[index] ?? 1n)
    const earnPercent = BigNumber(1).minus(communityFee.div(1000)).times(100)
    return { totalLiquidityInFarm, earnPercent }
  })

  return result
}
