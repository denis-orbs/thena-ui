import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

import useWallet from '@/hooks/useWallet'
import { readCall } from '@/lib/contractActions'
import { getTCContract, getTCPerpetualManagerContract } from '@/lib/contracts'

import { useAssets } from './assetsContext'

const initialState = {
  isAllowed: false,
  protocolFee: 0,
  protocolFeeToken: '',
  tradingTokens: [],
  prizeTokens: [],
  pairLists: [],
  isAllowedPerpetual: false,
  protocolFeePerpetual: 0,
  protocolFeeTokenPerpetual: '',
}

const TCContext = createContext(initialState)

function TCContextProvider({ children }) {
  const { account } = useWallet()
  const assets = useAssets()
  // const { networkId } = useChainSettings()
  const [protocolFee, setProtocolFee] = useState()
  const [protocolFeeToken, setProtocolFeeToken] = useState(false)
  const [tradingTokens, setTradingTokens] = useState([])
  const [prizeTokens, setPrizeTokens] = useState([])
  const [pairLists, setPairLists] = useState([])
  const [isAllowed, setIsAllowed] = useState(false)
  const [isAllowedPerpetual, setIsAllowedPerpetual] = useState(false)
  const [protocolFeePerpetual, setProtocolFeePerpetual] = useState()
  const [protocolFeeTokenPerpetual, setProtocolFeeTokenPerpetual] = useState(false)

  useEffect(() => {
    const fetchTotalInfo = async () => {
      const tcManagerContract = getTCContract()
      const tcPerpetualManagerContract = getTCPerpetualManagerContract()
      const [res0, res1, res2, res3, res4, res5, res6, res7, res8] = await Promise.all([
        readCall(tcManagerContract, 'isPermissionless', []),
        readCall(tcManagerContract, 'protocol_fee', []),
        readCall(tcManagerContract, 'protocol_fee_token', []),
        readCall(tcManagerContract, 'tradingTokens', []),
        readCall(tcManagerContract, 'isAllowedCreator', [account]),
        readCall(tcPerpetualManagerContract, 'protocol_fee', []),
        readCall(tcPerpetualManagerContract, 'protocol_fee_token', []),
        readCall(tcPerpetualManagerContract, 'pairs', []),
        readCall(tcPerpetualManagerContract, 'prizeTokens', []),
      ])
      const tradeAssets = assets.filter(ele => res3.map(sub => sub.toLowerCase()).includes(ele.address))
      const prizeAssets = assets.filter(ele => res8.map(sub => sub.toLowerCase()).includes(ele.address))
      const feeToken = assets.find(ele => ele.address.toLowerCase() === res2.toLowerCase())
      const feeTokenPerpetual = assets.find(ele => ele.address.toLowerCase() === res6.toLowerCase())
      setProtocolFee(res1)
      setProtocolFeeToken(feeToken)
      setTradingTokens(tradeAssets)
      setPrizeTokens(prizeAssets)
      setIsAllowed(res0 || res4)
      setProtocolFeePerpetual(res5)
      setProtocolFeeTokenPerpetual(feeTokenPerpetual)
      setPairLists(res7)
    }

    const checkIsAllowed = async () => {
      const tcManagerContract = getTCContract()
      const [res0, res4] = await Promise.all([
        readCall(tcManagerContract, 'isPermissionless', []),
        readCall(tcManagerContract, 'isAllowedCreator', [account]),
      ])
      setIsAllowed(res0 || res4)
    }

    const checkIsAllowedPerpetual = async () => {
      const tcPerpetualManagerContract = getTCPerpetualManagerContract()
      const [res0, res4] = await Promise.all([
        readCall(tcPerpetualManagerContract, 'isPermissionless', []),
        readCall(tcPerpetualManagerContract, 'isAllowedCreator', [account]),
      ])

      setIsAllowedPerpetual(res0 || res4)
    }

    const checkForGuest = async () => {
      const tcManagerContract = getTCContract()
      const tcPerpetualManagerContract = getTCPerpetualManagerContract()
      const [res0, res1, res2, res3, res4, res5, res6, res7] = await Promise.all([
        readCall(tcManagerContract, 'isPermissionless', []),
        readCall(tcManagerContract, 'protocol_fee', []),
        readCall(tcManagerContract, 'protocol_fee_token', []),
        readCall(tcPerpetualManagerContract, 'prizeTokens', []),
        readCall(tcPerpetualManagerContract, 'isPermissionless', []),
        readCall(tcPerpetualManagerContract, 'protocol_fee', []),
        readCall(tcPerpetualManagerContract, 'protocol_fee_token', []),
        readCall(tcPerpetualManagerContract, 'pairs', []),
      ])
      const tradeAssets = assets.filter(ele => res3.map(sub => sub.toLowerCase()).includes(ele.address))
      const feeToken = assets.find(ele => ele.address.toLowerCase() === res2.toLowerCase())
      const feeTokenPerpetual = assets.find(ele => ele.address.toLowerCase() === res6.toLowerCase())
      setProtocolFee(res1)
      setProtocolFeeToken(feeToken)
      setTradingTokens(tradeAssets)
      setIsAllowed(res0)
      setIsAllowedPerpetual(res4)
      setProtocolFeePerpetual(res5)
      setProtocolFeeTokenPerpetual(feeTokenPerpetual)
      setPairLists(res7)
    }

    const updatePrizeTokens = async () => {
      const tcPerpetualManagerContract = getTCPerpetualManagerContract()
      const res = await readCall(tcPerpetualManagerContract, 'prizeTokens', [])
      const prizeAssets = assets.filter(ele => res.map(sub => sub.toLowerCase()).includes(ele.address))
      setPrizeTokens(prizeAssets)
    }

    if (account && assets.length > 0) {
      if (tradingTokens.length === 0) {
        fetchTotalInfo()
      } else {
        if (!isAllowed) {
          checkIsAllowed()
        }
        if (!isAllowedPerpetual) {
          checkIsAllowedPerpetual()
        }
        const tradingTokenAddresses = tradingTokens.map(sub => sub.address?.toLowerCase())
        const tradeAssets = assets.filter(ele => tradingTokenAddresses.includes(ele.address))
        setTradingTokens(tradeAssets)
        if (protocolFeeToken) {
          const feeToken = assets.find(ele => ele.address.toLowerCase() === protocolFeeToken.address?.toLowerCase())
          setProtocolFeeToken(feeToken)
        }
        if (protocolFeeTokenPerpetual) {
          const feeTokenPerpetual = assets.find(
            ele => ele.address.toLowerCase() === protocolFeeTokenPerpetual.address?.toLowerCase(),
          )
          setProtocolFeeToken(feeTokenPerpetual)
        }
        updatePrizeTokens()
      }
    } else if (!account) {
      checkForGuest()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, assets])

  const value = useMemo(
    () => ({
      protocolFee,
      protocolFeeToken,
      isAllowed,
      tradingTokens,
      prizeTokens,
      isAllowedPerpetual,
      protocolFeePerpetual,
      protocolFeeTokenPerpetual,
      pairLists,
    }),
    [
      protocolFee,
      protocolFeeToken,
      isAllowed,
      tradingTokens,
      prizeTokens,
      isAllowedPerpetual,
      protocolFeePerpetual,
      protocolFeeTokenPerpetual,
      pairLists,
    ],
  )

  return <TCContext.Provider value={value}>{children}</TCContext.Provider>
}

const useTC = () => {
  const values = useContext(TCContext)
  return values
}

export { TCContext, TCContextProvider, useTC }
