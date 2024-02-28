import dayjs from 'dayjs'
import { useCallback, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'

import { TXN_STATUS } from '@/constant'
import Contracts from '@/constant/contracts'
import { callMulti, readCall } from '@/lib/contractActions'
import { getTheContract, getVeDistContract, getVeTHEContract, getVoterContract } from '@/lib/contracts'
import { fromWei, toWei } from '@/lib/utils'
import useWallet from '@/lib/wallets/useWallet'
import { useTxn } from '@/state/transactions/hooks'

export const useCreateLock = () => {
  const [pending, setPending] = useState(false)
  const { account, chainId } = useWallet()
  const { startTxn, endTxn, writeTxn } = useTxn()

  const handleCreate = useCallback(
    async (amount, date, callback) => {
      const key = uuidv4()
      const approveuuid = uuidv4()
      const createuuid = uuidv4()
      const unlockString = dayjs(date).format('MMM D, YYYY')
      const unlockTime = dayjs(date).diff(dayjs(), 'second')
      const theContract = getTheContract(chainId)
      const veTHEaddress = Contracts.veTHE[chainId]
      setPending(true)
      const allowance = await readCall(theContract, 'allowance', [account, veTHEaddress])
      const isApproved = fromWei(allowance).gte(amount)
      startTxn({
        key,
        title: 'Lock your THE',
        transactions: {
          ...(!isApproved && {
            [approveuuid]: {
              desc: 'Approve THE',
              status: TXN_STATUS.START,
              hash: null,
            },
          }),
          [createuuid]: {
            desc: `Lock your THE until ${unlockString}`,
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
    },
    [account, chainId, startTxn, writeTxn, endTxn],
  )

  return { onCreateLock: handleCreate, pending }
}

export const useExtendLock = () => {
  const [pending, setPending] = useState(false)
  const { startTxn, endTxn, writeTxn } = useTxn()
  const { chainId } = useWallet()

  const onExtend = useCallback(
    async (veTheId, selectedDate, callback) => {
      const key = uuidv4()
      const extenduuid = uuidv4()

      const unlockTime = dayjs(selectedDate).diff(dayjs(), 'second') + 100
      startTxn({
        key,
        title: 'Extend lock duration',
        transactions: {
          [extenduuid]: {
            desc: `Extend lock duration on veTHE #${veTheId}`,
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
    },
    [startTxn, endTxn, writeTxn, chainId],
  )

  return { onExtend, pending }
}

export const useIncreaseLock = () => {
  const [pending, setPending] = useState(false)
  const { account, chainId } = useWallet()
  const { startTxn, endTxn, writeTxn } = useTxn()

  const onIncreaseAmount = useCallback(
    async (id, amount, callback) => {
      const key = uuidv4()
      const approveuuid = uuidv4()
      const increaseuuid = uuidv4()
      const theContract = getTheContract(chainId)
      const veTHEaddress = Contracts.veTHE[chainId]

      setPending(true)

      const allowance = await readCall(theContract, 'allowance', [account, veTHEaddress])
      const isApproved = fromWei(allowance).gte(amount)
      startTxn({
        key,
        title: 'Increase lock amount',
        transactions: {
          ...(!isApproved && {
            [approveuuid]: {
              desc: 'Approve THE',
              status: TXN_STATUS.START,
              hash: null,
            },
          }),
          [increaseuuid]: {
            desc: `Increase lock amount on veTHE #${id}`,
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
    },
    [account, chainId, startTxn, writeTxn, endTxn],
  )

  return { onIncreaseAmount, pending }
}

export const useMerge = () => {
  const [pending, setPending] = useState(false)
  const { chainId } = useWallet()
  const { startTxn, endTxn, writeTxn } = useTxn()

  const onMerge = useCallback(
    async (from, to, callback) => {
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
              desc: 'Reset Votes',
              status: TXN_STATUS.START,
              hash: null,
            },
          }),
          ...(from.rebase_amount.gt(0) && {
            [rebaseuuid]: {
              desc: 'Claim rebase',
              status: TXN_STATUS.START,
              hash: null,
            },
          }),
          [mergeuuid]: {
            desc: `Merge veTHE #${from.id} to veTHE #${to.id}`,
            status: TXN_STATUS.START,
            hash: null,
          },
        },
      })

      setPending(true)

      if (from.voted) {
        const voterContract = getVoterContract(chainId)
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
    },
    [chainId, startTxn, writeTxn, endTxn],
  )

  return { onMerge, pending }
}

export const useSplit = () => {
  const [pending, setPending] = useState(false)
  const { chainId } = useWallet()
  const { startTxn, endTxn, writeTxn } = useTxn()

  const onSplit = useCallback(
    async (from, weights, callback) => {
      if (!from) return
      const key = uuidv4()
      const resetuuid = uuidv4()
      const rebaseuuid = uuidv4()
      const splituuid = uuidv4()
      startTxn({
        key,
        title: `Split veTHE #${from.id}`,
        transactions: {
          ...(from.voted && {
            [resetuuid]: {
              desc: 'Reset Votes',
              status: TXN_STATUS.START,
              hash: null,
            },
          }),
          ...(from.rebase_amount.gt(0) && {
            [rebaseuuid]: {
              desc: 'Claim rebase',
              status: TXN_STATUS.START,
              hash: null,
            },
          }),
          [splituuid]: {
            desc: 'Split veTHE',
            status: TXN_STATUS.START,
            hash: null,
          },
        },
      })

      setPending(true)

      if (from.voted) {
        const voterContract = getVoterContract(chainId)
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
    },
    [chainId, startTxn, writeTxn, endTxn],
  )

  return { onSplit, pending }
}

export const useTransfer = () => {
  const [pending, setPending] = useState(false)
  const { account, chainId } = useWallet()
  const { startTxn, endTxn, writeTxn } = useTxn()

  const onTransfer = useCallback(
    async (from, to, callback) => {
      const key = uuidv4()
      const resetuuid = uuidv4()
      const transferuuid = uuidv4()
      startTxn({
        key,
        title: 'Transfer veTHE',
        transactions: {
          ...(from.voted && {
            [resetuuid]: {
              desc: 'Reset Votes',
              status: TXN_STATUS.START,
              hash: null,
            },
          }),
          [transferuuid]: {
            desc: `Transfer veTHE #${from.id}`,
            status: TXN_STATUS.START,
            hash: null,
          },
        },
      })

      setPending(true)

      if (from.voted) {
        const voterContract = getVoterContract(chainId)
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
    },
    [account, chainId, startTxn, writeTxn, endTxn],
  )

  return { onTransfer, pending }
}

export const useWithdrawLock = () => {
  const [pending, setPending] = useState(false)
  const { startTxn, endTxn, writeTxn } = useTxn()
  const { chainId } = useWallet()

  const onWithdrawLock = useCallback(
    async (veThe, callback) => {
      const key = uuidv4()
      const resetuuid = uuidv4()
      const withdrawuuid = uuidv4()
      startTxn({
        key,
        title: `Withdraw veTHE #${veThe.id}`,
        transactions: {
          ...(veThe.voted && {
            [resetuuid]: {
              desc: 'Reset Votes',
              status: TXN_STATUS.START,
              hash: null,
            },
          }),
          [withdrawuuid]: {
            desc: `Withdraw veTHE #${veThe.id}`,
            status: TXN_STATUS.START,
            hash: null,
          },
        },
      })

      setPending(true)

      const params = [veThe.id]
      if (veThe.voted) {
        const voterContract = getVoterContract(chainId)
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
        final: 'Withdraw Successful',
      })
      setPending(false)
      callback()
    },
    [startTxn, endTxn, writeTxn, chainId],
  )

  return { onWithdrawLock, pending }
}

export const useVote = () => {
  const [pending, setPending] = useState(false)
  const { startTxn, endTxn, writeTxn } = useTxn()
  const { chainId } = useWallet()

  const handleVote = useCallback(
    async (veTheId, votes, callback) => {
      const key = uuidv4()
      const voteuuid = uuidv4()
      startTxn({
        key,
        title: 'Cast Votes',
        transactions: {
          [voteuuid]: {
            desc: `Cast Votes using veTHE #${veTheId}`,
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
      const voterContract = getVoterContract(chainId)

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
    },
    [startTxn, endTxn, writeTxn, chainId],
  )

  return { onVote: handleVote, pending }
}

export const useReset = () => {
  const [pending, setPending] = useState(false)
  const { startTxn, endTxn, writeTxn } = useTxn()
  const { chainId } = useWallet()

  const handleReset = useCallback(
    async (veTheId, callback) => {
      const key = uuidv4()
      const resetuuid = uuidv4()
      startTxn({
        key,
        title: 'Reset Votes',
        transactions: {
          [resetuuid]: {
            desc: `Reset Votes for veTHE #${veTheId}`,
            status: TXN_STATUS.START,
            hash: null,
          },
        },
      })
      const voterContract = getVoterContract(chainId)

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
    },
    [startTxn, endTxn, writeTxn, chainId],
  )

  return { onReset: handleReset, pending }
}

export const usePoke = () => {
  const [pending, setPending] = useState(false)
  const { startTxn, endTxn, writeTxn } = useTxn()
  const { chainId } = useWallet()

  const handlePoke = useCallback(
    async (veTheId, callback) => {
      const key = uuidv4()
      const pokeuuid = uuidv4()
      startTxn({
        key,
        title: 'Revote',
        transactions: {
          [pokeuuid]: {
            desc: `Revote using veTHE #${veTheId}`,
            status: TXN_STATUS.START,
            hash: null,
          },
        },
      })
      const voterContract = getVoterContract(chainId)

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
    },
    [startTxn, endTxn, writeTxn, chainId],
  )

  return { onPoke: handlePoke, pending }
}

export const useClaimBribes = () => {
  const [pending, setPending] = useState(false)
  const { account, chainId } = useWallet()
  const { startTxn, endTxn, writeTxn } = useTxn()

  const handleClaimBribes = useCallback(
    async (pool, callback) => {
      const key = uuidv4()

      const bribeAbi = [
        {
          inputs: [
            {
              internalType: 'address',
              name: '_owner',
              type: 'address',
            },
            {
              internalType: 'address',
              name: '_rewardToken',
              type: 'address',
            },
          ],
          name: 'earned',
          outputs: [
            {
              internalType: 'uint256',
              name: '',
              type: 'uint256',
            },
          ],
          stateMutability: 'view',
          type: 'function',
        },
      ]
      // fees claim
      const callsFees = pool.rewards.map(reward => ({
        address: pool.gauge.fee,
        abi: bribeAbi,
        functionName: 'earned',
        args: [account, reward.address],
        chainId,
      }))
      const callsBribes = pool.rewards.map(reward => ({
        address: pool.gauge.bribe,
        abi: bribeAbi,
        functionName: 'earned',
        args: [account, reward.address],
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
          desc: 'Claim Bribes',
          status: TXN_STATUS.START,
          hash: null,
        }
      }
      if (feeTokens.length > 0) {
        result[feeuuid] = {
          desc: 'Claim Fees',
          status: TXN_STATUS.START,
          hash: null,
        }
      }
      startTxn({
        key,
        title: 'Claim Bribes + Fees',
        transactions: result,
      })
      setPending(true)
      const voterContract = getVoterContract(chainId)
      if (bribeTokens.length > 0) {
        const params = [[pool.gauge.bribe], [bribeTokens]]
        const isSuccess = await writeTxn(key, bribesuuid, voterContract, 'claimBribes', params)
        if (!isSuccess) {
          setPending(false)
          return
        }
      }
      if (feeTokens.length > 0) {
        const params = [[pool.gauge.fee], [feeTokens]]
        const isSuccess = await writeTxn(key, feeuuid, voterContract, 'claimFees', params)
        if (!isSuccess) {
          setPending(false)
          return
        }
      }
      endTxn({
        key,
        final: 'Claim Successful',
      })
      setPending(false)
      callback()
    },
    [account, startTxn, endTxn, writeTxn, chainId],
  )

  return { onClaimBribes: handleClaimBribes, pending }
}

export const useClaimRebase = () => {
  const [pending, setPending] = useState(false)
  const { chainId } = useWallet()
  const { startTxn, endTxn, writeTxn } = useTxn()

  const handleClaimRebase = useCallback(
    async (veTHE, callback) => {
      const key = uuidv4()
      const veClaimuuid = uuidv4()
      startTxn({
        key,
        title: 'Claim rebase',
        transactions: {
          [veClaimuuid]: {
            desc: `Claim rebase for veTHE #${veTHE.id}`,
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
    },
    [chainId, startTxn, endTxn, writeTxn],
  )

  return { onClaimRebase: handleClaimRebase, pending }
}

export const useClaimAll = () => {
  const [pending, setPending] = useState(false)
  const { chainId } = useWallet()
  const { startTxn, endTxn, writeTxn } = useTxn()

  const handleClaimAll = useCallback(
    async (veRewards, veTHEs, callback) => {
      const key = uuidv4()
      const bribesuuid = uuidv4()
      const feeuuid = uuidv4()
      const veuuid = uuidv4()
      // claim bribes
      const bribeRewards = veRewards.filter(item => item.isBribeExist)
      const feeRewards = veRewards.filter(item => item.isFeeExist)
      const txns = {
        ...(bribeRewards.length > 0 && {
          [bribesuuid]: {
            desc: 'Claim bribes',
            status: TXN_STATUS.START,
            hash: null,
          },
        }),
        ...(feeRewards.length > 0 && {
          [feeuuid]: {
            desc: 'Claim fees',
            status: TXN_STATUS.START,
            hash: null,
          },
        }),
        ...(veTHEs.length > 0 && {
          [veuuid]: {
            desc: 'Claim rebases',
            status: TXN_STATUS.START,
            hash: null,
          },
        }),
      }
      startTxn({
        key,
        title: 'Claim All Rewards',
        transactions: txns,
      })

      setPending(true)
      const veDistContract = getVeDistContract(chainId)
      const voterContract = getVoterContract(chainId)
      // claim bribes
      if (bribeRewards.length > 0) {
        const bribes = bribeRewards.map(item => item.gauge.bribe)
        const bribeTokens = bribeRewards.map(item => item.rewards.map(token => token.address))
        const bribeParams = [bribes, bribeTokens]
        const isSuccess = await writeTxn(key, bribesuuid, voterContract, 'claimBribes', bribeParams)
        if (!isSuccess) {
          setPending(false)
          return
        }
      }

      // claim fees
      if (feeRewards.length > 0) {
        const fees = feeRewards.map(item => item.gauge.fee)
        const feeTokens = feeRewards.map(item => item.rewards.map(token => token.address))
        const feeParams = [fees, feeTokens]
        const isSuccess = await writeTxn(key, feeuuid, voterContract, 'claimFees', feeParams)
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

      endTxn({
        key,
        final: 'Claimed All Rewards',
      })
      setPending(false)
      callback()
    },
    [startTxn, endTxn, writeTxn, chainId],
  )

  return { onClaimAll: handleClaimAll, pending }
}
