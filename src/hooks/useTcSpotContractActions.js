import { useCallback } from 'react'

import { useAssets } from '@/context/assetsContext'
import { readCall } from '@/lib/contractActions'
import { getTcSpotContract } from '@/lib/contracts'
import { fromWei } from '@/lib/utils'
import useWallet from '@/lib/wallets/useWallet'

export const useTcSpotContractActions = address => {
  const { account } = useWallet()
  const assets = useAssets()

  const checkUserClaimable = useCallback(async () => {
    if (!account) {
      return false
    }
    const tcSpotContract = getTcSpotContract(address)
    const [checkJoined, checkWinner, checkClaimable] = await Promise.all([
      readCall(tcSpotContract, 'isRegistered', [account]),
      readCall(tcSpotContract, 'isWinner', [account]),
      readCall(tcSpotContract, 'claimable', [account]),
    ])

    const token = assets.find(ele => ele.address.toLowerCase() === checkClaimable[1].toLowerCase())

    if (!token) {
      return false
    }

    const totalClaimable = fromWei(checkClaimable[0], token.decimals)
    return checkJoined && checkWinner[0] && !totalClaimable.isZero
  }, [account, address, assets])

  const claimPrize = useCallback(async () => {
    const tcSpotContract = getTcSpotContract(address)
    await Promise.all([readCall(tcSpotContract, 'claimPrize', [account])])
  }, [address, account])

  const claimOwnerFee = useCallback(async () => {
    const tcSpotContract = getTcSpotContract(address)
    await Promise.all([readCall(tcSpotContract, 'claimOwnerFee', [account])])
  }, [address, account])

  return {
    checkUserClaimable,
    claimPrize,
    claimOwnerFee,
  }
}
