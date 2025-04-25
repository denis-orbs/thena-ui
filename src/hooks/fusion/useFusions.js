import BigNumber from 'bignumber.js'
import { useMemo, useRef } from 'react'
import useSWR from 'swr'
import { computePoolAddress, Pool } from 'thena-fusion-sdk'
import { zeroAddress } from 'viem'
import { useReadContract, useReadContracts } from 'wagmi'

import { algebraFactoryAbi } from '@/constant/abi'
import { newPoolAbi, poolAbi } from '@/constant/abi/fusion'
import Contracts, { CHAIN_ID } from '@/constant/contracts'
import { useFusionPairs } from '@/context/fusionsContext'
import { callMulti, readCall } from '@/lib/contractActions'
import { getAlgebraFactoryContract } from '@/lib/contracts'

import { getCurrency, useGetAssetFn } from './Tokens'
import useWallet from '../useWallet'

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
        abi: algebraFactoryAbi,
        functionName: 'computePoolAddress',
        args: [value[0]?.address, value[1]?.address],
        _networkId,
      })),
  )
}

export function useFusions(poolKeys, version) {
  const fusionPairs = useFusionPairs()

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

export function useFusionState({ currencyA, currencyB, version = 3, isFarmingPool = false }) {
  const wTokenA = currencyA?.wrapped
  const wTokenB = currencyB?.wrapped

  let token0 = null
  let token1 = null

  if (wTokenA && wTokenB) {
    // eslint-disable-next-line no-extra-semi
    ;[token0, token1] = wTokenA.sortsBefore(wTokenB) ? [wTokenA, wTokenB] : [wTokenB, wTokenA]
  }
  const chainId = wTokenA?.chainId ?? 56

  let functionName
  let args

  if (version === 2) {
    functionName = 'poolByPair'
    args = [token0?.address, token1?.address]
  } else {
    functionName = isFarmingPool ? 'computePoolAddress' : 'computeCustomPoolAddress'

    args = isFarmingPool
      ? [token0?.address, token1?.address]
      : [Contracts.pluginFactory[chainId], token0?.address, token1?.address]
  }

  const algebraContract = getAlgebraFactoryContract(chainId, version)
  const { data: poolAddress } = useReadContract({
    ...algebraContract,
    functionName,
    args,
    query: {
      enabled: !!token0?.address && !!token1?.address && !!chainId,
      staleTime: Infinity,
    },
  })

  const poolContract = { address: poolAddress, abi: version === 2 ? poolAbi : newPoolAbi }
  const { data: poolInfo } = useReadContracts({
    contracts: [
      { ...poolContract, functionName: 'liquidity' },
      { ...poolContract, functionName: 'globalState' },
      { ...poolContract, functionName: 'fee' },
    ],
    query: {
      enabled: !!poolAddress,
    },
  })

  const liquidity = new BigNumber(poolInfo?.[0]?.result).toString(10)
  const globalStates = poolInfo?.[1]?.result
  const price = new BigNumber(globalStates?.[0]).toString(10)
  const tick = Number(globalStates?.[1]) ?? 0
  const fee = Number(globalStates?.[2]) || poolInfo?.[2]?.result

  if (!token0 || !token1 || !fee || !price || !liquidity) return [PoolState.NOT_EXISTS, null]
  return [PoolState.EXISTS, new Pool(token0, token1, fee, price, liquidity, tick), poolAddress]
}

export const getFusionState = async ({ currencyA, currencyB, version = 3, isFarmingPool = false }) => {
  const wTokenA = currencyA?.wrapped
  const wTokenB = currencyB?.wrapped

  let token0 = null
  let token1 = null

  if (wTokenA && wTokenB) {
    // eslint-disable-next-line no-extra-semi
    ;[token0, token1] = wTokenA.sortsBefore(wTokenB) ? [wTokenA, wTokenB] : [wTokenB, wTokenA]
  }
  const chainId = wTokenA?.chainId ?? 56

  let functionName
  let args

  if (version === 2) {
    functionName = 'poolByPair'
    args = [token0?.address, token1?.address]
  } else {
    functionName = isFarmingPool ? 'computePoolAddress' : 'computeCustomPoolAddress'

    args = isFarmingPool
      ? [token0?.address, token1?.address]
      : [Contracts.pluginFactory[chainId], token0?.address, token1?.address]
  }

  const algebraContract = getAlgebraFactoryContract(chainId, version)
  let poolAddress
  if (!!token0?.address && !!token1?.address && !!chainId) {
    poolAddress = await readCall(algebraContract, functionName, [...args], chainId)
  }

  // const { data: poolAddress } = useReadContract({
  //   ...algebraContract,
  //   functionName,
  //   args,
  //   query: {
  //     enabled: !!token0?.address && !!token1?.address && !!chainId,
  //     staleTime: Infinity,
  //   },
  // })

  const poolContract = { address: poolAddress, abi: version === 2 ? poolAbi : newPoolAbi }
  // const { data: poolInfo } = useReadContracts({
  //   contracts: [
  //     { ...poolContract, functionName: 'liquidity' },
  //     { ...poolContract, functionName: 'globalState' },
  //     { ...poolContract, functionName: 'fee' },
  //   ],
  //   query: {
  //     enabled: !!poolAddress,
  //   },
  // })

  const poolInfo = await callMulti([
    { ...poolContract, functionName: 'liquidity' },
    { ...poolContract, functionName: 'globalState' },
    { ...poolContract, functionName: 'fee' },
  ])

  const liquidity = new BigNumber(poolInfo?.[0]).toString(10)
  const globalStates = poolInfo?.[1]
  const price = new BigNumber(globalStates?.[0]).toString(10)
  const tick = Number(globalStates?.[1]) ?? 0
  const fee = Number(globalStates?.[2]) || poolInfo?.[2]

  if (!token0 || !token1 || !fee || !price || !liquidity) return [PoolState.NOT_EXISTS, null]
  return [PoolState.EXISTS, new Pool(token0, token1, fee, price, liquidity, tick), poolAddress]
}

const getTokens = (pool, chainId, getAsset) => {
  const { asset0, asset1 } = pool
  const currency0 = getCurrency(asset0.address, chainId, getAsset)
  const currency1 = getCurrency(asset1.address, chainId, getAsset)
  const wTokenA = currency0?.wrapped
  const wTokenB = currency1?.wrapped

  if (wTokenA && wTokenB) {
    return wTokenA.sortsBefore(wTokenB) ? [wTokenA, wTokenB] : [wTokenB, wTokenA]
  }

  return [null, null]
}

const getMultiFusionState = async (contracts, pools, poolAddressList, chainId, getAsset) => {
  const liquidities = await callMulti(contracts.map(contract => ({ ...contract, functionName: 'liquidity' })))
  const globalStates = await callMulti(contracts.map(contract => ({ ...contract, functionName: 'globalState' })))
  const fees = await callMulti(contracts.map(contract => ({ ...contract, functionName: 'fee' })))
  const fusionStates = poolAddressList.map((poolAddress, index) => {
    const liquidity = new BigNumber(liquidities[index]).toString(10)
    const globalState = globalStates[index]
    const fee = Number(globalState?.[2]) || Number(fees[index])

    const price = new BigNumber(globalState?.[0]).toString(10)
    const tick = Number(globalState?.[1]) ?? 0

    const [token0, token1] = getTokens(pools[index], chainId, getAsset)

    if (!token0 || !token1 || !fee || !price || !liquidity) {
      return [PoolState.NOT_EXISTS, null, poolAddress]
    }

    return [PoolState.EXISTS, new Pool(token0, token1, fee, price, liquidity, tick), poolAddress]
  })

  return fusionStates
}

export const useGetMultipleFusionState = (pools, poolAddressList) => {
  const { chainId, account } = useWallet()
  const { getAsset } = useGetAssetFn()
  const contracts = (pools || []).map((pool, index) => {
    const { version } = pool
    const poolAddress = poolAddressList[index]
    const poolContract = { address: poolAddress, abi: version === 2 ? poolAbi : newPoolAbi }
    return poolContract
  })
  const prevData = useRef([])
  const { data, isLoading } = useSWR(
    contracts.length > 0 &&
      account &&
      chainId && ['get fusion state list', contracts, pools, poolAddressList, account, chainId],
    () => getMultiFusionState(contracts, pools, poolAddressList, chainId, getAsset),
    {
      refreshInterval: 60000,
    },
  )

  const _data = useMemo(() => {
    if (!data || isLoading) {
      return prevData.current
    }
    prevData.current = data
    return data
  }, [data, isLoading])
  return _data
}

export const getListComputePoolAddress = async (pools, chainId, getAsset) => {
  try {
    const listAddress = await callMulti(
      pools.map(pool => {
        const [token0, token1] = getTokens(pool, chainId, getAsset)
        const isFarmingPool = pool.deployer === zeroAddress

        return {
          ...getAlgebraFactoryContract(chainId, pool.version), // algebraContract,
          functionName:
            pool.version === 2
              ? 'poolByPair'
              : pool.deployer === zeroAddress
                ? 'computePoolAddress'
                : 'computeCustomPoolAddress',
          args:
            pool.version === 2
              ? [token0?.address, token1?.address]
              : isFarmingPool
                ? [token0?.address, token1?.address]
                : [Contracts.pluginFactory[chainId], token0?.address, token1?.address],
          chainId,
        }
      }),
    )
    return listAddress.map(address => address.toLowerCase())
  } catch (error) {
    console.log(error)
  }
}
