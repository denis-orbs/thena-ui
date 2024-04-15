import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { maxUint256 } from 'viem'

import { TXN_STATUS } from '@/constant'
import { useAssets } from '@/context/assetsContext'
import { readCall } from '@/lib/contractActions'
import { getERC20Contract, getTcSpotContract, getWBNBContract } from '@/lib/contracts'
import { EVENT_TYPES } from '@/lib/tradingCompetition/utils'
import { fromWei, sleep } from '@/lib/utils'
import useWallet from '@/lib/wallets/useWallet'
import { useTxn } from '@/state/transactions/hooks'

export const useTcSpotContract = address => {
  const { account } = useWallet()
  const claimPrize = useCallback(async () => {
    const tcSpotContract = getTcSpotContract(address)
    await Promise.all([readCall(tcSpotContract, 'claimPrize', [account])])
  }, [address, account])

  const claimOwnerFee = useCallback(async () => {
    const tcSpotContract = getTcSpotContract(address)
    await Promise.all([readCall(tcSpotContract, 'claimOwnerFee', [account])])
  }, [address, account])

  return {
    claimPrize,
    claimOwnerFee,
  }
}

export const useTCContractInfor = (address, eventType) => {
  const [loaded, setLoaded] = useState(false)
  const [isRegistered, setIsRegistered] = useState(false)
  const [isWinner, setIsWinner] = useState(false)
  const [isOwner, setIsOwner] = useState(false)
  const [isClaimable, setIsClaimable] = useState(false)
  const tcSpotContract = getTcSpotContract(address)
  const { account } = useWallet()
  const assets = useAssets()

  const getUserData = useCallback(async () => {
    if (!account || !tcSpotContract) {
      setIsRegistered(false)
      setIsWinner(false)
      setIsOwner(false)
      return
    }

    const [joined, won, ownerAddress] = await Promise.all([
      readCall(tcSpotContract, 'isRegistered', [account]),
      readCall(tcSpotContract, 'isWinner', [account]),
      readCall(tcSpotContract, 'owner', []),
    ])
    setIsRegistered(joined)
    setIsWinner(won[0])
    setIsOwner(ownerAddress.toLowerCase() === account.toLowerCase())

    setLoaded(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, tcSpotContract, eventType, address])

  useEffect(() => {
    const checkClaimable = async () => {
      if (eventType === EVENT_TYPES.ENDED) {
        if ((isRegistered && isWinner) || isOwner) {
          const claimable = await readCall(tcSpotContract, 'claimable', [account])
          const token = assets.find(ele => ele.address.toLowerCase() === claimable[1].toLowerCase())

          if (!token) {
            setIsClaimable(false)
          } else {
            const totalClaimable = fromWei(claimable[0], token.decimals)
            setIsClaimable(!totalClaimable.isZero())
          }
        }
      }
    }
    checkClaimable()
  }, [account, assets, eventType, isOwner, isRegistered, isWinner, tcSpotContract])

  useEffect(() => {
    getUserData()
  }, [getUserData])

  return {
    loaded,
    isRegistered,
    isWinner,
    isOwner,
    isClaimable,
    refetch: getUserData,
  }
}

export const useJoinTC = () => {
  const { startTxn, endTxn, writeTxn } = useTxn()
  const { account, chainId } = useWallet()
  const t = useTranslations()
  const [pending, setPending] = useState(false)

  const joinTC = useCallback(
    async data => {
      const key = uuidv4()
      const approveFeeuuid = uuidv4()
      const approveStartuuid = uuidv4()
      const joinuuid = uuidv4()
      const tcSpotContract = getTcSpotContract(data.tradingCompetitionSpot)

      const feeTokenContract = getERC20Contract(data.prize.token.address, chainId)
      const allowance = await readCall(feeTokenContract, 'allowance', [account, data.tradingCompetitionSpot])
      const isApprovedFee = fromWei(allowance, data.prize.token.decimals).gte(data.entryFee, data.prize.token.decimals)

      const winningTokenContract = getERC20Contract(data.competitionRules.winningToken.address, chainId)
      const allowanceWinningToken = await readCall(winningTokenContract, 'allowance', [
        account,
        data.tradingCompetitionSpot,
      ])
      const isApprovedWinningToken = fromWei(allowanceWinningToken).gte(fromWei(data.competitionRules.startingBalance))

      setPending(true)
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
        const isSuccess = await writeTxn(key, approveFeeuuid, feeTokenContract, 'approve', [
          data.tradingCompetitionSpot,
          maxUint256,
        ])
        if (!isSuccess) {
          setPending(false)
          return false
        }
      }
      if (!isApprovedWinningToken) {
        const isSuccess = await writeTxn(key, approveStartuuid, winningTokenContract, 'approve', [
          data.tradingCompetitionSpot,
          maxUint256,
        ])
        if (!isSuccess) {
          setPending(false)
          return false
        }
      }
      if (fromWei(data.competitionRules.startingBalance).isZero()) {
        const isSuccess = await writeTxn(key, joinuuid, tcSpotContract, 'registerAndDeposit', [0])
        if (!isSuccess) {
          setPending(false)
          return false
        }
      } else {
        const isSuccess = await writeTxn(key, joinuuid, tcSpotContract, 'registerAndDeposit', [
          data.competitionRules.startingBalance,
        ])
        if (!isSuccess) {
          setPending(false)
          return false
        }
      }

      endTxn({
        key,
        final: 'Join TC Successful',
      })
      setPending(false)
      return true
    },
    [account, chainId, endTxn, startTxn, t, writeTxn],
  )

  return {
    pending,
    joinTC,
  }
}

