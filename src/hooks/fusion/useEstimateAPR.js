/* eslint-disable no-bitwise */
import { useQuery } from '@tanstack/react-query'
import BigNumber from 'bignumber.js'
import { gql } from 'graphql-request'
import moment from 'moment'
import { useMemo } from 'react'
import { nearestUsableTick, Position, TICK_SPACING, TickMath } from 'thenafi-fusion-sdk'
import { zeroAddress } from 'viem'
import { useReadContracts } from 'wagmi'

import { eternalVirtualPoolAbi, newPoolAbi } from '@/constant/abi/fusion'
import { batchCallMulti, callMulti } from '@/lib/contractActions'
import { fusionClient, fusionFarmingClient } from '@/lib/graphql'
import { fromWei, toWei, ZERO_VALUE } from '@/lib/utils'
import { Field } from '@/state/fusion/actions'
import { useActivePreset, useV3MintState } from '@/state/fusion/hooks'
import { Presets } from '@/state/fusion/reducer'
import { tryParseTick } from '@/state/fusion/utils'
import { useChainSettings } from '@/state/settings/hooks'

import { useGetAsset } from './Tokens'
import { useGetZapInRoutePerRange } from '../zapper/useZapper'

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
  if (tvl.isZero()) return ZERO_VALUE
  const ratio = Number(poolLiquidity) > 0 ? BigNumber(positionLiquidity).div(BigNumber(poolLiquidity)) : ZERO_VALUE

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

