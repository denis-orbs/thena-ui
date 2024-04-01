import { useEffect, useState } from 'react'

import { useAssets } from '@/context/assetsContext'
import { readCall } from '@/lib/contractActions'
import { getTCContract } from '@/lib/contracts'
import useWallet from '@/lib/wallets/useWallet'

export const useTCManagerInfo = () => {
  const [tradingTokens, setTradingTokens] = useState([])
  const [isAllowed, setIsAllowed] = useState(false)
  const { account } = useWallet()
  const assets = useAssets()

  useEffect(() => {
    const fetchTotalInfo = async () => {
      const tcManagerContract = getTCContract()
      const [res0, res3, res4] = await Promise.all([
        readCall(tcManagerContract, 'isPermissionless', []),
        // tcManagerContract.methods.protocol_fee().call(),
        // tcManagerContract.methods.protocol_fee_token().call(),
        readCall(tcManagerContract, 'tradingTokens', []),
        readCall(tcManagerContract, 'isAllowedCreator', [account]),
      ])
      const tradeAssets = assets.filter(ele => res3.map(sub => sub.toLowerCase()).includes(ele.address))
      setTradingTokens(tradeAssets)
      setIsAllowed(res0 || res4)
    }

    if (account && assets.length > 0 && tradingTokens.length === 0) {
      fetchTotalInfo()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, assets])

  return { isAllowed, tradingTokens }
}
