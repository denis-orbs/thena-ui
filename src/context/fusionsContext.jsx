import BigNumber from 'bignumber.js'
import React, { createContext, useContext, useMemo } from 'react'
import useSWR from 'swr'

import { poolAbi } from '@/constant/abi/fusion'
import { CHAIN_ID } from '@/constant/contracts'
import { poolTestNetV2Abi } from '@/constant/v2-testnet-abi'
import { poolTestNetV3Abi } from '@/constant/v3-abi'
import { callMulti } from '@/lib/contractActions'
import { useChainSettings } from '@/state/settings/hooks'

import { PairsContext } from './pairsContext'

const initialState = []

const fetchFusionInfo = async (fusionPairs, _chainId) => {
  const liquidities = await callMulti(
    fusionPairs.map(pool => ({
      address: pool.address,
      abi: _chainId === CHAIN_ID.TEST_BSC ? (pool.version === 2 ? poolTestNetV2Abi : poolTestNetV3Abi) : poolAbi,
      functionName: 'liquidity',
      args: [],
      chainId: _chainId,
    })),
  )
  const globalStates = await callMulti(
    fusionPairs.map(pool => ({
      address: pool.address,
      abi: _chainId === CHAIN_ID.TEST_BSC ? (pool.version === 2 ? poolTestNetV2Abi : poolTestNetV3Abi) : poolAbi,
      functionName: 'globalState',
      args: [],
      chainId: _chainId,
    })),
  )

  return fusionPairs.map((ele, idx) => ({
    version: ele.version,
    address: ele.address,
    liquidity: new BigNumber(liquidities[idx]).toString(10),
    globalState: {
      price: new BigNumber(globalStates[idx][0]).toString(10),
      tick: Number(globalStates[idx][1]),
      fee: Number(globalStates[idx][2]),
    },
  }))
}

const FusionsContext = createContext(initialState)

function FusionsContextProvider({ children }) {
  const { networkId } = useChainSettings()
  const pairs = useContext(PairsContext)
  const fusionPairs = useMemo(() => {
    const { data } = pairs[networkId]
    if (!data?.length) return []
    return data.filter(ele => ele.isFusion)
  }, [pairs, networkId])
  const { data } = useSWR(
    fusionPairs.length > 0 ? ['fusion/pairs', networkId] : null,
    () => fetchFusionInfo(fusionPairs, networkId),
    {
      refreshInterval: 60000,
    },
  )

  return <FusionsContext.Provider value={data}>{children}</FusionsContext.Provider>
}

const useFusionPairs = () => {
  const fusionPairs = useContext(FusionsContext)
  return fusionPairs
}

export { FusionsContextProvider, useFusionPairs }
