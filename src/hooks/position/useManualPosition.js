import BigNumber from 'bignumber.js'
import moment from 'moment'
import { useMemo } from 'react'
import { Position } from 'thena-fusion-sdk'
import { CurrencyAmount } from 'thena-sdk-core'
import { maxUint128, zeroAddress } from 'viem'

import { simulateCall } from '@/lib/contractActions'
import { getPositionManagerContract } from '@/lib/contracts'
import { getFusionFarmingData, getFusionFeesData } from '@/lib/subgraph'
import { fromWei, ZERO_VALUE } from '@/lib/utils'

import { getToken, useGetAssetFn } from '../fusion/Tokens'
import { getFarmInfoList } from '../fusion/useEstimateAPR'
import { getListComputePoolAddress, PoolState, useGetMultipleFusionState } from '../fusion/useFusions'
import { useCachedSWR } from '../useCachedSWR'
import usePrevious from '../usePrevious'
import useWallet from '../useWallet'

const REFRESH_INTERVAL = 60000 // every 1 minute

const fetchManualInfo = async (positions, account, chainId) => {
  const manualBalances = []
  const algebraContracts = { 2: getPositionManagerContract(chainId, 2), 3: getPositionManagerContract(chainId, 3) }

  for (let i = 0; i < positions.length; i++) {
    const pos = positions[i]
    const version = pos.version ?? 3
    const algebraContract = algebraContracts[version]

    try {
      const balance = await simulateCall(
        algebraContract,
        'collect',
        [[pos.tokenId, account, maxUint128, maxUint128]],
        chainId,
      )
      manualBalances.push(balance)
    } catch (error) {
      manualBalances.push(null)
    }
  }

  return manualBalances
}

export const useManualPositions = manualPositions => {
  const { chainId, account } = useWallet()
  const { getAsset } = useGetAssetFn()

  // Fees list for manual positions
  const feesListKey = useMemo(
    () =>
      manualPositions.length > 0 && account && chainId ? ['manuals/fee', manualPositions, account, chainId] : null,
    [account, manualPositions, chainId],
  )

  const { data: feesList } = useCachedSWR(feesListKey, () => fetchManualInfo(manualPositions, account, chainId), {
    refreshInterval: REFRESH_INTERVAL,
  })

  // Pool address list
  const addressListKey = useMemo(
    () =>
      manualPositions.length && account && chainId ? ['getFeePoolAddress', chainId, account, manualPositions] : null,
    [manualPositions, chainId, account],
  )

  const { data: addressList } = useCachedSWR(
    addressListKey,
    () => getListComputePoolAddress(manualPositions, chainId, getAsset),
    { refreshInterval: REFRESH_INTERVAL },
  )

  // Fusion states
  const fusionStates = useGetMultipleFusionState(manualPositions, addressList)
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
        ? ['getFusionFarmingDataList manual', chainId, account, addressList]
        : null,
    [addressList, chainId, account],
  )

  const { data: farmingList } = useCachedSWR(
    farmingListKey,
    () =>
      getFusionFarmingData({
        poolIds: addressList,
        chainId,
      }),
    { refreshInterval: 60000 },
  )

  // Annual pool fees
  const annualPoolKey = useMemo(
    () => (addressList?.length > 0 && chainId && account ? ['getFusionFeesData', chainId, account, addressList] : null),
    [addressList, chainId, account],
  )

  const { data: annualPoolFeesPools } = useCachedSWR(
    annualPoolKey,
    () => getFusionFeesData({ chainId, poolIds: addressList, date: moment().subtract(7, 'days').unix() }),
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
    if (!_fusionStates || _fusionStates.length <= 0) return []

    return manualPositions.map((farmPos, index) => {
      const { asset0, asset1, liquidity, tickLower, tickUpper } = farmPos
      const [fusionState, fusion, poolAddress = zeroAddress] = _fusionStates?.[index] || [PoolState.NOT_EXISTS, null]
      const fees = feesList?.[index]

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
      const tvl = amount0InUsd.plus(amount1InUsd)

      const token0 = getToken(asset0.address, getAsset)
      const token1 = getToken(asset1.address, getAsset)

      const apr = (() => {
        if (!tickLower || !tickUpper || !position) return ZERO_VALUE

        const farmInfo = farmInfoList[index] || {}

        const totalLiquidity = fusion?.liquidity
        const annualPoolFees = annualPoolFeesPools?.[poolAddress.toLowerCase()]?.annualPoolFees || NaN
        const feeRatio = totalLiquidity ? BigNumber(liquidity).div(totalLiquidity) : ZERO_VALUE
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
      }
    })
  }, [annualPoolFeesPools, farmInfoList, feesList, _fusionStates, getAsset, manualPositions])

  return result
}