/**
 * @param {import('thenafi-fusion-sdk').Pool} pool
 * @param {string} poolAddress
 * @param {number} tickUpper
 * @param {number} tickLower
 * @param {import('thena-sdk-core').Token} token0
 * @param {number} amount0
 * @param {import('thena-sdk-core').Token} token1
 * @param {number} amount1
 * @param {boolean} isFarming
 * @param {number} estimatedLiquidity
 * @param {number} tickSpacing
 */
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
  tickSpacing = TICK_SPACING,
  poolId,
  slippage,
  isStablecoinPair = false,
  currentPrice,
  invertPrice,
  isZapper = false,
}) => {
  const { networkId: chainId } = useChainSettings()
  const activePreset = useActivePreset()
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

  const { independentField, typedValue } = useV3MintState()

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
      {
        functionName: 'rewardReserves',
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
  const rewardReserve = farmInfo?.[2]?.result ?? [0n, 0n]
  const earnPercent = BigNumber(1).minus(communityFee.div(1000))

  const poolPrice = currentPrice ?? pool?._token0Price?.toSignificant(5)
  const _token0 = pool?.token0
  const _token1 = pool?.token1
  const _tickSpacing = tickSpacing ?? TICK_SPACING

  const presetRanges = useMemo(() => {
    if (isStablecoinPair) {
      return [
        {
          min: 0.9995,
          max: 1.0005,
          title: Presets.STABLE,
        },
      ]
    }

    return [
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
    ]
  }, [isStablecoinPair])

  const { data: zapAprInRanges } = useGetZapInRoutePerRange({
    pool,
    poolId,
    tickSpacing: _tickSpacing,
    tokenIn: token0 ?? token1,
    amountIn: amount0,
    slippage,
    presetRanges,
  })

  if (!pool) return {}

  let _amount0 =
    typeof amount0 === 'object'
      ? BigNumber(amount0)
      : toWei(
          BigNumber(amount0)
            .decimalPlaces(currency0?.decimals ?? 18, BigNumber.ROUND_DOWN)
            .toString(),
          currency0?.decimals ?? 18,
        )
  let _amount1 =
    typeof amount1 === 'object'
      ? BigNumber(amount1)
      : toWei(
          BigNumber(amount1)
            .decimalPlaces(currency1?.decimals ?? 18, BigNumber.ROUND_DOWN)
            .toString(),
          currency1?.decimals ?? 18,
        )

  // In case, user do not enters amount0 and amount1
  if (_amount0?.isZero() && _amount1?.isZero() && token0 && token1) {
    _amount0 = currency0?.price ? toWei(50 / currency0.price, currency0.decimals) : BigNumber(0)
    _amount1 = currency1?.price ? toWei(50 / currency1.price, currency1.decimals) : BigNumber(0)
  }

  const isRevert = _token0?.address?.toLowerCase() === currency0?.address?.toLowerCase()
  const presetPositions = [...presetRanges, { title: 'current' }].map(({ min, max, title }) => {
    const _tickLower =
      title === Presets.FULL
        ? nearestUsableTick(TickMath.MIN_TICK, _tickSpacing)
        : title === 'current' || title === activePreset
          ? tickLower
          : !currentPrice || !invertPrice
            ? tryParseTick(_token0, _token1, 3000, (Number(poolPrice) * min).toString(), _tickSpacing)
            : tryParseTick(_token1, _token0, 3000, (Number(poolPrice) * max).toString(), _tickSpacing)

    const _tickUpper =
      title === Presets.FULL
        ? nearestUsableTick(TickMath.MAX_TICK, _tickSpacing)
        : title === 'current' || title === activePreset
          ? tickUpper
          : !currentPrice || !invertPrice
            ? tryParseTick(_token0, _token1, 3000, (Number(poolPrice) * max).toString(), _tickSpacing)
            : tryParseTick(_token1, _token0, 3000, (Number(poolPrice) * min).toString(), _tickSpacing)

    let _position = null
    if (token0 && token1) {
      if (!_tickUpper || !_tickLower || _tickUpper <= _tickLower) {
        _position = { liquidity: 0 }
      } else if (typedValue && title !== 'current' && !isZapper) {
        const independentCurrency = independentField === Field.CURRENCY_A ? currency0 : currency1

        const independentAmount = toWei(
          BigNumber(typedValue)
            .decimalPlaces(independentCurrency?.decimals ?? 18, BigNumber.ROUND_DOWN)
            .toString(),
          currency1?.decimals ?? 18,
        )
        _position =
          independentField === Field.CURRENCY_A
            ? Position.fromAmount1({
                pool,
                tickLower: _tickLower,
                tickUpper: _tickUpper,
                amount1: Math.round(independentAmount.toNumber()),
              })
            : Position.fromAmount0({
                pool,
                tickLower: _tickLower,
                tickUpper: _tickUpper,
                amount0: Math.round(independentAmount.toNumber()),
                useFullPrecision: true, // we want full precision for the theoretical position
              })
      } else {
        _position = Position.fromAmounts({
          pool,
          tickLower: _tickLower,
          tickUpper: _tickUpper,
          amount0: isRevert ? Math.round(_amount0.toNumber()) : Math.round(_amount1.toNumber()),
          amount1: isRevert ? Math.round(_amount1.toNumber()) : Math.round(_amount0.toNumber()),
          useFullPrecision: true,
        })
      }
    } else if (title === 'current' || title === activePreset) {
      _position = { liquidity: estimatedLiquidity }
    } else {
      const liquidityData = zapAprInRanges?.[title]?.positionDetails?.addedLiquidity
      _position = { liquidity: liquidityData ?? 0 }
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
    const hasEmission = Number(rewardReserve?.[0]) > 0 || Number(rewardReserve?.[1]) > 0n
    if (!p || !hasEmission) {
      acc[title] = BigNumber(0)
    } else {
      const positionTvl = BigNumber((isRevert ? p.amount0 : p.amount1)?.toExact() ?? 0)
        .times(currency0?.price)
        .plus(BigNumber((isRevert ? p.amount1 : p.amount0)?.toExact() ?? 0).times(currency1?.price ?? 0))

      acc[title] = calAPR({
        reward,
        tvl: isZapper ? tvl : positionTvl,
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

  const rewardReserves = await batchCallMulti(
    poolAddressList.map(address => ({
      functionName: 'rewardReserves',
      address: getAddress(farmDatas, address),
      abi: eternalVirtualPoolAbi,
    })),
  )

  const result = (globalStates || []).map((states, index) => {
    const communityFee = BigNumber(states?.[4] || 200n)
    const totalLiquidityInFarm = BigNumber(currentLiquidities?.[index] ?? 1n)
    const earnPercent = BigNumber(1).minus(communityFee.div(1000)).times(100)
    const rewardReserve = rewardReserves?.[index] ?? [0n, 0n]
    return { totalLiquidityInFarm, earnPercent, rewardReserve }
  })

  return result
}
