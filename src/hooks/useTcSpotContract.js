import BigNumber from 'bignumber.js'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { maxUint256 } from 'viem'

import { TC_MARKET_TYPES, TXN_STATUS } from '@/constant'
import { useAssets } from '@/context/assetsContext'
import { readCall } from '@/lib/contractActions'
import { getERC20Contract, getOldTcSpotContract, getTcSpotContract, getWBNBContract } from '@/lib/contracts'
import { EVENT_TYPES } from '@/lib/tradingCompetition/utils'
import { fromWei, isInvalidAmount, sleep } from '@/lib/utils'
import useWallet from '@/lib/wallets/useWallet'
import { useTxn } from '@/state/transactions/hooks'

const MAX_RETRIES = 3

export const useTCContractInfor = (address, eventType, participantCount, type = TC_MARKET_TYPES.SPOT) => {
  const [loaded, setLoaded] = useState(false)
  const [isRegistered, setIsRegistered] = useState(false)
  const [isWinner, setIsWinner] = useState(false)
  const [isOwner, setIsOwner] = useState(false)
  const [isClaimable, setIsClaimable] = useState(undefined)
  const [isWithdrawable, setIsWithdrawable] = useState(undefined)

  const [retries, setRetries] = useState(0)
  const [withdrawRetries, setWithdrawRetries] = useState(0)

  const tcSpotContract = getTcSpotContract(address)
  const { account } = useWallet()
  const assets = useAssets()

  const getUserData = useCallback(async () => {
    setLoaded(false)

    if (address) {
      if (!account || !tcSpotContract || type !== TC_MARKET_TYPES.SPOT) {
        setIsRegistered(false)
        setIsWinner(false)
        setIsOwner(false)
        setLoaded(true)

        return
      }

      const [joined, ownerAddress] = await Promise.allSettled([
        readCall(tcSpotContract, 'isRegistered', [account]),
        readCall(tcSpotContract, 'owner', []),
      ])

      if (joined && joined.status === 'fulfilled') {
        setIsRegistered(joined.value)
      }

      if (eventType === EVENT_TYPES.ENDED) {
        Promise.resolve(readCall(tcSpotContract, 'isWinner', [account])).then(value => {
          setIsWinner(value[0])
        })
      }

      if (ownerAddress && ownerAddress.status === 'fulfilled') {
        setIsOwner(ownerAddress.value.toLowerCase() === account.toLowerCase())
      }

      setLoaded(true)
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, eventType, address, type])

  const getParticipantList = useCallback(async () => {
    if (participantCount) {
      const result = await Promise.all(
        Array.from({ length: participantCount }).map(async (_, index) => {
          try {
            return await readCall(tcSpotContract, 'winnersList', [index])
          } catch (error) {
            return undefined
          }
        }),
      )
      return result
    }
    return []
  }, [tcSpotContract, participantCount])

  const checkClaimable = useCallback(
    async (force = false) => {
      if (type === TC_MARKET_TYPES.SPOT) {
        if ((eventType === EVENT_TYPES.ENDED && isClaimable === undefined) || force) {
          try {
            if (isRegistered && isWinner) {
              const winnersList = await getParticipantList()
              const claimable = await readCall(tcSpotContract, 'claimable', [account])
              const isClaimed =
                winnersList.length &&
                winnersList.some(claimed => claimed && claimed.toLowerCase() === account.toLowerCase())
              const token = assets.find(ele => ele.address.toLowerCase() === claimable[1].toLowerCase())
              if (!token || isClaimed) {
                setIsClaimable(false)
              } else {
                const totalClaimable = fromWei(claimable[0], token.decimals)
                setIsClaimable(!totalClaimable.isZero())
              }
            }
            if (isOwner) {
              const [ownerClaimed, feeAmount] = await Promise.all([
                readCall(tcSpotContract, 'ownerHasClaimed', [account]),
                readCall(tcSpotContract, 'ownerFeeAmount', []),
              ])

              if (ownerClaimed) {
                setIsClaimable(false)
              } else {
                setIsClaimable(!fromWei(feeAmount).isZero())
              }
            }
          } catch (error) {
            if (retries === MAX_RETRIES) {
              setIsClaimable(false)
            } else {
              setRetries(retries + 1)
            }
          }
        }
      }
    },
    [
      account,
      assets,
      eventType,
      getParticipantList,
      isClaimable,
      isOwner,
      isRegistered,
      isWinner,
      retries,
      tcSpotContract,
      type,
    ],
  )

  const checkWithdrawable = useCallback(
    async (force = false) => {
      if (type === TC_MARKET_TYPES.SPOT) {
        if ((eventType === EVENT_TYPES.ENDED && isWithdrawable === undefined) || force) {
          try {
            if (isRegistered) {
              const userBalanceRes = await readCall(tcSpotContract, 'userBalance', [account])
              const userBalance = userBalanceRes[0]
              const hasBalance = Array.isArray(userBalance) && userBalance.some(item => new BigNumber(item).gt(0))
              setIsWithdrawable(hasBalance)
            }
          } catch (error) {
            if (withdrawRetries === MAX_RETRIES) {
              setIsWithdrawable(false)
            } else {
              setWithdrawRetries(withdrawRetries + 1)
            }
          }
        }
      }
    },
    [type, eventType, isWithdrawable, isRegistered, tcSpotContract, account, withdrawRetries],
  )

  useEffect(() => {
    checkClaimable()
  }, [checkClaimable])

  useEffect(() => {
    checkWithdrawable()
  }, [checkWithdrawable])

  useEffect(() => {
    getUserData()
  }, [getUserData])

  useEffect(() => {
    if (account && address) {
      setRetries(0)
      setWithdrawRetries(0)
      setIsClaimable(undefined)
    }
  }, [account, address])

  return {
    loaded,
    isRegistered,
    isWinner,
    isOwner,
    isClaimable,
    isWithdrawable,
    setIsClaimable,
    refetch: getUserData,
    checkClaimable,
    checkWithdrawable,
  }
}

export const useJoinTC = () => {
  const { startTxn, endTxn, writeTxn, closeTxnModal } = useTxn()
  const { account, chainId } = useWallet()
  const t = useTranslations()
  const [pending, setPending] = useState(false)

  const joinTC = useCallback(
    async data => {
      const key = uuidv4()
      const joinuuid = uuidv4()
      const tcSpotContract = getTcSpotContract(data.tradingCompetitionSpot)
      const winningTokenContract = getERC20Contract(data.competitionRules.winningToken.address, chainId)

      const tokens = {
        [data.competitionRules.winningToken.address]: {
          amount: fromWei(data.competitionRules.startingBalance),
          decimals: 18,
          symbol: data.competitionRules.winningToken.symbol,
          contract: winningTokenContract,
        },
      }
      const transactions = {}

      for (let i = 0; i < data.entryFeeUpdate.length; i++) {
        if (!isInvalidAmount(data.entryFeeUpdate[i])) {
          if (tokens[data.prizeUpdate.token[i].address]) {
            const feeAmount = fromWei(data.entryFeeUpdate[i], data.prizeUpdate.token[i].decimals).plus(
              tokens[data.prizeUpdate.token[i].address].amount,
            )
            tokens[data.prizeUpdate.token[i].address].amount = feeAmount
          } else {
            const feeTokenContract = getERC20Contract(data.prizeUpdate.token[i].address, chainId)
            tokens[data.prizeUpdate.token[i].address] = {
              amount: fromWei(data.entryFeeUpdate[i], data.prizeUpdate.token[i].decimals),
              decimals: data.prizeUpdate.token[i].decimals,
              symbol: data.prizeUpdate.token[i].symbol,
              contract: feeTokenContract,
            }
          }
        }
      }

      for (let i = 0; i < Object.keys(tokens).length; i++) {
        const address = Object.keys(tokens)[i]
        const approveFeeuuid = uuidv4()
        const allowance = await readCall(tokens[address].contract, 'allowance', [account, data.tradingCompetitionSpot])

        const isApprovedFee = fromWei(allowance, tokens[address].decimals).gte(
          tokens[address].amount,
          tokens[address].decimals,
        )

        if (!isApprovedFee) {
          tokens[address].id = approveFeeuuid
          transactions[approveFeeuuid] = {
            desc: `${t('Approve')} ${tokens[address].symbol}`,
            status: TXN_STATUS.START,
            hash: null,
          }
        }
      }
      transactions[joinuuid] = {
        desc: t('Join Competition'),
        status: TXN_STATUS.START,
        hash: null,
      }
      setPending(true)
      startTxn({
        key,
        title: t('Join Competition'),
        transactions,
      })
      for (let i = 0; i < Object.keys(tokens).length; i++) {
        const address = Object.keys(tokens)[i]
        if (tokens[address].id) {
          const isSuccess = await writeTxn(key, tokens[address].id, tokens[address].contract, 'approve', [
            data.tradingCompetitionSpot,
            maxUint256,
          ])

          if (!isSuccess) {
            setPending(false)
            return false
          }
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
      closeTxnModal()
      return true
    },
    [account, chainId, closeTxnModal, endTxn, startTxn, t, writeTxn],
  )

  return {
    pending,
    joinTC,
  }
}

export const useDepositToTC = () => {
  const { startTxn, endTxn, writeTxn, closeTxn } = useTxn()
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
        closeTxn()
        return false
      }

      endTxn({
        key,
        final: 'Deposit Successful',
      })
      setPending(false)
      return true
    },
    [account, chainId, closeTxn, endTxn, startTxn, t, writeTxn],
  )

  return { pending, deposit }
}

