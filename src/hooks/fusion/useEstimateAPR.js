/* eslint-disable no-bitwise */
import { useQuery } from '@tanstack/react-query'
import BigNumber from 'bignumber.js'
import { gql } from 'graphql-request'
import { Position } from 'thena-fusion-sdk'
import { zeroAddress } from 'viem'
import { useReadContracts } from 'wagmi'

import { eternalVirtualPoolAbi, newPoolAbi } from '@/constant/abi/fusion'
import { fusionClient, fusionFarmingClient } from '@/lib/graphql'
import { fromWei, toWei } from '@/lib/utils'
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
        date: Math.floor(Date.now() / 1000) - 24 * 60 * 60 * 7, // current time in seconds - 7 day
      },
    )

    const avgPoolDayFees =
      poolDayDatas.length > 0 ? poolDayDatas.reduce((acc, v) => acc + Number(v.feesUSD), 0) / poolDayDatas.length : 0
    const avgPoolFees = avgPoolDayFees * 365

    return avgPoolFees
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
          eternalFarmings(where: { pool: $pool }) {
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
        pool,
      },
    )

    return eternalFarmings?.at(0) ?? {}
  } catch (error) {
    console.error(`[${chainId}] fusion fees data fetch error: ${JSON.stringify(error)}`)
  }
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
  tvl = 1,
}) => {
  const { networkId: chainId } = useChainSettings()
  const currency0 = useGetAsset(pool?.token0?.address)
  const currency1 = useGetAsset(pool?.token1?.address)

  // pool fees in USD
  const { data: avgPoolFees = 0 } = useQuery({
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
    enabled: !!poolAddress,
  })
  const communityFee = BigNumber(farmInfo?.[0]?.result?.[4] || 0n)
  const farmLiquidity = BigNumber(farmInfo?.[1]?.result ?? 1n)

  let earnPercent = communityFee.div(1000)
  if (isFarming) earnPercent = BigNumber(1).minus(communityFee.div(1000))

  if (!tickLower || !tickUpper || !pool) return BigNumber(0)

  let position = null
  const amountToken0 =
    typeof amount0 === 'object'
      ? amount0
      : toWei(
          new BigNumber(amount0).decimalPlaces(currency0?.decimals ?? 18, BigNumber.ROUND_DOWN).toString(),
          currency0?.decimals ?? 18,
        )
  const amountToken1 =
    typeof amount1 === 'object'
      ? amount1
      : toWei(
          new BigNumber(amount1).decimalPlaces(currency0?.decimals ?? 18, BigNumber.ROUND_DOWN).toString(),
          currency1?.decimals ?? 18,
        )

  if (token0 && token1) {
    position = Position.fromAmounts({
      pool,
      tickLower,
      tickUpper,
      amount0: amountToken0,
      amount1: amountToken1,
      useFullPrecision: true,
    })
  } else if (token0 && !token1) {
    position = Position.fromAmount0({
      pool,
      tickLower,
      tickUpper,
      amount0: amountToken0,
      useFullPrecision: true,
    })
  } else if (!token0 && token1) {
    position = Position.fromAmount1({
      pool,
      tickLower,
      tickUpper,
      amount1: amountToken1,
      useFullPrecision: true,
    })
  } else {
    position = Position.fromAmounts({
      pool,
      tickLower,
      tickUpper,
      amount0: toWei(500 / (currency0?.price ?? 1)),
      amount1: toWei(500 / (currency1?.price ?? 1)),
      useFullPrecision: true,
    })
  }

  const farmRatio = BigNumber(position.liquidity).div(farmLiquidity)
  const farmApr = rewardPerSecond
    .times(farmRatio.gt(1) ? 1 : farmRatio)
    .times(86400 * 365)
    .div(tvl)

  const feeRatio = BigNumber(position.liquidity).div(pool.liquidity)
  const feeAPR = BigNumber(feeRatio.gt(1) ? 1 : feeRatio)
    .times(avgPoolFees)
    .div(tvl)
    .times(earnPercent)

  return farmApr.plus(feeAPR)
}

export const useCalculateAPR = ({ position, poolAddress, totalLiquidity, tvl = 1 }) => {
  const { liquidity, tickLower, tickUpper } = position || {}
  const { networkId: chainId } = useChainSettings()

  // pool fees in USD
  const { data: avgPoolFees = 0 } = useQuery({
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
        address: virtualPool,
        abi: eternalVirtualPoolAbi,
      },
    ],
    enabled: !!poolAddress,
  })
  const communityFee = BigNumber(farmInfo?.[0]?.result?.[4] || 0n)
  const farmLiquidity = BigNumber(farmInfo?.[1]?.result ?? 1n)

  let earnPercent = communityFee.div(1000)
  if (position.isFarming) earnPercent = BigNumber(1).minus(communityFee.div(1000))

  if (!tickLower || !tickUpper || !position) return BigNumber(0)

  const farmRatio = BigNumber(position.liquidity).div(farmLiquidity)
  const farmApr = rewardPerSecond
    .times(farmRatio.gt(1) ? 1 : farmRatio)
    .times(86400 * 365)
    .div(tvl)

  const feeRatio = BigNumber(liquidity).div(totalLiquidity)
  const feeAPR = BigNumber(feeRatio.gt(1) ? 1 : feeRatio)
    .times(avgPoolFees)
    .div(tvl)
    .times(earnPercent)

  return farmApr.plus(feeAPR)
}
