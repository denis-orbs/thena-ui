import React, { createContext, useContext, useMemo } from 'react'
import useSWR from 'swr'

import { UNKNOWN_LOGO } from '@/constant'
import { CHAIN_ID } from '@/constant/contracts'
import { useAssets } from '@/context/assetsContext'
import { fetchTopTokens } from '@/lib/api'
import { useChainSettings } from '@/state/settings/hooks'

const initialState = {
  [CHAIN_ID.BSC]: {
    data: [],
    isLoading: false,
  },
  [CHAIN_ID.OPBNB]: {
    data: [],
    isLoading: false,
  },
}

const TokensContext = createContext(initialState)

function TokensContextProvider({ children }) {
  const { networkId } = useChainSettings()
  const { data: bscTokens, isLoading: bscLoading } = useSWR(
    networkId === CHAIN_ID.BSC ? ['bsc top tokens api', CHAIN_ID.BSC] : null,
    { fetcher: fetchTopTokens },
    {
      refreshInterval: 60000,
    },
  )
  const { data: opTokens, isLoading: opLoading } = useSWR(
    networkId === CHAIN_ID.OPBNB ? ['op top tokens api', CHAIN_ID.OPBNB] : null,
    { fetcher: fetchTopTokens },
    {
      refreshInterval: 60000,
    },
  )

  const { data: testTokens, isLoading: testnetLoading } = useSWR(
    networkId === CHAIN_ID.TEST_BSC ? ['testnet tokens api', CHAIN_ID.TEST_BSC] : null,
    { fetcher: fetchTopTokens },
    {
      refreshInterval: 60000,
    },
  )

  const assets = useMemo(
    () => ({
      [CHAIN_ID.BSC]: { data: bscTokens || [], isLoading: bscLoading },
      [CHAIN_ID.OPBNB]: { data: opTokens || [], isLoading: opLoading },
      [CHAIN_ID.TEST_BSC]: { data: testTokens || [], isLoading: testnetLoading },
    }),
    [bscTokens, bscLoading, opTokens, opLoading, testTokens, testnetLoading],
  )

  return <TokensContext.Provider value={assets}>{children}</TokensContext.Provider>
}

const useTokens = () => {
  const { networkId } = useChainSettings()
  const tokens = useContext(TokensContext)
  const assets = useAssets()

  return useMemo(() => {
    const { data, isLoading } = tokens[networkId]
    if (!assets.length || !data) {
      return {
        pairs: [],
        isLoading,
      }
    }
    const result = data
      .sort((a, b) => b.volume - a.volume)
      .map(token => {
        const found = assets.find(ele => ele.address.toLowerCase() === token.address)
        return {
          ...token,
          symbol: token.symbol === 'WBNB' ? 'BNB' : found ? found.symbol : token.symbol,
          name: found?.name || 'UNKNOWN',
          logoURI: found?.logoURI || UNKNOWN_LOGO,
        }
      })
    return {
      tokens: result,
      isLoading,
    }
  }, [tokens, assets, networkId])
}

export { TokensContextProvider, useTokens }
