import BigNumber from 'bignumber.js'
import dayjs from 'dayjs'
import { isNil } from 'lodash'
import { useMemo } from 'react'
import { CurrencyAmount } from 'thena-sdk-core'
import { maxUint128, zeroAddress } from 'viem'

import { FusionNPMABI } from '@/abis/fusion/FusionNPMABI'
import { IntegralNPMABI } from '@/abis/integral/IntegralNPMABI'
import Contracts from '@/constant/contracts'
import { simulateCall } from '@/lib/contractActions'
import { createPosition } from '@/lib/position'
import { getIntegralFarmingData, getIntegralFeesData } from '@/lib/subgraph'
import { fromWei, ZERO_VALUE } from '@/utils/utils'

import { getToken, useGetAssetFn } from '../fusion/Tokens'
import { getFarmInfoList } from '../fusion/useEstimateAPR'
import { getListComputePoolAddress, PoolState, useGetMultipleFusionState } from '../fusion/useFusions'
import { useCachedSWR } from '../useCachedSWR'
import usePrevious from '../usePrevious'
import useWallet from '../useWallet'

const getNPMContract = (chainId, version) => ({
  abi: version === 3 ? IntegralNPMABI : FusionNPMABI,
  address: version === 3 ? Contracts.NPMIntegral[chainId] : Contracts.NPMFusion[chainId],
})

const REFRESH_INTERVAL = 60000 // every 1 minute

export const fetchManualInfo = async (account, tokenId, chainId, version) => {
  const algebraContract = getNPMContract(chainId, version)
  const balance = await simulateCall(
    algebraContract,
    'collect',
    [
      {
        tokenId,
        recipient: account, // some tokens might fail if transferred to address(0)
        amount0Max: maxUint128,
        amount1Max: maxUint128,
      },
    ],
    chainId,
  )
  return balance
}

const fetchMPositionInfo = async (positions, account, chainId) => {
  if (!positions?.length) return []

  const promises = positions.map(pos => {
    const version = pos.version ?? 3
    return fetchManualInfo(account, pos.tokenId, chainId, version)
  })

  const results = await Promise.allSettled(promises)

  return results.map(result => (result.status === 'fulfilled' ? result.value : null))
}

