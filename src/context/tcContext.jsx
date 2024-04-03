import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

import { readCall } from '@/lib/contractActions'
import { getTCContract } from '@/lib/contracts'
import useWallet from '@/lib/wallets/useWallet'

import { useAssets } from './assetsContext'

const initialState = {
  isAllowed: false,
  protocolFee: 0,
  protocolFeeToken: '',
  tradingTokens: [],
}

const TCContext = createContext(initialState)

function TCContextProvider({ children }) {
  const { account } = useWallet()
  const assets = useAssets()
  // const { networkId } = useChainSettings()
  const [protocolFee, setProtocolFee] = useState()
  const [protocolFeeToken, setProtocolFeeToken] = useState(false)
  const [tradingTokens, setTradingTokens] = useState([])
  const [isAllowed, setIsAllowed] = useState(false)

  useEffect(() => {
    const fetchTotalInfo = async () => {
      const tcManagerContract = getTCContract()
      const [res0, res1, res2, res3, res4] = await Promise.all([
        readCall(tcManagerContract, 'isPermissionless', []),
        readCall(tcManagerContract, 'protocol_fee', []),
        readCall(tcManagerContract, 'protocol_fee_token', []),
        readCall(tcManagerContract, 'tradingTokens', []),
        readCall(tcManagerContract, 'isAllowedCreator', [account]),
      ])
      const tradeAssets = assets.filter(ele => res3.map(sub => sub.toLowerCase()).includes(ele.address))
      const feeToken = assets.find(ele => ele.address.toLowerCase() === res2.toLowerCase())
      setProtocolFee(res1)
      setProtocolFeeToken(feeToken)
      setTradingTokens(tradeAssets)
      setIsAllowed(res0 || res4)
    }

    if (account && assets.length > 0) {
      if (tradingTokens.length === 0) {
        fetchTotalInfo()
      } else {
        const tradingTokenAddresses = tradingTokens.map(sub => sub.address?.toLowerCase())
        const tradeAssets = assets.filter(ele => tradingTokenAddresses.includes(ele.address))
        setTradingTokens(tradeAssets)
        if (protocolFeeToken) {
          const feeToken = assets.find(ele => ele.address.toLowerCase() === protocolFeeToken.address?.toLowerCase())
          setProtocolFeeToken(feeToken)
        }
      }
    } else if (!account) {
      setIsAllowed(false)
    }

    if (account && assets.length > 0 && tradingTokens.length === 0) {
      fetchTotalInfo()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, assets])

  const value = useMemo(
    () => ({
      protocolFee,
      protocolFeeToken,
      isAllowed,
      tradingTokens,
    }),
    [protocolFee, protocolFeeToken, isAllowed, tradingTokens],
  )

  return <TCContext.Provider value={value}>{children}</TCContext.Provider>
}

const useTC = () => {
  const values = useContext(TCContext)
  return values
}

export { TCContext, TCContextProvider, useTC }
