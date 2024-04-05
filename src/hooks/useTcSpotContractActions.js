import { useTranslations } from 'next-intl'
import { useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { maxUint256 } from 'viem'

import { TXN_STATUS } from '@/constant'
import { useAssets } from '@/context/assetsContext'
import { readCall } from '@/lib/contractActions'
import { getERC20Contract, getTcSpotContract } from '@/lib/contracts'
import { fromWei } from '@/lib/utils'
import useWallet from '@/lib/wallets/useWallet'
import { useTxn } from '@/state/transactions/hooks'

export const useTcSpotContractActions = address => {
  const { startTxn, endTxn, writeTxn } = useTxn()
  const { account, chainId } = useWallet()
  const t = useTranslations()
  const assets = useAssets()

  const checkUserClaimable = useCallback(async () => {
    if (!account) {
      return false
    }
    const tcSpotContract = getTcSpotContract(address)
    const [checkJoined, checkWinner, checkClaimable, checkOwnerAddress] = await Promise.all([
      readCall(tcSpotContract, 'isRegistered', [account]),
      readCall(tcSpotContract, 'isWinner', [account]),
      readCall(tcSpotContract, 'claimable', [account]),
      readCall(tcSpotContract, 'owner', []),
    ])

    const token = assets.find(ele => ele.address.toLowerCase() === checkClaimable[1].toLowerCase())

    if (!token) {
      return false
    }

    const totalClaimable = fromWei(checkClaimable[0], token.decimals)
    return (
      (checkJoined && checkWinner[0]) ||
      (account.toLowerCase() === checkOwnerAddress.toLowerCase() && !totalClaimable.isZero())
    )
  }, [account, address, assets])

  const claimPrize = useCallback(async () => {
    const tcSpotContract = getTcSpotContract(address)
    await Promise.all([readCall(tcSpotContract, 'claimPrize', [account])])
  }, [address, account])

  const claimOwnerFee = useCallback(async () => {
    const tcSpotContract = getTcSpotContract(address)
    await Promise.all([readCall(tcSpotContract, 'claimOwnerFee', [account])])
  }, [address, account])

  const joinTC = useCallback(
    async data => {
      const key = uuidv4()
      const approveFeeuuid = uuidv4()
      const approveStartuuid = uuidv4()
      const joinuuid = uuidv4()
      const tcSpotContract = getTcSpotContract(address)

      const feeTokenContract = getERC20Contract(data.prize.token.address, chainId)
      const allowance = await readCall(feeTokenContract, 'allowance', [account, address])
      const isApprovedFee = fromWei(allowance, data.prize.token.decimals).gte(data.entryFee, data.prize.token.decimals)

      const winningTokenContract = getERC20Contract(data.competitionRules.winningToken.address, chainId)
      const allowanceWinningToken = await readCall(winningTokenContract, 'allowance', [account, address])
      const isApprovedWinningToken = fromWei(allowanceWinningToken).gte(fromWei(data.competitionRules.startingBalance))

      startTxn({
        key,
        title: t('Join Competition'),
        transactions: {
          ...(!isApprovedFee && {
            [approveFeeuuid]: {
              desc: `${t('Approve')} ${t('Fee')}`,
              status: TXN_STATUS.START,
              hash: null,
            },
          }),
          ...(!isApprovedWinningToken && {
            [approveStartuuid]: {
              desc: `${t('Approve')} ${t('Winning Token')}`,
              status: TXN_STATUS.START,
              hash: null,
            },
          }),
          [joinuuid]: {
            desc: t('Join Competition'),
            status: TXN_STATUS.START,
            hash: null,
          },
        },
      })

      if (!isApprovedFee) {
        const isSuccess = await writeTxn(key, approveFeeuuid, feeTokenContract, 'approve', [address, maxUint256])
        if (!isSuccess) {
          return false
        }
      }
      if (!isApprovedWinningToken) {
        const isSuccess = await writeTxn(key, approveStartuuid, winningTokenContract, 'approve', [address, maxUint256])
        if (!isSuccess) {
          return false
        }
      }
      if (fromWei(data.competitionRules.startingBalance).isZero()) {
        const isSuccess = await writeTxn(key, joinuuid, tcSpotContract, 'register', [])
        if (!isSuccess) {
          return false
        }
      } else {
        const isSuccess = await writeTxn(key, joinuuid, tcSpotContract, 'registerAndDeposit', [
          data.competitionRules.startingBalance,
        ])
        if (!isSuccess) {
          return false
        }
      }

      endTxn({
        key,
        final: 'Join TC Successful',
      })
      return true
    },
    [account, address, chainId, endTxn, startTxn, t, writeTxn],
  )

  return {
    checkUserClaimable,
    claimPrize,
    claimOwnerFee,
    joinTC,
  }
}
