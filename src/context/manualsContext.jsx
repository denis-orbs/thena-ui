import React, { createContext, useContext, useMemo } from 'react'
import useSWR from 'swr'

import { algebraAbiV2 } from '@/constant/abi/fusion'
import Contracts from '@/constant/contracts'
import { useAssets } from '@/context/assetsContext'
import useWallet from '@/hooks/useWallet'
import { callMulti, readCall } from '@/lib/contractActions'
import { getNonfungiblePositionManagerContractV2, getNonfungiblePositionManagerContractV3 } from '@/lib/contracts'
import { useChainSettings } from '@/state/settings/hooks'

const initialState = []

const fetchManualV2Info = async (account, chainId) => {
  const npmContract = getNonfungiblePositionManagerContractV2(chainId)
  const balance = await readCall(npmContract, 'balanceOf', [account], chainId)
  const address = Contracts.nonfungiblePositionManagerV2[chainId]

  if (!balance) return []
  const tokenRequests = []
  for (let i = 0; i < balance; i++) {
    tokenRequests.push(i)
  }
  const tokenIds = await callMulti(
    tokenRequests.map(id => ({
      address,
      abi: algebraAbiV2,
      functionName: 'tokenOfOwnerByIndex',
      args: [account, id],
      chainId,
    })),
  )
  const positions = await callMulti(
    tokenIds.map(id => ({
      address,
      abi: algebraAbiV2,
      functionName: 'positions',
      args: [id],
      chainId,
    })),
  )

  return positions.map((ele, idx) => ({
    version: 2,
    tokenId: Number(tokenIds[idx]),
    token0Address: ele[2],
    token1Address: ele[3],
    tickLower: Number(ele[4]),
    tickUpper: Number(ele[5]),
    liquidity: ele[6],
  }))
}

const fetchManualV3Info = async (account, chainId) => {
  const npmContract = getNonfungiblePositionManagerContractV3(chainId)
  const balance = await readCall(npmContract, 'balanceOf', [account], chainId)
  if (!balance) return []
  const tokenRequests = []
  for (let i = 0; i < balance; i++) {
    tokenRequests.push(i)
  }
  const tokenIds = await callMulti(
    tokenRequests.map(id => ({
      address: Contracts.nonfungiblePositionManagerV3[chainId],
      abi: algebraAbiV2,
      functionName: 'tokenOfOwnerByIndex',
      args: [account, id],
      chainId,
    })),
  )
  const positions = await callMulti(
    tokenIds.map(id => ({
      address: Contracts.nonfungiblePositionManagerV3[chainId],
      abi: algebraAbiV2,
      functionName: 'positions',
      args: [id],
      chainId,
    })),
  )
  return positions.map((ele, idx) => ({
    version: 3,
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
  const { data: positionV2 = [], mutate: mutateV2 } = useSWR(
    account && networkId ? ['manuals/info', 'version-2', networkId, account] : null,
    () => fetchManualV2Info(account, networkId),
    {
      refreshInterval: 60000,
    },
  )

  const { data: positionV3 = [], mutate: mutateV3 } = useSWR(
    account && networkId ? ['manuals/info', 'version-3', networkId, account] : null,
    () => fetchManualV3Info(account, networkId),
    {
      refreshInterval: 60000,
    },
  )

  const final = useMemo(() => {
    if (!assets || !assets.length || !positionV2) {
      return {
        mutateManual: () => {
          mutateV2()
          mutateV3()
        },
        positions: [],
      }
    }
    const positions = [...positionV2, ...positionV3].map(ele => {
      const asset0 = assets.find(asset => asset.address.toLowerCase() === ele.token0Address.toLowerCase())
      const asset1 = assets.find(asset => asset.address.toLowerCase() === ele.token1Address.toLowerCase())
      return {
        ...ele,
        type: 'Manual',
        symbol: `${asset0?.symbol}/${asset1?.symbol}`,
        asset0,
        asset1,
      }
    })

    return {
      mutateManual: () => {
        mutateV2()
        mutateV3()
      },
      positions,
    }
  }, [assets, positionV2, positionV3, mutateV2, mutateV3])

  return <ManualsContext.Provider value={final}>{children}</ManualsContext.Provider>
}

const useManuals = () => {
  const { positions } = useContext(ManualsContext)
  return positions
}

export { ManualsContext, ManualsContextProvider, useManuals }
