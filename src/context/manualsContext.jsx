import React, { createContext, useContext, useMemo } from 'react'
import useSWR from 'swr'

import { algebraAbi } from '@/constant/abi/fusion'
import Contracts from '@/constant/contracts'
import { useAssets } from '@/context/assetsContext'
import { callMulti, readCall } from '@/lib/contractActions'
import { getAlgebraNPMContract } from '@/lib/contracts'
import useWallet from '@/lib/wallets/useWallet'
import { useChainSettings } from '@/state/settings/hooks'

const initialState = []

const fetchManualInfo = async (account, chainId) => {
  const npmContract = getAlgebraNPMContract(chainId)
  const balance = await readCall(npmContract, 'balanceOf', [account], chainId)
  if (!balance) return
  const tokenRequests = []
  for (let i = 0; i < balance; i++) {
    tokenRequests.push(i)
  }
  const tokenIds = await callMulti(
    tokenRequests.map(id => ({
      address: Contracts.nonfungiblePositionManager[chainId],
      abi: algebraAbi,
      functionName: 'tokenOfOwnerByIndex',
      args: [account, id],
      chainId,
    })),
  )
  const positions = await callMulti(
    tokenIds.map(id => ({
      address: Contracts.nonfungiblePositionManager[chainId],
      abi: algebraAbi,
      functionName: 'positions',
      args: [id],
      chainId,
    })),
  )
  return positions.map((ele, idx) => ({
    tokenId: Number(tokenIds[idx]),
    token0Address: ele[2],
    token1Address: ele[3],
    tickLower: Number(ele[4]),
    tickUpper: Number(ele[5]),
    liquidity: ele[6],
  }))
}

const ManualsContext = createContext(initialState)

function ManualsContextProvider({ children }) {
  const { networkId } = useChainSettings()
  const assets = useAssets()
  const { account } = useWallet()
  const { data, mutate } = useSWR(
    account && networkId ? ['manuals/info', networkId, account] : null,
    () => fetchManualInfo(account, networkId),
    {
      refreshInterval: 60000,
    },
  )
  const final = useMemo(() => {
    if (!assets || !assets.length || !data) {
      return {
        mutateManual: mutate,
        positions: [],
      }
    }
    const positions = data.map(ele => {
      const asset0 = assets.find(asset => asset.address === ele.token0Address.toLowerCase())
      const asset1 = assets.find(asset => asset.address === ele.token1Address.toLowerCase())
      return {
        ...ele,
        type: 'Manual',
        symbol: `${asset0?.symbol}/${asset1?.symbol}`,
        asset0,
        asset1,
      }
    })
    return {
      mutateManual: mutate,
      positions,
    }
  }, [assets, data, mutate])

  return <ManualsContext.Provider value={final}>{children}</ManualsContext.Provider>
}

const useManuals = () => {
  const { positions } = useContext(ManualsContext)
  return positions
}

export { ManualsContext, ManualsContextProvider, useManuals }
