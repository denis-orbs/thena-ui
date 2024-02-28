import BigNumber from 'bignumber.js'
import { useCallback, useMemo, useState } from 'react'
import useSWR from 'swr'
import { ChainId } from 'thena-sdk-core'
import { v4 as uuidv4 } from 'uuid'

import { TXN_STATUS } from '@/constant'
import Contracts from '@/constant/contracts'
import { readCall } from '@/lib/contractActions'
import { getNftStakingContract, getRoyaltyContract, getTheNftContract } from '@/lib/contracts'
import { fromWei } from '@/lib/utils'
import useWallet from '@/lib/wallets/useWallet'
import { useTxn } from '@/state/transactions/hooks'

import usePrices from './usePrices'

const getFloorPrice = async () => {
  const hardcoded = true
  if (hardcoded) return null
  try {
    const apiKey = process.env.NEXT_PUBLIC_NFT_MARKET_API_KEY
    const response = await fetch('https://api.element.market/openapi/v1/collection/stats?collection_slug=thenian', {
      method: 'get',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey,
      },
    })
    const res = await response.json()
    return res.data
  } catch (ex) {
    console.error('element api fetch had error', ex)
    return null
  }
}

const fetchTotalInfo = async (url, theNftContract, nftStakingContract) => {
  const [res0, res1, res2] = await Promise.all([
    readCall(theNftContract, 'balanceOf', [Contracts.nftStaking[ChainId.BSC]]),
    readCall(nftStakingContract, 'rewardPerSecond'),
    getFloorPrice(),
  ])
  return {
    totalStaked: Number(res0),
    rewardPerSecond: fromWei(res1),
    floorPrice: res2?.usdFloorPrice ?? 1700,
  }
}

export const useTheNftInfo = () => {
  const theNftContract = getTheNftContract()
  const nftStakingContract = getNftStakingContract()
  const prices = usePrices()
  const { data, isLoading } = useSWR('thenft total info', url =>
    fetchTotalInfo(url, theNftContract, nftStakingContract),
  )
  const totalInfo = useMemo(() => {
    if (!data) return null
    const { totalStaked, rewardPerSecond, floorPrice } = data
    const apr =
      totalStaked > 0 && floorPrice > 0
        ? rewardPerSecond
            .times(86400)
            .times(365)
            .times(prices.THE)
            .div(totalStaked * floorPrice)
            .times(100)
        : new BigNumber(0)
    const lastEarnings = rewardPerSecond.times(prices.THE).times(604800)
    return {
      apr,
      lastEarnings,
    }
  }, [data, prices])

  return {
    totalStaked: data?.totalStaked ?? 0,
    apr: totalInfo?.apr ?? 0,
    lastEarnings: totalInfo?.lastEarnings ?? 0,
    isLoading,
  }
}

const fetchAccountInfo = async (url, account, theNftContract, royaltyContract, nftStakingContract) => {
  if (!account) return
  try {
    const [res0, res1, res2, res3, res4] = await Promise.all([
      readCall(theNftContract, 'tokensOfOwner', [account]),
      readCall(royaltyContract, 'claimable', [account]),
      readCall(theNftContract, 'originalMinters', [account]),
      readCall(nftStakingContract, 'stakedTokenIds', [account]),
      readCall(nftStakingContract, 'pendingReward', [account]),
    ])
    return {
      walletIds: res0,
      claimable: fromWei(res1),
      isOriginal: Number(res2) > 0,
      stakedIds: res3.map(ele => Number(ele)),
      pendingReward: fromWei(res4),
    }
  } catch (error) {
    console.log('thenft account error :>> ', error)
  }
}

export const useTheNftAccountInfo = () => {
  const theNftContract = getTheNftContract()
  const nftStakingContract = getNftStakingContract()
  const royaltyContract = getRoyaltyContract()
  const { account } = useWallet()
  const prices = usePrices()
  const { data, mutate } = useSWR(['thenft user info', account], url =>
    fetchAccountInfo(url, account, theNftContract, royaltyContract, nftStakingContract),
  )

  return {
    walletIds: data?.walletIds ?? [],
    claimable: data?.claimable ?? new BigNumber(0),
    claimableUSD: data?.claimable.times(prices.BNB) ?? new BigNumber(0),
    isOriginal: data?.isOriginal ?? false,
    stakedIds: data?.stakedIds ?? [],
    pendingReward: data?.pendingReward.times(prices.THE) ?? new BigNumber(0),
    pendingAmount: data?.pendingReward ?? new BigNumber(0),
    mutate,
  }
}

