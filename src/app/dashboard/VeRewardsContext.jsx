'use client'

import BigNumber from 'bignumber.js'
import dayjs from 'dayjs'
import { gql } from 'graphql-request'
import React, { useMemo } from 'react'
import useSWRImmutable from 'swr/immutable'
import { ChainId } from 'thena-sdk-core'
import { zeroAddress } from 'viem'
import { useReadContracts } from 'wagmi'

import { VeTHEAPIABI } from '@/abis/ve/VeTHEAPIABI'
import { VotingIncentiveABI } from '@/abis/ve/VotingIncentiveABI'
import Contracts from '@/constant/contracts'
import { useAssets } from '@/context/assetsContext'
import useWallet from '@/hooks/useWallet'
import { batchCallMulti, readCall } from '@/lib/contractActions'
import { VoterClient } from '@/lib/graphql'
import { usePools, useV3PoolsWithGauge } from '@/state/pools/hooks'
import { fromWei, isInvalidAmount } from '@/utils/utils'

const VeRewardsContext = React.createContext({
  veRewardsV3: [],
  veRewardsV3Mutate: () => {},
  veRewardsV2: [],
  veRewardsV2Mutate: () => {},
})

const USER_POOL_VOTES_QUERY = gql`
  query USER_POOL_VOTES_QUERY($user: String!, $first: Int = 1000, $skip: Int = 0) {
    userPoolVotes(where: { user: $user, pool_: { isActive: true } }, first: $first, skip: $skip) {
      pool {
        id
        votingIncentive
      }
    }
  }
`
const getUserPoolVotes = async (chainId, userId) => {
  const PAGE_SIZE = 1000
  let skip = 0
  let hasMore = true
  const results = {}

  while (hasMore) {
    try {
      const res = await VoterClient[chainId].request(USER_POOL_VOTES_QUERY, {
        user: userId,
        first: PAGE_SIZE,
        skip,
      })

      const userPoolVotes = res?.userPoolVotes || []
      for (const vote of userPoolVotes) {
        const key = vote.pool.votingIncentive
        results[key] = {
          pool: vote.pool.id.toLowerCase(),
          votingIncentive: vote.pool.votingIncentive.toLowerCase(),
        }
      }

      if (userPoolVotes.length < PAGE_SIZE) {
        hasMore = false
      } else {
        skip += PAGE_SIZE
      }
    } catch (e) {
      console.error('Error fetching userRewards:', e)
      hasMore = false
    }
  }
  return Object.values(results)
}

async function getRewardsList(chainId, votingIncentive) {
  const viContract = {
    address: votingIncentive,
    abi: VotingIncentiveABI,
  }
  const rewardsListLength = await readCall(viContract, 'rewardsListLength', [], chainId)

  const rewardTokens = await batchCallMulti(
    Array.from({ length: Number(rewardsListLength) }, (_, i) => i).map((_, i) => ({
      ...viContract,
      functionName: 'rewardTokens',
      args: [i],
    })),
  )
  return rewardTokens.flat()
}

const getUserVotingRewards = async (chainId, user) => {
  if (!user || !chainId) {
    return []
  }

  try {
    const userPoolVotes = await getUserPoolVotes(chainId, user)

    const results = []
    for (const vote of userPoolVotes) {
      const { pool, votingIncentive } = vote
      const rewardTokens = await getRewardsList(chainId, votingIncentive)

      const earnedRewards = await batchCallMulti(
        rewardTokens.map(token => ({
          address: votingIncentive,
          abi: VotingIncentiveABI,
          functionName: 'earned',
          args: [user, token.toLowerCase()],
        })),
      )

      for (let i = 0; i < earnedRewards.length; i++) {
        const rewardAmount = String(earnedRewards[i])
        if (Number(rewardAmount) > 0) {
          results.push({
            id: `${user.toLowerCase()}-${rewardTokens[i].toLowerCase()}-${votingIncentive}`,
            lastUpdate: dayjs().utc().unix(),
            pool,
            rewardAmount,
            rewardToken: rewardTokens[i].toLowerCase(),
            user,
            votingIncentives: votingIncentive,
          })
        }
      }
    }

    return results
  } catch (error) {
    console.error('user rewards api error :>> ', error)
    return []
  }
}

const fetchUserRewards = async (chainId, userId) => {
  try {
    const data = await getUserVotingRewards(chainId, userId)

    return (data || []).map(reward => ({
      id: reward.id,
      lastUpdate: reward.lastUpdate,
      pool: reward.pool,
      rewardAmount: reward.rewardAmount,
      rewardToken: reward.rewardToken,
      user: reward.user,
      votingIncentives: reward.votingIncentives,
    }))
  } catch (e) {
    console.error('Error fetching userRewards:', e)
    return []
  }
}

const useUserVotingRewards = () => {
  const { account, chainId } = useWallet()
  const { data, error, mutate } = useSWRImmutable(
    account && chainId ? ['current rewards api', account, chainId] : null,
    () => fetchUserRewards(chainId, account.toLowerCase()),
  )

  return {
    data,
    error,
    mutate,
  }
}

