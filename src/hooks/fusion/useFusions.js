import BigNumber from 'bignumber.js'
import { useMemo } from 'react'
import useSWR from 'swr'
import { computePoolAddress, Pool } from 'thena-fusion-sdk'
import { useReadContract, useReadContracts } from 'wagmi'

import { algebraFactoryAbi } from '@/constant/abi'
import Contracts, { CHAIN_ID } from '@/constant/contracts'
import { poolMainNetV2Abi } from '@/constant/v2-mainnet-abi'
import { poolTestNetV2Abi } from '@/constant/v2-testnet-abi'
import { algebraFactoryV3Abi } from '@/constant/v3-abi'
import { useFusionPairs } from '@/context/fusionsContext'
import { callMulti } from '@/lib/contractActions'
import { getAlgebraFactoryContract } from '@/lib/contracts'

import { useToken } from './Tokens'

export const PoolState = {
  LOADING: 'LOADING',
  NOT_EXISTS: 'NOT_EXISTS',
  EXISTS: 'EXISTS',
  INVALID: 'INVALID',
}

const fetchPoolAddress = async (transformed, version = 3) => {
  const _networkId = transformed?.[0]?.[0].chainId
  if (_networkId !== CHAIN_ID.TEST_BSC) {
    return transformed.map(value =>
      computePoolAddress({
        tokenA: value[0],
        tokenB: value[1],
      }),
    )
  }

  return callMulti(
    transformed
      .filter(value => !!value)
      .map(value => ({
        address: version === 2 ? Contracts.algebraFactoryV2[_networkId] : Contracts.algebraFactoryV3[_networkId],
        abi: version === 2 ? algebraFactoryAbi : algebraFactoryV3Abi,
        functionName: 'computePoolAddress',
        args: [value[0]?.address, value[1]?.address],
        _networkId,
      })),
  )
}

export function useFusions(poolKeys, version) {
  const fusionPairs = useFusionPairs(version)

  const transformed = useMemo(
    () =>
      poolKeys
        .map(([currencyA, currencyB]) => {
          if (!currencyA || !currencyB) return null

          const tokenA = currencyA?.wrapped
          const tokenB = currencyB?.wrapped
          if (!tokenA || !tokenB || tokenA.equals(tokenB)) return null
          const [token0, token1] = tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA]
          return [token0, token1]
        })
        .filter(poolKey => !!poolKey),
    [poolKeys],
  )

  const { data: poolAddresses = [] } = useSWR(
    transformed.length > 0
      ? transformed.map(value => [value[0].address, value[1].address, value[1].chainId, 'fetchPoolAddress', version])
      : null,
    () => fetchPoolAddress(transformed, version),
  )

  const data = useMemo(
    () =>
      poolAddresses
        .filter(poolAddress => !!poolAddress)
        .map((poolAddress, index) => {
          const [token0, token1] = transformed[index] ?? []
          if (!token0 || !token1) return [PoolState.INVALID, null]

          const found = fusionPairs?.find(ele => ele.address.toLowerCase() === poolAddress.toLowerCase())
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

  return data
}

export function useFusionState(currencyA, currencyB, version = 3) {
  const [token0, token1] = currencyA.sortsBefore(currencyB) ? [currencyA, currencyB] : [currencyB, currencyA]
  const { chainId } = token0

  const algebra = getAlgebraFactoryContract(chainId, version)
  const { data: poolAddress } = useReadContract({
    ...algebra,
    functionName: chainId === CHAIN_ID.BSC && version === 2 ? 'poolByPair' : 'computePoolAddress',
    args: [token0?.address, token1?.address],
    query: {
      enabled: !!token0?.address && !!token1?.address && !!chainId,
    },
  })

  const poolContract = { address: poolAddress, abi: chainId === CHAIN_ID.BSC ? poolMainNetV2Abi : poolTestNetV2Abi }
  const { data: poolInfo } = useReadContracts({
    contracts: [
      { ...poolContract, functionName: 'liquidity' },
      { ...poolContract, functionName: 'globalState' },
    ],
    query: {
      enabled: !!poolAddress,
    },
  })

  const liquidity = new BigNumber(poolInfo?.[0]?.result).toString(10)
  const globalStates = poolInfo?.[1]?.result
  const price = new BigNumber(globalStates?.[0]).toString(10)
  const tick = Number(globalStates?.[1]) ?? 0
  const fee = Number(globalStates?.[2])

  if (!token0 || !token1 || !fee || !price || !liquidity) return [PoolState.NOT_EXISTS, null]
  return [PoolState.EXISTS, new Pool(token0, token1, fee, price, liquidity, tick)]
}

export function useFusion(currencyA, currencyB, version = 3) {
  const poolKeys = useMemo(() => [[currencyA, currencyB]], [currencyA, currencyB])

  return useFusions(poolKeys, version)[0] ?? []
}

export function useTokensSymbols(token0, token1) {
  const _token0 = useToken(token0)
  const _token1 = useToken(token1)

  return useMemo(() => [_token0, _token1], [_token0, _token1])
}