export const useDepositToTC = () => {
  const { startTxn, endTxn, writeTxn } = useTxn()
  const { account, chainId } = useWallet()
  const t = useTranslations()
  const [pending, setPending] = useState(false)

  const deposit = useCallback(
    async data => {
      const key = uuidv4()
      const approveTokenuuid = uuidv4()
      const deposituuid = uuidv4()
      const tcSpotContract = getTcSpotContract(data.tcAddress)

      const needToWrap = data.winningToken.address !== data.token.address && data.winningToken.symbol === 'WBNB'
      let wrapuuid = ''
      let wbnbContract = null
      if (needToWrap) {
        wrapuuid = uuidv4()
        wbnbContract = getWBNBContract(chainId)
      }

      const winningTokenContract = getERC20Contract(data.winningToken.address, chainId)
      const allowance = await readCall(winningTokenContract, 'allowance', [account, data.tcAddress])
      const isApprovedWinningToken = fromWei(allowance).gte(fromWei(data.amount))

      setPending(true)
      startTxn({
        key,
        title: needToWrap ? `${t('Wrap')} ${t('And')} ${t('Deposit')}` : t('Deposit'),
        transactions: {
          ...(needToWrap && {
            [wrapuuid]: {
              desc: t('Wrap'),
              status: TXN_STATUS.START,
              hash: null,
            },
          }),
          ...(!isApprovedWinningToken && {
            [approveTokenuuid]: {
              desc: `${t('Approve')} ${t('Winning Token')}`,
              status: TXN_STATUS.START,
              hash: null,
            },
          }),
          [deposituuid]: {
            desc: t('Deposit'),
            status: TXN_STATUS.START,
            hash: null,
          },
        },
      })

      if (needToWrap) {
        const isSuccess = await writeTxn(key, wrapuuid, wbnbContract, 'deposit', [], data.amount.toFixed(0))
        if (!isSuccess) {
          setPending(false)
          return false
        }

        await sleep(4000)
      }

      if (!isApprovedWinningToken) {
        const isSuccess = await writeTxn(key, approveTokenuuid, winningTokenContract, 'approve', [
          data.tcAddress,
          maxUint256,
        ])
        if (!isSuccess) {
          setPending(false)
          return false
        }
      }

      const isSuccess = await writeTxn(key, deposituuid, tcSpotContract, 'deposit', [data.amount])
      if (!isSuccess) {
        setPending(false)
        return false
      }

      endTxn({
        key,
        final: 'Deposit Successful',
      })
      setPending(false)
      return true
    },
    [account, chainId, endTxn, startTxn, t, writeTxn],
  )

  return { pending, deposit }
}

export const useTradeData = (TCAddress, winningTokenAddress) => {
  const { account } = useWallet()

  const [balance, setBalance] = useState(0n)
  const [userBalance, setUserBalance] = useState()
  const [pnl, setPNL] = useState(0n)

  const fetchData = useCallback(async () => {
    if (!account || !TCAddress || !winningTokenAddress) {
      setUserBalance([])
      return
    }

    const tcSpotContract = getTcSpotContract(TCAddress)

    const [pnlRes, balanceRes] = await Promise.all([
      readCall(tcSpotContract, 'getPNLOf', [account]),
      readCall(tcSpotContract, 'userBalance', [account]),
    ])

    if (pnlRes) {
      setPNL(pnlRes)
    }

    if (balanceRes) {
      const find = balanceRes[1].findIndex(item => item.toLowerCase() === winningTokenAddress.toLowerCase())
      const value = find !== -1 ? balanceRes[0][find] : 0n
      setUserBalance(balanceRes)
      setBalance(value)
    }
  }, [TCAddress, account, winningTokenAddress])

  useEffect(() => {
    const interval = setInterval(() => {
      fetchData()
    }, 30000)

    fetchData()
    return () => clearInterval(interval)
  }, [fetchData])

  return {
    pnl,
    balance,
    reload: fetchData,
    userBalance,
  }
}

export const useClaimTC = () => {
  const { startTxn, endTxn, writeTxn } = useTxn()
  const { account } = useWallet()
  const t = useTranslations()
  const [loading, setLoading] = useState(false)

  const claimReward = useCallback(
    async ({ tcAddress, isOwner }) => {
      const key = uuidv4()
      const claimuuid = uuidv4()
      const tcSpotContract = getTcSpotContract(tcAddress)

      setLoading(true)
      startTxn({
        key,
        title: isOwner ? t('Claim Owner Fee') : t('Claim Rewards'),
        transactions: {
          [claimuuid]: {
            desc: isOwner ? t('Claim Owner Fee') : t('Claim Rewards'),
            status: TXN_STATUS.START,
            hash: null,
          },
        },
      })

      const isSuccess = await writeTxn(key, claimuuid, tcSpotContract, isOwner ? 'claimOwnerFee' : 'claimPrize', [
        account,
      ])
      if (!isSuccess) {
        setLoading(false)
        return false
      }
      endTxn({
        key,
        final: 'Claim Successful',
      })
      setLoading(false)
      return true
    },
    [account, endTxn, startTxn, t, writeTxn],
  )

  return { loading, claimReward }
}
