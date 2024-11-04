import BigNumber from 'bignumber.js'
import { useMemo } from 'react'
import useSWR from 'swr'
import { CurrencyAmount } from 'thena-sdk-core'
import { maxUint128 } from 'viem'

import { useCurrency, useToken } from '@/hooks/fusion/Tokens'
import { useFusion } from '@/hooks/fusion/useFusions'
import usePrevious from '@/hooks/usePrevious'
import useWallet from '@/hooks/useWallet'
import { simulateCall } from '@/lib/contractActions'
import { getAlgebraNPMContract } from '@/lib/contracts'
import { unwrappedToken } from '@/lib/fusion'
import { fromWei } from '@/lib/utils'
import Position from '@/modules/Position'

const fetchManualInfo = async (account, tokenId, chainId) => {
  const algebraContract = getAlgebraNPMContract(chainId)
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
export const useDataPool = pool => {
  const { account, chainId } = useWallet()
  const { asset0, asset1, liquidity, tickLower, tickUpper, tokenId } = pool
  const { data: fees } = useSWR(
    account && tokenId ? ['manuals/fee', tokenId, account, chainId] : null,
    () => fetchManualInfo(account, tokenId, chainId),
    {
      refreshInterval: 60000,
    },
  )
  console.log({ asset0, asset1 })
  const currency0 = useCurrency(asset0.address)
  const currency1 = useCurrency(asset1.address)
  const [fusionState, fusion] = useFusion(currency0, currency1)

  const [prevFusionState, prevFusion] = usePrevious([fusionState, fusion]) || []
  const [, _fusion] = useMemo(() => {
    if (!fusion && prevFusion && prevFusionState) {
      return [prevFusionState, prevFusion]
    }
    return [fusionState, fusion]
  }, [fusion, fusionState, prevFusion, prevFusionState])

  const position = useMemo(() => {
    if (_fusion) {
      return new Position({
        pool: _fusion,
        liquidity: new BigNumber(liquidity).toString(10),
        tickLower,
        tickUpper,
      })
    }
    return undefined
  }, [liquidity, _fusion, tickLower, tickUpper])

  const amount0 = useMemo(() => (position ? position.amount0.toExact() : 0), [position])
  const amount1 = useMemo(() => (position ? position.amount1.toExact() : 0), [position])

  const amount0InUsd = useMemo(() => amount0 * asset0.price, [amount0, asset0])
  const amount1InUsd = useMemo(() => amount1 * asset1.price, [amount1, asset1])

  const token0 = useToken(asset0.address)
  const token1 = useToken(asset1.address)
  console.log({ token0, token1 })
  const feeValue0 = useMemo(
    () => CurrencyAmount.fromRawAmount(unwrappedToken(token0), new BigNumber(fees ? fees[0] : 0).toString(10)),
    [token0, fees],
  )
  const feeValue1 = useMemo(
    () => CurrencyAmount.fromRawAmount(unwrappedToken(token1), new BigNumber(fees ? fees[1] : 0).toString(10)),
    [token1, fees],
  )

  const feesInUsd = useMemo(
    () =>
      fromWei(fees ? fees[0] : 0, asset0.decimals)
        .times(asset0.price)
        .plus(fromWei(fees ? fees[1] : 0, asset1.decimals).times(asset1.price)),
    [fees, asset0, asset1],
  )

  const firstPercent = useMemo(
    () => ((amount0InUsd / (amount0InUsd + amount1InUsd)) * 100).toFixed(2),
    [amount0InUsd, amount1InUsd],
  )

  const outOfRange = _fusion ? _fusion.tickCurrent < tickLower || _fusion.tickCurrent >= tickUpper : false

  const tagName = useMemo(() => {
    if (pool.type === 'Manual') {
      return Number(liquidity) ? 'In Range' : 'Out of Range'
    }

    if (pool?.account?.gaugeBalance.gt(0)) {
      return 'Staked'
    }
    if (pool?.account?.walletBalance.gt(0)) {
      return 'Not Staked'
    }
  }, [liquidity, pool?.account?.gaugeBalance, pool?.account?.walletBalance, pool.type])

  return {
    asset0,
    asset1,
    feeValue0,
    feeValue1,
    feesInUsd,
    firstPercent,
    outOfRange,
    tagName,
  }
}
