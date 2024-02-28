import { useMemo } from 'react'
import { computePoolAddress, Pool } from 'thena-fusion-sdk'

import { useFusionPairs } from '@/context/fusionsContext'

import { useToken } from './Tokens'

export const PoolState = {
  LOADING: 'LOADING',
  NOT_EXISTS: 'NOT_EXISTS',
  EXISTS: 'EXISTS',
  INVALID: 'INVALID',
}

export function useFusions(poolKeys) {
  const fusionPairs = useFusionPairs()
  const transformed = useMemo(
    () =>
      poolKeys.map(([currencyA, currencyB]) => {
        if (!currencyA || !currencyB) return null

        const tokenA = currencyA?.wrapped
        const tokenB = currencyB?.wrapped
        if (!tokenA || !tokenB || tokenA.equals(tokenB)) return null
        const [token0, token1] = tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA]
        return [token0, token1]
      }),
    [poolKeys],
  )

  const poolAddresses = useMemo(
    () =>
      transformed.map(value => {
        if (!value) return undefined
        return computePoolAddress({
          tokenA: value[0],
          tokenB: value[1],
        })
      }),
    [transformed],
  )

  return useMemo(
    () =>
      poolAddresses.map((poolAddress, index) => {
        const [token0, token1] = transformed[index] ?? []
        if (!token0 || !token1) return [PoolState.INVALID, null]

        const found = fusionPairs && fusionPairs.find(ele => ele.address.toLowerCase() === poolAddress.toLowerCase())
        if (!found) return [PoolState.NOT_EXISTS, null]
        const { globalState, liquidity } = found
        if (!globalState || !liquidity) return [PoolState.NOT_EXISTS, null]
        if (!globalState.price || Number(globalState.price) === 0) return [PoolState.NOT_EXISTS, null]
        try {
          return [
            PoolState.EXISTS,
            new Pool(token0, token1, globalState.fee, globalState.price, liquidity, globalState.tick),
          ]
        } catch (error) {
          console.log('error :>> ', error)
          return [PoolState.NOT_EXISTS, null]
        }
      }),
    [poolAddresses, transformed, fusionPairs],
  )
}

export function useFusion(currencyA, currencyB) {
  const poolKeys = useMemo(() => [[currencyA, currencyB]], [currencyA, currencyB])

  return useFusions(poolKeys)[0]
}

export function useTokensSymbols(token0, token1) {
  const _token0 = useToken(token0)
  const _token1 = useToken(token1)

  return useMemo(() => [_token0, _token1], [_token0, _token1])
}