function VeRewardsContextProvider({ children }) {
  const assets = useAssets()
  const { account, chainId } = useWallet()
  const v3PoolsWithGauge = useV3PoolsWithGauge(false)

  const { data: votingRewardsV3, error: errorV3, mutate: veRewardsV3Mutate } = useUserVotingRewards()

  const veRewardsV3 = useMemo(() => {
    if (!votingRewardsV3 || !votingRewardsV3.length) return []
    if (errorV3) {
      console.log('current rewards error :>> ', errorV3)
      return []
    }

    return v3PoolsWithGauge
      .map(pool => {
        const result = {}
        const isFeeExist = false
        const isBribeExist = false
        const userPoolRewards = votingRewardsV3.filter(reward => reward?.pool === pool?.address)
        if (userPoolRewards && userPoolRewards.length) {
          userPoolRewards.forEach(userPoolReward => {
            const { rewardAmount, rewardToken } = userPoolReward
            const token = assets.find(asset => asset.address.toLowerCase() === rewardToken.toLowerCase())
            const decimals = token?.decimals
            result[rewardToken] = {
              address: rewardToken,
              amount: !result[rewardToken]
                ? fromWei(rewardAmount, decimals)
                : result[rewardToken].amount.plus(fromWei(rewardAmount, decimals)),
            }
          })
        }

        return {
          ...pool,
          rewards: Object.values(result),
          isFeeExist,
          isBribeExist,
          votingIncentives: userPoolRewards?.[0]?.votingIncentives,
        }
      })
      .filter(pool => pool.rewards.length > 0)
      .map(pool => {
        let totalUsd = new BigNumber(0)
        const finalRewards = pool.rewards.map(reward => {
          const found = assets.find(ele => ele.address.toLowerCase() === reward.address.toLowerCase())
          if (found) {
            totalUsd = totalUsd.plus(reward.amount.times(found.price))
            return {
              ...reward,
              symbol: found.symbol,
            }
          }
          return reward
        })
        return {
          ...pool,
          rewards: finalRewards,
          totalUsd,
        }
      })
      .filter(pool => (pool.rewards || []).some(reward => !isInvalidAmount(reward.amount)))
  }, [votingRewardsV3, errorV3, v3PoolsWithGauge, assets])
  const pools = usePools()

  const { poolsV2, gaugeAddresses } = useMemo(() => {
    if (!pools) return { pools: [], gaugeAddresses: [] }
    const _poolsV2 = pools.filter(pool => pool.gauge.address !== zeroAddress && pool.version === 2)
    return {
      poolsV2: _poolsV2,
      gaugeAddresses: _poolsV2.map(pool => pool.gauge.address),
    }
  }, [pools])

  const {
    data: votingRewardsV2,
    error: errorV2,
    refetch: veRewardsV2Mutate,
  } = useReadContracts({
    contracts: poolsV2.map(pool => ({
      address: Contracts.veTHEAPI[chainId],
      abi: VeTHEAPIABI,
      functionName: 'singlePairRewardAddress',
      args: [account, pool.address],
      chainId,
    })),
    query: {
      // refetchInterval: 100_000,
      enabled: gaugeAddresses.length > 0 && chainId === ChainId.BSC && account,
      staleTime: Infinity,
    },
  })

  const veRewardsV2 = useMemo(() => {
    if (!votingRewardsV2 || !votingRewardsV2.length || errorV2) return []

    return poolsV2
      .map((pool, index) => {
        const result = {}
        let isFeeExist = false
        let isBribeExist = false
        if (votingRewardsV2?.[index]?.result) {
          votingRewardsV2[index].result.forEach((reward, idx) => {
            const { amount, decimals, token } = reward
            if (idx < 2) {
              isFeeExist = isFeeExist || amount > 0
            } else {
              isBribeExist = isBribeExist || amount > 0
            }
            if (Number(amount) > 0) {
              result[token] = {
                address: token,
                amount: !result[token]
                  ? fromWei(amount, decimals)
                  : result[token].amount.plus(fromWei(amount, decimals)),
              }
            }
          })
        }
        return {
          ...pool,
          rewards: Object.values(result),
          isFeeExist,
          isBribeExist,
        }
      })
      .filter(pool => pool.rewards.length > 0)
      .map(pool => {
        let totalUsd = new BigNumber(0)
        const finalRewards = pool.rewards.map(reward => {
          const found = assets.find(ele => ele.address.toLowerCase() === reward.address.toLowerCase())
          if (found) {
            totalUsd = totalUsd.plus(reward.amount.times(found.price))
            return {
              ...reward,
              symbol: found.symbol,
            }
          }
          return reward
        })
        return {
          ...pool,
          rewards: finalRewards,
          totalUsd,
        }
      })
  }, [assets, votingRewardsV2, errorV2, poolsV2])

  const final = useMemo(
    () => ({
      veRewardsV3,
      veRewardsV3Mutate,
      veRewardsV2,
      veRewardsV2Mutate,
    }),
    [veRewardsV3, veRewardsV3Mutate, veRewardsV2, veRewardsV2Mutate],
  )

  return <VeRewardsContext.Provider value={final}>{children}</VeRewardsContext.Provider>
}

export { VeRewardsContext, VeRewardsContextProvider }