export const useManualPositions = positions => {
  const { chainId, account } = useWallet()
  const { getAsset } = useGetAssetFn()

  const positionDataKey = useMemo(
    () => (positions.length > 0 && account && chainId ? ['manual/initial', positions, account, chainId] : null),
    [account, positions, chainId],
  )

  const { data: positionInfo, isLoading: isLoadingPositionInfo } = useCachedSWR(
    positionDataKey,
    async () => {
      const [feesList, addressList] = await Promise.all([
        fetchMPositionInfo(positions, account, chainId),
        getListComputePoolAddress(positions, chainId, getAsset),
      ])
      return { feesList: feesList || [], addressList: addressList || [] }
    },
    { refreshInterval: REFRESH_INTERVAL },
  )

  const feesList = useMemo(() => positionInfo?.feesList || [], [positionInfo?.feesList])
  const addressList = useMemo(() => positionInfo?.addressList || [], [positionInfo?.addressList])

  // Fusion states
  const fusionStates = useGetMultipleFusionState(
    positions,
    addressList,
    !isLoadingPositionInfo && addressList?.length > 0,
  )
  const prevFusionStates = usePrevious(fusionStates)

  const _fusionStates = useMemo(() => {
    if ((!fusionStates || !fusionStates.length) && prevFusionStates) {
      return prevFusionStates || []
    }
    return fusionStates
  }, [fusionStates, prevFusionStates])

  // Farming list data
  const farmingListKey = useMemo(
    () =>
      addressList?.length > 0 && chainId && account
        ? ['getIntegralFarmingDataList manual', chainId, account, addressList]
        : null,
    [addressList, chainId, account],
  )

  const { data: farmingList } = useCachedSWR(
    farmingListKey,
    () =>
      getIntegralFarmingData({
        poolIds: addressList,
        chainId,
      }),
    { refreshInterval: 60000 },
    { enabled: addressList?.length > 0 },
  )

  // Annual pool fees
  const annualPoolKey = useMemo(
    () =>
      addressList?.length > 0 && chainId && account ? ['getIntegralFeesData', chainId, account, addressList] : null,
    [addressList, chainId, account],
  )

  const { data: annualPoolFeesPools } = useCachedSWR(
    annualPoolKey,
    () => getIntegralFeesData({ chainId, poolIds: addressList, date: dayjs().subtract(7, 'day').unix() }),
    { refreshInterval: REFRESH_INTERVAL },
  )

  // Farm info list
  const farmInfoKey = useMemo(
    () => (addressList?.length > 0 && account && chainId ? ['getManualFarmInfoList', chainId, account] : null),
    [addressList, account, chainId],
  )

  const { data: farmInfoList = [] } = useCachedSWR(farmInfoKey, () => getFarmInfoList(addressList, farmingList), {
    refreshInterval: REFRESH_INTERVAL,
  })

  const result = useMemo(() => {
    if (!positions || positions.length === 0) return []

    return positions.map((farmPos, index) => {
      const { asset0, asset1, liquidity, tickLower, tickUpper } = farmPos
      const [fusionState, fusion, poolAddress = zeroAddress, tickSpacing] = _fusionStates?.[index] || [
        PoolState.NOT_EXISTS,
        null,
      ]
      const fees = feesList?.[index]

      const position = fusion
        ? createPosition({
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
      const tvl = amount0InUsd.plus(amount1InUsd)

      const token0 = getToken(asset0.address, getAsset)
      const token1 = getToken(asset1.address, getAsset)

      const apr = (() => {
        if (isNil(tickLower) || isNil(tickUpper) || !position) return ZERO_VALUE

        const farmInfo = farmInfoList[index] || {}

        const totalLiquidity = fusion?.liquidity
        const annualPoolFees = annualPoolFeesPools?.[poolAddress.toLowerCase()]?.annualPoolFees || NaN
        const feeRatio = Number(totalLiquidity) > 0 ? BigNumber(liquidity).div(totalLiquidity) : ZERO_VALUE
        const feeAPR = tvl.gt(0)
          ? feeRatio
              .times(annualPoolFees)
              .div(tvl)
              .times(farmInfo.earnPercent ?? 0)
          : ZERO_VALUE

        return feeAPR
      })()

      const reward0 = {
        token: token0,
        amount: CurrencyAmount.fromRawAmount(token0, BigNumber(fees?.[0] ?? 0n)),
      }

      const reward1 = {
        token: token1,
        amount: CurrencyAmount.fromRawAmount(token1, BigNumber(fees?.[1] ?? 0n)),
      }

      const feesInUsd = (() => {
        if (!fees) return ZERO_VALUE
        return fromWei(fees?.[0] ?? 0, asset0.decimals)
          .times(asset0?.price ?? 0)
          .plus(fromWei(fees?.[1] ?? 0, asset1.decimals).times(asset1?.price ?? 0))
      })()

      const firstPercent = amount0InUsd.div(tvl).times(100).toNumber().toFixed(2)

      return {
        ...farmPos,
        apr: apr.toNumber(),
        amount0: Number(amount0),
        amount1: Number(amount1),
        fees,
        feesInUsd,
        fiatValueOfLiquidity: tvl.toNumber(),
        firstPercent,
        rewards: [reward0, reward1],
        rewardUsd: Number(feesInUsd),
        virtualPool: null,
        fusionState,
        fusion,
        poolAddress,
        tickSpacing,
      }
    })
  }, [_fusionStates, positions, feesList, getAsset, farmInfoList, annualPoolFeesPools])

  return result
}
