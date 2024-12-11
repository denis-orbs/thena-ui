import React, { createContext, useContext, useMemo } from 'react'
import useSWR from 'swr'

import { algebraAbiV2, algebraAbiV3 } from '@/constant/abi/fusion'
import Contracts from '@/constant/contracts'
import { useAssets } from '@/context/assetsContext'
import { useCustomAssets } from '@/context/customAssetsContext'
import useWallet from '@/hooks/useWallet'
import { callMulti, readCall } from '@/lib/contractActions'
import { getNonfungiblePositionManagerContractV2, getNonfungiblePositionManagerContractV3 } from '@/lib/contracts'
import { getTokenInfo } from '@/lib/helper'
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
  const address = Contracts.nonfungiblePositionManagerV3[chainId]
  const npmContract = getNonfungiblePositionManagerContractV3(chainId)
  const balance = await readCall(npmContract, 'balanceOf', [account], chainId)

  if (!balance) return []
  const tokenRequests = []
  for (let i = 0; i < balance; i++) {
    tokenRequests.push(i)
  }

  const tokenIds = await callMulti(
    tokenRequests.map(id => ({
      address,
      abi: algebraAbiV3,
      functionName: 'tokenOfOwnerByIndex',
      args: [account, id],
      chainId,
    })),
  )
  const positions = await callMulti(
    tokenIds.map(id => ({
      address,
      abi: algebraAbiV3,
      functionName: 'positions',
      args: [id],
      chainId,
    })),
  )

  /**
   * @property {uint88} nonce
   * @property {string} operator - Operator address
   * @property {string} token0 - Token0 address
   * @property {string} token1 - Token1 address
   * @property {string} deployer - Deployer address
   * @property {int24} tickLower - Lower tick value
   * @property {int24} tickUpper - Upper tick value
   * @property {uint128} liquidity - Liquidity value
   * @property {uint256} feeGrowthInside0LastX128 - Fee growth inside for token0
   * @property {uint256} feeGrowthInside1LastX128 - Fee growth inside for token1
   * @property {uint128} tokensOwed0 - Tokens owed for token0
   * @property {uint128} tokensOwed1 - Tokens owed for token1
   */
  return positions.map((ele, idx) => ({
    version: 3,
    tokenId: Number(tokenIds[idx]),
    token0Address: ele[2],
    token1Address: ele[3],
    tickLower: Number(ele[5]),
    tickUpper: Number(ele[6]),
    liquidity: ele[7],
  }))
}

const ManualsContext = createContext(initialState)

function ManualsContextProvider({ children }) {
  const assets = useAssets()

  const { networkId } = useChainSettings()
  const customAssets = useCustomAssets()
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
    if (!assets || !assets.length) {
      return {
        mutateManual: () => {
          mutateV3()
          mutateV2()
        },
        positions: [],
      }
    }

    const positions = [...positionV2, ...positionV3].map(ele => {
      const asset0 = getTokenInfo({ tokenAddress: ele.token0Address, assets, customAssets })
      const asset1 = getTokenInfo({ tokenAddress: ele.token1Address, assets, customAssets })

      return {
        ...ele,
        type: 'Manual',
        symbol: `${asset0?.symbol || 'UNKNOWN'}/${asset1?.symbol || 'UNKNOWN'}`,
        asset0,
        asset1,
      }
    })

    return {
      mutateManual: () => {
        mutateV3()
        mutateV2()
      },
      positions,
    }
  }, [assets, customAssets, mutateV2, mutateV3, positionV2, positionV3])

  return <ManualsContext.Provider value={final}>{children}</ManualsContext.Provider>
}

const useManuals = () => {
  const { positions } = useContext(ManualsContext)
  return positions
}

export { ManualsContext, ManualsContextProvider, useManuals }
