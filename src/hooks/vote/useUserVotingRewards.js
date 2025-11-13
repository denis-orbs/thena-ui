import dayjs from 'dayjs'
import { gql } from 'graphql-request'
import useSWRImmutable from 'swr/immutable'

import { VotingIncentiveABI } from '@/abis/ve/VotingIncentiveABI'
import { batchCallMulti, readCall } from '@/lib/contractActions'
import { voterSubgraph } from '@/lib/graphql'

import useWallet from '../useWallet'

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
      const res = await voterSubgraph[chainId].request(USER_POOL_VOTES_QUERY, {
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
export const useUserVotingRewards = () => {
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
