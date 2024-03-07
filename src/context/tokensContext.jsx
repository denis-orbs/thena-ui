import React, { createContext, useContext, useMemo } from 'react'
import useSWR from 'swr'
import { ChainId } from 'thena-sdk-core'

import { UNKNOWN_LOGO } from '@/constant'
import { useAssets } from '@/context/assetsContext'
import { fetchTopTokens } from '@/lib/api'
import { useChainSettings } from '@/state/settings/hooks'

const initialState = {
  [ChainId.BSC]: {
    data: [],
    isLoading: false,
  },
  [ChainId.OPBNB]: {
    data: [],
    isLoading: false,
  },
}

const TokensContext = createContext(initialState)

function TokensContextProvider({ children }) {
  const { networkId } = useChainSettings()
  const { data: bscTokens, isLoading: bscLoading } = useSWR(
    networkId === ChainId.BSC ? ['bsc top tokens api', ChainId.BSC] : null,
    { fetcher: fetchTopTokens },
    {
      refreshInterval: 60000,
    },
  )
  const { data: opTokens, isLoading: opLoading } = useSWR(
    networkId === ChainId.OPBNB ? ['op top tokens api', ChainId.OPBNB] : null,
    { fetcher: fetchTopTokens },
    {
      refreshInterval: 60000,
    },
  )

  const assets = useMemo(
    () => ({
      [ChainId.BSC]: { data: bscTokens || [], isLoading: bscLoading },
      [ChainId.OPBNB]: { data: opTokens || [], isLoading: opLoading },
    }),
    [bscTokens, bscLoading, opTokens, opLoading],
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
        const found = assets.find(ele => ele.address === token.address)
        return {
          ...token,
          symbol: token.symbol === 'WBNB' ? 'BNB' : token.symbol,
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
