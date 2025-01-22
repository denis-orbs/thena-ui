/* eslint-disable no-bitwise */
import { useQuery } from '@tanstack/react-query'
import BigNumber from 'bignumber.js'
import { gql } from 'graphql-request'
import { Position } from 'thena-fusion-sdk'
import { useReadContract } from 'wagmi'

import { MANUAL_TYPES } from '@/constant'
import { poolTestNetV2Abi } from '@/constant/v2-testnet-abi'
import { fusionClient, fusionFarmingClient } from '@/lib/graphql'
import { fromWei, toWei } from '@/lib/utils'
import { useV3MintState } from '@/state/fusion/hooks'
import { useChainSettings } from '@/state/settings/hooks'

import { useGetAsset } from './Tokens'

const getFusionFeesData = async ({ chainId, pool }) => {
  try {
    // get 1 year of pool fees data
    const { poolDayDatas = [] } = await fusionClient[3][chainId].request(
      gql`
        query pools($pool: String!, $date: Int!) {
          poolDayDatas(first: 1000, where: { pool: $pool, date_gt: $date }, orderBy: date) {
            feesUSD
          }
        }
      `,
      {
        pool,
        date: Math.floor(Date.now() / 1000) - 365 * 24 * 60 * 60, // current time in seconds - 365 days
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

    return eternalFarmings?.at(0)
  } catch (error) {
    console.error(`[${chainId}] fusion fees data fetch error: ${JSON.stringify(error)}`)
  }
}

export const useEstimateAPR = ({ pool, poolAddress, tickUpper, tickLower }) => {
  // console.log(poolAddress)
  const { networkId: chainId } = useChainSettings()
  const { strategy } = useV3MintState()
  const currencyA = useGetAsset(pool?.token0?.address)

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
    enabled: !!poolAddress && strategy?.title === MANUAL_TYPES[0],
    staleTime: Infinity,
  })
  const { rewardRate = '0', rewardToken, bonusRewardRate = '0', bonusRewardToken } = farmingData || {}
  const tokenReward = useGetAsset(rewardToken)
  const tokenBonus = useGetAsset(Number(bonusRewardRate) !== 0 ? bonusRewardToken : null)
  const rewardPerSecond = fromWei(rewardRate)
    .times(tokenReward?.price ?? 0)
    .plus(fromWei(bonusRewardRate).times(tokenBonus?.price ?? 0))

  const { data: globalState = {} } = useReadContract({
    functionName: 'globalState',
    address: poolAddress,
    abi: poolTestNetV2Abi,
    enabled: !!poolAddress,
  })
  const { communityFee = 0n } = globalState
  let earnPercent = communityFee / 1000n
  if (strategy?.title === MANUAL_TYPES[0]) earnPercent = 1000n - communityFee / 1000n

  if (!tickLower || !tickUpper || !pool || !strategy) return BigNumber(0)
  const position = Position.fromAmount0({
    pool,
    tickLower,
    tickUpper,
    amount0: toWei(500 / (currencyA?.price ?? 1)),
    useFullPrecision: true,
  })
  const liquidityRatio = BigNumber(position.liquidity).div(pool.liquidity)

  const { tvl } = strategy
  const farmApr = rewardPerSecond
    .times(liquidityRatio)
    .times(86400 * 365)
    .times(100)
    .div(tvl)

  const feeAPR = liquidityRatio.times(avgPoolFees).div(tvl).times(earnPercent)

  return farmApr.plus(feeAPR)
}