export const useStakeNft = () => {
  const [pending, setPending] = useState(false)
  const { startTxn, endTxn, writeTxn } = useTxn()
  const { account } = useWallet()

  const handleStake = useCallback(
    async (ids, callback) => {
      const key = uuidv4()
      const approveuuid = uuidv4()
      const stakeuuid = uuidv4()
      const theNFTContract = getTheNftContract()
      const nftStakingContract = getNftStakingContract()
      const newStakingAddress = Contracts.nftStaking[ChainId.BSC]
      const isApproved = await readCall(theNFTContract, 'isApprovedForAll', [account, newStakingAddress])
      startTxn({
        key,
        title: 'Stake your theNFTs',
        transactions: {
          ...(!isApproved && {
            [approveuuid]: {
              desc: 'Approve theNFT',
              status: TXN_STATUS.START,
              hash: null,
            },
          }),
          [stakeuuid]: {
            desc: `Stake ${ids.length} theNFT`,
            status: TXN_STATUS.START,
          },
        },
      })

      setPending(true)
      if (!isApproved) {
        const isSuccess = await writeTxn(key, approveuuid, nftStakingContract, 'setApprovalForAll', [
          newStakingAddress,
          true,
        ])
        if (!isSuccess) {
          setPending(false)
          return
        }
      }
      const isSuccess = await writeTxn(key, stakeuuid, nftStakingContract, 'deposit', [ids])
      if (!isSuccess) {
        setPending(false)
        return
      }

      endTxn({
        key,
        final: 'Unstake Successful',
      })
      setPending(false)
      callback()
    },
    [startTxn, endTxn, writeTxn, account],
  )

  return { onStake: handleStake, pending }
}

export const useUnstakeNft = () => {
  const [pending, setPending] = useState(false)
  const { startTxn, endTxn, writeTxn } = useTxn()

  const handleUnstake = useCallback(
    async (ids, callback) => {
      const key = uuidv4()
      const unstakeuuid = uuidv4()
      startTxn({
        key,
        title: 'Unstake your theNFTs',
        transactions: {
          [unstakeuuid]: {
            desc: `Unstake ${ids.length} theNFT`,
            status: TXN_STATUS.START,
          },
        },
      })

      setPending(true)
      const nftStakingContract = getNftStakingContract()
      const isSuccess = await writeTxn(key, unstakeuuid, nftStakingContract, 'withdraw', [ids])
      if (!isSuccess) {
        setPending(false)
        return
      }

      endTxn({
        key,
        final: 'Unstake Successful',
      })
      setPending(false)
      callback()
    },
    [startTxn, endTxn, writeTxn],
  )

  return { onUnstake: handleUnstake, pending }
}

export const useNftFeesClaim = () => {
  const [pending, setPending] = useState(false)
  const { startTxn, endTxn, writeTxn } = useTxn()

  const handleHarvest = useCallback(async () => {
    const key = uuidv4()
    const harvestuuid = uuidv4()
    startTxn({
      key,
      title: 'Claim Fees',
      transactions: {
        [harvestuuid]: {
          desc: 'Claim Fees',
          status: TXN_STATUS.START,
          hash: null,
        },
      },
    })

    setPending(true)
    const nftStakingContract = getNftStakingContract()
    const isSuccess = await writeTxn(key, harvestuuid, nftStakingContract, 'harvest')
    if (!isSuccess) {
      setPending(false)
      return
    }

    endTxn({
      key,
      final: 'Claim Successful',
    })
    setPending(false)
  }, [startTxn, endTxn, writeTxn])

  return { onHarvest: handleHarvest, pending }
}

export const useNftRoyaltyClaim = () => {
  const [pending, setPending] = useState(false)
  const { account } = useWallet()
  const { startTxn, endTxn, writeTxn } = useTxn()

  const handleRoyaltyClaim = useCallback(
    async callback => {
      const key = uuidv4()
      const harvestuuid = uuidv4()
      startTxn({
        key,
        title: 'Claim Royalty Fees',
        transactions: {
          [harvestuuid]: {
            desc: 'Claim Royalty Fees',
            status: TXN_STATUS.START,
            hash: null,
          },
        },
      })

      setPending(true)
      const royaltyContract = getRoyaltyContract()
      const isSuccess = await writeTxn(key, harvestuuid, royaltyContract, 'claim', [account])
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
    [startTxn, endTxn, writeTxn, account],
  )

  return { onRoyaltyClaim: handleRoyaltyClaim, pending }
}