export const useTradeData = (TCAddress, winningTokenAddress, reloadFetch = 0) => {
  const { account } = useWallet()

  const [balance, setBalance] = useState(0n)
  const [userBalance, setUserBalance] = useState()
  const [pnl, setPNL] = useState(0n)
  const [winAmount, setWinAmount] = useState(null)

  const fetchData = useCallback(async () => {
    try {
      if (!account || !TCAddress || !winningTokenAddress) {
        setUserBalance([])
        return
      }

      const tcSpotContract = getTcSpotContract(TCAddress)
      const oldTcSpotContract = getOldTcSpotContract(TCAddress)

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

      Promise.resolve(readCall(tcSpotContract, 'claimable', [account]))
        .then(value => {
          setWinAmount(value[0])
        })
        .catch(() => {
          Promise.resolve(readCall(oldTcSpotContract, 'claimable', [account])).then(value => {
            setWinAmount(value[0])
          })
        })
    } catch (error) {
      console.log(error)
    }
  }, [TCAddress, account, winningTokenAddress])

  useEffect(() => {
    const interval = setInterval(() => {
      fetchData()
    }, 30000)

    fetchData()
    return () => clearInterval(interval)
  }, [fetchData, reloadFetch])

  return {
    pnl,
    balance,
    reload: fetchData,
    userBalance,
    winAmount,
  }
}

