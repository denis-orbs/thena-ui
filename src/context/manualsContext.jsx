import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'

import { algebraAbi } from '@/constant/abi/fusion'
import Contracts from '@/constant/contracts'
import { useAssets } from '@/context/assetsContext'
import useWallet from '@/hooks/useWallet'
import { callMulti, readCall } from '@/lib/contractActions'
import { getAlgebraNPMContract } from '@/lib/contracts'
import { getTokenInfo } from '@/lib/helper'
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

  const [manualData, setManualData] = useState([])

  useEffect(() => {
    const processPositions = async () => {
      if (!assets || !assets.length || !data) {
        setManualData([])
        return
      }

      const positions = await Promise.all(
        data.map(async ele => {
          const asset0 = await getTokenInfo({ address: ele.token0Address, assets, account, networkId })
          const asset1 = await getTokenInfo({ address: ele.token1Address, assets, account, networkId })
          return {
            ...ele,
            type: 'Manual',
            symbol: `${asset0?.symbol || 'UNKNOWN'}/${asset1?.symbol || 'UNKNOWN'}`,
            asset0,
            asset1,
          }
        }),
      )

      setManualData(positions)
    }
    processPositions()
  }, [account, assets, data, networkId])

  const final = useMemo(
    () => ({
      mutateManual: mutate,
      positions: manualData,
    }),
    [manualData, mutate],
  )

  return <ManualsContext.Provider value={final}>{children}</ManualsContext.Provider>
}

const useManuals = () => {
  const { positions } = useContext(ManualsContext)
  return positions
}

export { ManualsContext, ManualsContextProvider, useManuals }
