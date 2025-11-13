import dayjs from 'dayjs'
import { useTranslations } from 'next-intl'
import { useCallback, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { erc20Abi } from 'viem'

import { ClaimerABI } from '@/abis/ve/ClaimerABI'
import { RewardEarnedABI } from '@/abis/ve/RewardEarnedABI'
import { VoterV2ABI } from '@/abis/ve/VoterV2ABI'
import { TXN_STATUS } from '@/constant'
import Contracts, { CHAIN_ID } from '@/constant/contracts'
import useWallet from '@/hooks/useWallet'
import { callMulti, readCall } from '@/lib/contractActions'
import { getVeDistContract, getVeTHEContract, getVoterV3Contract } from '@/lib/contracts'
import { fromWei, toWei } from '@/lib/utils'
import { useTxn } from '@/state/transactions/hooks'

export const useCreateLock = () => {
  const [pending, setPending] = useState(false)
  const { account, chainId } = useWallet()
  const { startTxn, endTxn, writeTxn } = useTxn()
  const t = useTranslations()

  const handleCreate = useCallback(
    async (amount, date, callback) => {
      try {
        const key = uuidv4()
        const approveuuid = uuidv4()
        const createuuid = uuidv4()
        const unlockString = dayjs(date).format('MMM D, YYYY')
        const unlockTime = dayjs(date).diff(dayjs(), 'second')
        const theContract = {
          address: Contracts.THE[chainId],
          abi: erc20Abi,
        }
        const veTHEaddress = Contracts.veTHE[chainId]
        setPending(true)
        const allowance = await readCall(theContract, 'allowance', [account, veTHEaddress], chainId)
        const isApproved = fromWei(allowance).gte(amount)
        startTxn({
          key,
          title: 'Lock your THE',
          transactions: {
            ...(!isApproved && {
              [approveuuid]: {
                desc: `${t('Approve')} THE`,
                status: TXN_STATUS.START,
                hash: null,
              },
            }),
            [createuuid]: {
              desc: t('Lock your THE until [date]', { date: unlockString }),
              status: TXN_STATUS.START,
              hash: null,
            },
          },
        })

        if (!isApproved) {
          const isSuccess = await writeTxn(key, approveuuid, theContract, 'approve', [
            veTHEaddress,
            toWei(amount).toFixed(0),
          ])
          if (!isSuccess) {
            setPending(false)
            return
          }
        }

        const veTHEContract = getVeTHEContract(chainId)
        const params = [toWei(amount).toFixed(0), unlockTime]
        const isSuccess = await writeTxn(key, createuuid, veTHEContract, 'create_lock', params)
        if (!isSuccess) {
          setPending(false)
          return
        }

        endTxn({
          key,
          final: 'Lock Successful',
        })
        callback()
        setPending(false)
      } catch (error) {
        console.log(error)
      } finally {
        setPending(false)
      }
    },
    [account, chainId, startTxn, writeTxn, endTxn, t],
  )

  return { onCreateLock: handleCreate, pending }
}

export const useExtendLock = () => {
  const [pending, setPending] = useState(false)
  const { startTxn, endTxn, writeTxn } = useTxn()
  const { chainId } = useWallet()
  const t = useTranslations()

  const onExtend = useCallback(
    async (veTheId, selectedDate, callback) => {
      try {
        const key = uuidv4()
        const extenduuid = uuidv4()

        const unlockTime = dayjs(selectedDate).diff(dayjs(), 'second') + 100
        startTxn({
          key,
          title: 'Extend Lock Duration',
          transactions: {
            [extenduuid]: {
              desc: t('Extend Lock Duration'),
              status: TXN_STATUS.START,
              hash: null,
            },
          },
        })
        const veTHEContract = getVeTHEContract(chainId)

        setPending(true)
        const params = [veTheId, unlockTime]
        if (!(await writeTxn(key, extenduuid, veTHEContract, 'increase_unlock_time', params))) {
          setPending(false)
          return
        }

        endTxn({
          key,
          final: 'Extend Successful',
        })
        setPending(false)
        callback()
      } catch (error) {
        console.log(error)
      } finally {
        setPending(false)
      }
    },
    [startTxn, endTxn, writeTxn, chainId, t],
  )

  return { onExtend, pending }
}

export const useExtendMultipleLock = () => {
  const [pending, setPending] = useState(false)
  const { startTxn, endTxn, writeTxn } = useTxn()
  const { chainId } = useWallet()
  const t = useTranslations()

  const onExtend = useCallback(
    async (veThes, callback) => {
      try {
        const key = uuidv4()

        const transactions = {}
        if (veThes.length > 0) {
          veThes.forEach(veThe => {
            transactions[veThe.id] = {
              desc: `${t('Extend Lock Duration')} ID #${veThe.id}`,
              status: TXN_STATUS.START,
              hash: null,
            }
          })
        }

        startTxn({ key, title: 'Extend Lock Duration', transactions })

        const veTHEContract = getVeTHEContract(chainId)

        setPending(true)

        for (let i = 0; i < veThes.length; i++) {
          const veThe = veThes[i]
          const unlockTime = dayjs(veThe.unlockTime).diff(dayjs(), 'second') + 100
          const params = [veThe.id, unlockTime]
          if (!(await writeTxn(key, veThe.id, veTHEContract, 'increase_unlock_time', params))) {
            setPending(false)
            return
          }
        }

        endTxn({
          key,
          final: 'Extend Successful',
        })
        setPending(false)
        callback()
      } catch (error) {
        console.log(error)
      } finally {
        setPending(false)
      }
    },
    [startTxn, endTxn, writeTxn, chainId, t],
  )

  return { onExtend, pending }
}

export const useIncreaseLock = () => {
  const [pending, setPending] = useState(false)
  const { account, chainId } = useWallet()
  const { startTxn, endTxn, writeTxn } = useTxn()
  const t = useTranslations()

  const onIncreaseAmount = useCallback(
    async (id, amount, callback) => {
      try {
        const key = uuidv4()
        const approveuuid = uuidv4()
        const increaseuuid = uuidv4()
        const theContract = {
          address: Contracts.THE[chainId],
          abi: erc20Abi,
        }
        const veTHEaddress = Contracts.veTHE[chainId]

        setPending(true)

        const allowance = await readCall(theContract, 'allowance', [account, veTHEaddress])
        const isApproved = fromWei(allowance).gte(amount)
        startTxn({
          key,
          title: 'Increase Lock Amount',
          transactions: {
            ...(!isApproved && {
              [approveuuid]: {
                desc: `${t('Approve')} THE`,
                status: TXN_STATUS.START,
                hash: null,
              },
            }),
            [increaseuuid]: {
              desc: 'Increase Lock Amount',
              status: TXN_STATUS.START,
              hash: null,
            },
          },
        })
        if (!isApproved) {
          if (!(await writeTxn(key, approveuuid, theContract, 'approve', [veTHEaddress, toWei(amount).toFixed(0)]))) {
            setPending(false)
            return
          }
        }
        const veTHEContract = getVeTHEContract(chainId)
        const params = [id, toWei(amount).toFixed(0)]
        if (!(await writeTxn(key, increaseuuid, veTHEContract, 'increase_amount', params))) {
          setPending(false)
          return
        }

        endTxn({
          key,
          final: 'Increase Successful',
        })
        callback()
        setPending(false)
      } catch (error) {
        console.log(error)
      } finally {
        setPending(false)
      }
    },
    [account, chainId, startTxn, writeTxn, endTxn, t],
  )

  return { onIncreaseAmount, pending }
}

export const useMerge = () => {
  const [pending, setPending] = useState(false)
  const { chainId } = useWallet()
  const { startTxn, endTxn, writeTxn } = useTxn()
  const t = useTranslations()

  const onMerge = useCallback(
    async (from, to, callback) => {
      try {
        if (!from) return
        const key = uuidv4()
        const resetuuid = uuidv4()
        const rebaseuuid = uuidv4()
        const mergeuuid = uuidv4()
        startTxn({
          key,
          title: 'Merge veTHE',
          transactions: {
            ...(from.voted && {
              [resetuuid]: {
                desc: t('Reset Votes'),
                status: TXN_STATUS.START,
                hash: null,
              },
            }),
            ...(from.rebase_amount.gt(0) && {
              [rebaseuuid]: {
                desc: t('Claim Rebase'),
                status: TXN_STATUS.START,
                hash: null,
              },
            }),
            [mergeuuid]: {
              desc: t('Merge veTHE #[id1] to veTHE #[id2]', { id1: from.id, id2: to.id }),
              status: TXN_STATUS.START,
              hash: null,
            },
          },
        })

        setPending(true)

        if (from.voted) {
          const voterContract = getVoterV3Contract(chainId)
          if (!(await writeTxn(key, resetuuid, voterContract, 'reset', [from.id]))) {
            setPending(false)
            return
          }
        }

        if (from.rebase_amount.gt(0)) {
          const veDistContract = getVeDistContract(chainId)
          if (!(await writeTxn(key, rebaseuuid, veDistContract, 'claim', [from.id]))) {
            setPending(false)
            return
          }
        }

        const veTHEContract = getVeTHEContract(chainId)
        const params = [from.id, to.id]
        if (!(await writeTxn(key, mergeuuid, veTHEContract, 'merge', params))) {
          setPending(false)
          return
        }

        endTxn({
          key,
          final: 'Merge Successful',
        })
        callback()
        setPending(false)
      } catch (error) {
        console.log(error)
      } finally {
        setPending(false)
      }
    },
    [chainId, startTxn, writeTxn, endTxn, t],
  )

  return { onMerge, pending }
}

export const useSplit = () => {
  const [pending, setPending] = useState(false)
  const { chainId } = useWallet()
  const { startTxn, endTxn, writeTxn } = useTxn()
  const t = useTranslations()

  const onSplit = useCallback(
    async (from, weights, callback) => {
      try {
        if (!from) return
        const key = uuidv4()
        const resetuuid = uuidv4()
        const rebaseuuid = uuidv4()
        const splituuid = uuidv4()
        startTxn({
          key,
          title: t('Split veTHE #[id]', { id: from.id }),
          transactions: {
            ...(from.voted && {
              [resetuuid]: {
                desc: t('Reset Votes'),
                status: TXN_STATUS.START,
                hash: null,
              },
            }),
            ...(from.rebase_amount.gt(0) && {
              [rebaseuuid]: {
                desc: t('Claim Rebase'),
                status: TXN_STATUS.START,
                hash: null,
              },
            }),
            [splituuid]: {
              desc: t('Split veTHE'),
              status: TXN_STATUS.START,
              hash: null,
            },
          },
        })

        setPending(true)

        if (from.voted) {
          const voterContract = getVoterV3Contract(chainId)
          if (!(await writeTxn(key, resetuuid, voterContract, 'reset', [from.id]))) {
            setPending(false)
            return
          }
        }

        if (from.rebase_amount.gt(0)) {
          const veDistContract = getVeDistContract(chainId)
          if (!(await writeTxn(key, rebaseuuid, veDistContract, 'claim', [from.id]))) {
            setPending(false)
            return
          }
        }

        const veTHEContract = getVeTHEContract(chainId)
        const params = [weights, from.id]
        if (!(await writeTxn(key, splituuid, veTHEContract, 'split', params))) {
          setPending(false)
          return
        }

        endTxn({
          key,
          final: 'Split Successful',
        })
        callback()
        setPending(false)
      } catch (error) {
        console.log(error)
      } finally {
        setPending(false)
      }
    },
    [chainId, startTxn, writeTxn, endTxn, t],
  )

  return { onSplit, pending }
}

export const useTransfer = () => {
  const [pending, setPending] = useState(false)
  const { account, chainId } = useWallet()
  const { startTxn, endTxn, writeTxn } = useTxn()
  const t = useTranslations()

  const onTransfer = useCallback(
    async (from, to, callback) => {
      try {
        const key = uuidv4()
        const resetuuid = uuidv4()
        const transferuuid = uuidv4()
        startTxn({
          key,
          title: 'Transfer veTHE',
          transactions: {
            ...(from.voted && {
              [resetuuid]: {
                desc: t('Reset Votes'),
                status: TXN_STATUS.START,
                hash: null,
              },
            }),
            [transferuuid]: {
              desc: t('Transfer veTHE #[id]', { id: from.id }),
              status: TXN_STATUS.START,
              hash: null,
            },
          },
        })

        setPending(true)

        if (from.voted) {
          const voterContract = getVoterV3Contract(chainId)
          if (!(await writeTxn(key, resetuuid, voterContract, 'reset', [from.id]))) {
            setPending(false)
            return
          }
        }

        const veTHEContract = getVeTHEContract(chainId)
        const params = [account, to, from.id]
        if (!(await writeTxn(key, transferuuid, veTHEContract, 'transferFrom', params))) {
          setPending(false)
          return
        }

        endTxn({
          key,
          final: 'Transfer Successful',
        })
        callback()
        setPending(false)
      } catch (error) {
        console.log(error)
      } finally {
        setPending(false)
      }
    },
    [account, chainId, startTxn, writeTxn, endTxn, t],
  )

  return { onTransfer, pending }
}

export const useWithdrawLock = () => {
  const [pending, setPending] = useState(false)
  const { startTxn, endTxn, writeTxn } = useTxn()
  const { chainId } = useWallet()
  const t = useTranslations()

  const onWithdrawLock = useCallback(
    async (veThe, callback) => {
      try {
        const key = uuidv4()
        const resetuuid = uuidv4()
        const withdrawuuid = uuidv4()
        startTxn({
          key,
          title: t('Withdraw veTHE [id]', { id: veThe.id }),
          transactions: {
            ...(veThe.voted && {
              [resetuuid]: {
                desc: t('Reset Votes'),
                status: TXN_STATUS.START,
                hash: null,
              },
            }),
            [withdrawuuid]: {
              desc: t('Withdraw veTHE [id]', { id: veThe.id }),
              status: TXN_STATUS.START,
              hash: null,
            },
          },
        })

        setPending(true)

        const params = [veThe.id]
        if (veThe.voted) {
          const voterContract = getVoterV3Contract(chainId)
          if (!(await writeTxn(key, resetuuid, voterContract, 'reset', params))) {
            setPending(false)
            return
          }
        }

        const veTHEContract = getVeTHEContract(chainId)
        if (!(await writeTxn(key, withdrawuuid, veTHEContract, 'withdraw', params))) {
          setPending(false)
          return
        }

        endTxn({
          key,
          final: 'Withdraw Successfully',
        })
        setPending(false)
        callback()
      } catch (error) {
        setPending(false)
        console.error(error)
        return
      } finally {
        setPending(false)
      }
    },
    [startTxn, endTxn, writeTxn, chainId, t],
  )

  return { onWithdrawLock, pending }
}

export const useVote = () => {
  const [pending, setPending] = useState(false)
  const { startTxn, endTxn, writeTxn } = useTxn()
  const { chainId } = useWallet()
  const t = useTranslations()

  const handleVote = useCallback(
    async (veTheId, votes, callback) => {
      try {
        const key = uuidv4()
        const voteuuid = uuidv4()
        startTxn({
          key,
          title: 'Cast Votes',
          transactions: {
            [voteuuid]: {
              desc: t('Cast Votes'),
              status: TXN_STATUS.START,
              hash: null,
            },
          },
        })

        for (let i = 0; i < Object.keys(votes).length; i++) {
          const votekey = Object.keys(votes)[i]
          if (isNaN(Number(votes[votekey])) || Number(votes[votekey]) === 0) {
            delete votes[votekey]
          }
        }
        const tokens = Object.keys(votes)
        const voteCounts = Object.values(votes)
        const voterContract = getVoterV3Contract(chainId)

        setPending(true)
        const params = [Number(veTheId), tokens, voteCounts]
        const isSuccess = await writeTxn(key, voteuuid, voterContract, 'vote', params)
        if (!isSuccess) {
          setPending(false)
          return
        }

        endTxn({
          key,
          final: 'Vote Successful',
        })
        callback()
        setPending(false)
      } catch (error) {
        console.log(error)
      } finally {
        setPending(false)
      }
    },
    [startTxn, endTxn, writeTxn, chainId, t],
  )

  return { onVote: handleVote, pending }
}

export const useReset = () => {
  const [pending, setPending] = useState(false)
  const { startTxn, endTxn, writeTxn } = useTxn()
  const { chainId } = useWallet()
  const t = useTranslations()

  const handleReset = useCallback(
    async (veTheId, callback) => {
      try {
        const key = uuidv4()
        const resetuuid = uuidv4()
        startTxn({
          key,
          title: 'Reset Votes',
          transactions: {
            [resetuuid]: {
              desc: t('Reset Votes'),
              status: TXN_STATUS.START,
              hash: null,
            },
          },
        })
        const voterContract = getVoterV3Contract(chainId)

        setPending(true)
        const isSuccess = await writeTxn(key, resetuuid, voterContract, 'reset', [veTheId])
        if (!isSuccess) {
          setPending(false)
          return
        }

        endTxn({
          key,
          final: 'Reset Successful',
        })
        callback()
        setPending(false)
      } catch (error) {
        console.log(error)
      } finally {
        setPending(false)
      }
    },
    [startTxn, endTxn, writeTxn, chainId, t],
  )

  return { onReset: handleReset, pending }
}

export const usePoke = () => {
  const [pending, setPending] = useState(false)
  const { startTxn, endTxn, writeTxn } = useTxn()
  const { chainId } = useWallet()
  const t = useTranslations()

  const handlePoke = useCallback(
    async (veTheId, callback) => {
      try {
        const key = uuidv4()
        const pokeuuid = uuidv4()
        startTxn({
          key,
          title: 'Revote',
          transactions: {
            [pokeuuid]: {
              desc: t('Revote'),
              status: TXN_STATUS.START,
              hash: null,
            },
          },
        })
        const voterContract = getVoterV3Contract(chainId)

        setPending(true)
        const isSuccess = await writeTxn(key, pokeuuid, voterContract, 'poke', [veTheId])
        if (!isSuccess) {
          setPending(false)
          return
        }

        endTxn({
          key,
          final: 'Revote Successful',
        })
        callback()
        setPending(false)
      } catch (error) {
        console.log(error)
      } finally {
        setPending(false)
      }
    },
    [startTxn, endTxn, writeTxn, chainId, t],
  )

  return { onPoke: handlePoke, pending }
}

export const useClaimBribes = () => {
  const [pending, setPending] = useState(false)
  const { chainId } = useWallet()
  const { startTxn, endTxn, writeTxn } = useTxn()
  const t = useTranslations()

  const handleClaimBribes = useCallback(
    async (pool, callback) => {
      try {
        setPending(true)
        const key = uuidv4()
        const claimContract = {
          address: Contracts.Claimer[chainId],
          abi: ClaimerABI,
        }
        const claimuuid = uuidv4()
        const params = [[pool?.votingIncentives], [(pool?.rewards || []).map(item => item.address)]]

        startTxn({
          key,
          title: 'Claim Incentives + Fees',
          transactions: {
            [claimuuid]: {
              desc: t('Claim'),
              status: TXN_STATUS.START,
              hash: null,
            },
          },
        })

        const isSuccess = await writeTxn(key, claimuuid, claimContract, 'claimVotingIncentivesAddress', params)
        if (!isSuccess) {
          setPending(false)
          return
        }

        endTxn({
          key,
          final: 'Claim Successful',
        })

        setPending(false)
        callback()
      } catch (error) {
        console.log(error)
      } finally {
        setPending(false)
      }
    },
    [chainId, startTxn, t, writeTxn, endTxn],
  )

  return { onClaimBribes: handleClaimBribes, pending }
}

export const useClaimRebase = () => {
  const [pending, setPending] = useState(false)
  const { chainId } = useWallet()
  const { startTxn, endTxn, writeTxn } = useTxn()
  const t = useTranslations()

  const handleClaimRebase = useCallback(
    async (veTHE, callback) => {
      try {
        const key = uuidv4()
        const veClaimuuid = uuidv4()
        startTxn({
          key,
          title: 'Claim Rebase',
          transactions: {
            [veClaimuuid]: {
              desc: t('Claim Rebase'),
              status: TXN_STATUS.START,
              hash: null,
            },
          },
        })
        const veDist = getVeDistContract(chainId)
        const params = [veTHE.id]
        setPending(true)
        const isSuccess = await writeTxn(key, veClaimuuid, veDist, 'claim', params)
        if (!isSuccess) {
          setPending(false)
          return
        }

        endTxn({
          key,
          final: 'Claim Successful',
        })
        setPending(false)
        callback()
      } catch (error) {
        console.log(error)
      } finally {
        setPending(false)
      }
    },
    [chainId, startTxn, endTxn, writeTxn, t],
  )

  return { onClaimRebase: handleClaimRebase, pending }
}

// TODO: Remove later, currently used for v2 voting rewards
export const useClaimAllV2 = () => {
  const [pending, setPending] = useState(false)
  const { chainId } = useWallet()
  const { startTxn, endTxn, writeTxn } = useTxn()
  const t = useTranslations()

  const handleClaimAllV2 = useCallback(
    async (veRewards, veTHEs, callback) => {
      try {
        const key = uuidv4()
        const bribesuuid = uuidv4()
        const feeuuid = uuidv4()
        const veuuid = uuidv4()

        const bribeRewards = veRewards.filter(item => item.isBribeExist)
        const feeRewards = veRewards.filter(item => item.isFeeExist)

        startTxn({
          key,
          title: 'Claim Voting Rewards V2',
          transactions: {
            ...(bribeRewards.length > 0 && {
              [bribesuuid]: {
                desc: t('Claim Incentives'),
                status: TXN_STATUS.START,
                hash: null,
              },
            }),
            ...(feeRewards.length > 0 && {
              [feeuuid]: {
                desc: t('Claim Fees'),
                status: TXN_STATUS.START,
                hash: null,
              },
            }),
            ...(veTHEs.length > 0 && {
              [veuuid]: {
                desc: t('Claim Rebases'),
                status: TXN_STATUS.START,
                hash: null,
              },
            }),
          },
        })

        setPending(true)
        const voterv2Contract = {
          address: Contracts.VoterV2[chainId],
          abi: VoterV2ABI,
        }
        const veDistContract = getVeDistContract(chainId, 2)

        // claim bribes
        if (bribeRewards.length > 0) {
          const bribes = bribeRewards.map(item => item.gauge.bribe)
          const bribeTokens = bribeRewards.map(item => item.rewards.map(token => token.address))
          const bribeParams = [bribes, bribeTokens]
          const isSuccess = await writeTxn(key, bribesuuid, voterv2Contract, 'claimBribes', bribeParams)
          if (!isSuccess) {
            setPending(false)
            return
          }
        }

        // Claim Fees
        if (feeRewards.length > 0) {
          const fees = feeRewards.map(item => item.gauge.fee)
          const feeTokens = feeRewards.map(item => item.rewards.map(token => token.address))
          const feeParams = [fees, feeTokens]
          const isSuccess = await writeTxn(key, feeuuid, voterv2Contract, 'claimFees', feeParams)
          if (!isSuccess) {
            setPending(false)
            return
          }
        }

        if (veTHEs.length > 0) {
          const params = veTHEs.map(ele => ele.id)
          const isSuccess = await writeTxn(key, veuuid, veDistContract, 'claim_many', [params])
          if (!isSuccess) {
            setPending(false)
            return
          }
        }

        endTxn({ key, final: 'Claimed All Rewards' })
        setPending(false)
        callback()
      } catch (error) {
        console.log(error)
      } finally {
        setPending(false)
      }
    },
    [startTxn, endTxn, writeTxn, chainId, t],
  )

  return { handleClaimAllV2, pending }
}

export const useClaimBribesV2 = () => {
  const [pending, setPending] = useState(false)
  const { account, chainId } = useWallet()
  const { startTxn, endTxn, writeTxn } = useTxn()
  const t = useTranslations()

  const handleClaimBribes = useCallback(
    async (pool, callback) => {
      try {
        const key = uuidv4()

        const RewardEarnedContract = {
          abi: RewardEarnedABI,
          address: Contracts.RewardEarned[chainId],
        }
        const callsFees = pool.rewards.map(reward => ({
          ...RewardEarnedContract,
          functionName: 'earned',
          args: [pool.gauge.fee, reward.address, account],
          chainId,
        }))
        const callsBribes = pool.rewards.map(reward => ({
          ...RewardEarnedContract,
          functionName: 'earned',
          args: [pool.gauge.bribe, reward.address, account],
          chainId,
        }))
        const [resFees, resBribes] = await Promise.all([callMulti(callsFees), callMulti(callsBribes)])
        const feeTokens = []
        resFees.forEach((item, index) => {
          const rewardTokenAddress = pool.rewards[index].address.toLowerCase()
          if (Number(item) > 0) feeTokens.push(rewardTokenAddress)
        })
        const bribeTokens = []
        resBribes.forEach((item, index) => {
          const rewardTokenAddress = pool.rewards[index].address.toLowerCase()
          if (Number(item) > 0) bribeTokens.push(rewardTokenAddress)
        })
        const result = {}
        const bribesuuid = uuidv4()
        const feeuuid = uuidv4()
        if (bribeTokens.length > 0) {
          result[bribesuuid] = {
            desc: t('Claim Incentives'),
            status: TXN_STATUS.START,
            hash: null,
          }
        }
        if (feeTokens.length > 0) {
          result[feeuuid] = {
            desc: t('Claim Fees'),
            status: TXN_STATUS.START,
            hash: null,
          }
        }
        startTxn({ key, title: 'Claim Incentives + Fees', transactions: result })
        setPending(true)
        const voterv2Contract = {
          address: Contracts.VoterV2[chainId],
          abi: VoterV2ABI,
        }
        if (bribeTokens.length > 0) {
          const params = [[pool.gauge.bribe], [bribeTokens]]
          const isSuccess = await writeTxn(key, bribesuuid, voterv2Contract, 'claimBribes', params)
          if (!isSuccess) {
            setPending(false)
            return
          }
        }
        if (feeTokens.length > 0) {
          const params = [[pool.gauge.fee], [feeTokens]]
          const isSuccess = await writeTxn(key, feeuuid, voterv2Contract, 'claimFees', params)
          if (!isSuccess) {
            setPending(false)
            return
          }
        }
        endTxn({ key, final: 'Claim Successful' })
        setPending(false)
        callback()
      } catch (error) {
        console.log(error)
      } finally {
        setPending(false)
      }
    },
    [account, startTxn, endTxn, writeTxn, chainId, t],
  )

  return { onClaimBribes: handleClaimBribes, pending }
}

export const useClaimAll = () => {
  const [pending, setPending] = useState(false)
  const { chainId } = useWallet()
  const { startTxn, endTxn, writeTxn } = useTxn()
  const t = useTranslations()

  const handleClaimAll = useCallback(
    async (veRewards, veTHEs, callback) => {
      try {
        const key = uuidv4()
        const bribesuuid = uuidv4()
        const veuuid = uuidv4()

        const transactions = {
          ...(veRewards.length > 0 && {
            [bribesuuid]: {
              desc: t('Claim Incentives + Fees'),
              status: TXN_STATUS.START,
              hash: null,
            },
          }),
          ...(veTHEs.length > 0 && {
            [veuuid]: {
              desc: t('Claim Rebases'),
              status: TXN_STATUS.START,
              hash: null,
            },
          }),
        }
        startTxn({
          key,
          title: 'Claim Voting Rewards V3',
          transactions,
        })

        setPending(true)

        // Claim bribes
        if (veRewards.length > 0) {
          const claimContract = {
            address: Contracts.Claimer[chainId],
            abi: ClaimerABI,
          }
          const votingIncentives = []
          const rewardsTokensArray = []
          veRewards.forEach(item => {
            if (item.votingIncentives) {
              votingIncentives.push(item.votingIncentives)
            }
            if (item.rewards && Array.isArray(item.rewards)) {
              const thisPoolRewardTokens = item.rewards.map(token => token.address)
              rewardsTokensArray.push(thisPoolRewardTokens)
            }
          })
          const claimBribesParams = [Array.from(votingIncentives), Array.from(rewardsTokensArray)]
          const isSuccess = await writeTxn(
            key,
            bribesuuid,
            claimContract,
            chainId === CHAIN_ID.TEST_BSC ? 'claimVotingIncetivesAddress' : 'claimVotingIncentivesAddress',
            claimBribesParams,
          )
          if (!isSuccess) {
            setPending(false)
            return
          }
        }

        // Claim rebase
        if (veTHEs.length > 0) {
          const veDistContract = getVeDistContract(chainId)
          const params = veTHEs.map(ele => ele.id)
          const isSuccess = await writeTxn(key, veuuid, veDistContract, 'claim_many', [params])
          if (!isSuccess) {
            setPending(false)
            return
          }
        }

        endTxn({
          key,
          final: 'Claimed All Rewards',
        })
        setPending(false)
        callback()
      } catch (error) {
        console.log(error)
      } finally {
        setPending(false)
      }
    },
    [startTxn, endTxn, writeTxn, chainId, t],
  )

  return { handleClaimAll, pending }
}