export const useClaimTC = () => {
  const { startTxn, endTxn, writeTxn, closeTxnModal, closeTxn } = useTxn()
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
        closeTxn()
        return false
      }
      endTxn({
        key,
        final: 'Claim Successful',
      })
      setLoading(false)
      closeTxnModal()
      return true
    },
    [account, endTxn, startTxn, t, writeTxn, closeTxnModal, closeTxn],
  )

  return { loading, claimReward }
}

export const useWithdrawDepositTC = () => {
  const { startTxn, endTxn, writeTxn, closeTxnModal, closeTxn } = useTxn()
  const t = useTranslations()
  const [loading, setLoading] = useState(false)

  const withdrawDeposit = useCallback(
    async ({ tcAddress }) => {
      const key = uuidv4()
      const withdrawuuid = uuidv4()
      const tcSpotContract = getTcSpotContract(tcAddress)

      setLoading(true)
      startTxn({
        key,
        title: t('Withdraw Deposit'),
        transactions: {
          [withdrawuuid]: {
            desc: t('Withdraw Deposit'),
            status: TXN_STATUS.START,
            hash: null,
          },
        },
      })

      const isSuccess = await writeTxn(key, withdrawuuid, tcSpotContract, 'withdrawAllFunds')
      if (!isSuccess) {
        setLoading(false)
        closeTxn()
        return false
      }
      endTxn({
        key,
        final: 'Withdraw Successful',
      })
      setLoading(false)
      closeTxnModal()
      return true
    },
    [endTxn, startTxn, t, writeTxn, closeTxnModal, closeTxn],
  )

  return { loading, withdrawDeposit }
}

export const useIncreaseTCSpotPrize = () => {
  const { startTxn, endTxn, writeTxn, closeTxn } = useTxn()
  const { account, chainId } = useWallet()
  const t = useTranslations()
  const [pending, setPending] = useState(false)

  const increasePrize = useCallback(
    async (tcAddress, tokenAddress, amount) => {
      const key = uuidv4()
      const approveTokenuuid = uuidv4()
      const increasePrizeuuid = uuidv4()
      const tcSpotContract = getTcSpotContract(tcAddress)

      const tokenContract = getERC20Contract(tokenAddress, chainId)
      const allowance = await readCall(tokenContract, 'allowance', [account, tcAddress])
      const isApprovedToken = fromWei(allowance).gte(fromWei(amount))

      setPending(true)
      startTxn({
        key,
        title: t('Increase Prize'),
        transactions: {
          ...(!isApprovedToken && {
            [approveTokenuuid]: {
              desc: `${t('Approve')} ${t('Token')}`,
              status: TXN_STATUS.START,
              hash: null,
            },
          }),
          [increasePrizeuuid]: {
            desc: t('Increase Prize'),
            status: TXN_STATUS.START,
            hash: null,
          },
        },
      })

      if (!isApprovedToken) {
        const isSuccess = await writeTxn(key, approveTokenuuid, tokenContract, 'approve', [tcAddress, maxUint256])
        if (!isSuccess) {
          setPending(false)
          return false
        }
      }

      const isSuccess = await writeTxn(key, increasePrizeuuid, tcSpotContract, 'increasePrize', [amount, tokenAddress])
      if (!isSuccess) {
        setPending(false)
        closeTxn()
        return false
      }

      endTxn({
        key,
        final: 'Increase Successful',
      })
      setPending(false)
      return true
    },
    [account, chainId, closeTxn, endTxn, startTxn, t, writeTxn],
  )

  return { pending, increasePrize }
}
