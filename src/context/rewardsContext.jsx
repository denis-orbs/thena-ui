import BigNumber from 'bignumber.js'
import { gql } from 'graphql-request'
import React, { useMemo } from 'react'
import useSWRImmutable from 'swr/immutable'

import { useAssets } from '@/context/assetsContext'
import useWallet from '@/hooks/useWallet'
import { voterSubgraph } from '@/lib/graphql'
import { fromWei, isInvalidAmount } from '@/lib/utils'
import { useV3PoolsWithGauge } from '@/state/pools/hooks'

const rewardsContext = React.createContext({
  current: {
    rewards: [],
    currentMutate: () => {},
  },
})

const V3_GET_USER_REWARDS = gql`
  query V3_GET_USER_REWARDS($user: Bytes = "") {
    userRewards(where: { user: $user }) {
      id
      lastUpdate
      pool {
        votingIncentive
        createdAt
        gauge
        id
        isActive
      }
      rewardAmount
      rewardToken
      user
    }
  }
`

const fetchUserRewards = async (userId, chainId) => {
  try {
    const { userRewards } = await voterSubgraph[chainId].request(V3_GET_USER_REWARDS, {
      user: userId,
    })

    const flattenedRewards = (userRewards || []).map(reward => ({
      id: reward.id,
      lastUpdate: reward.lastUpdate,
      pool: reward.pool,
      rewardAmount: reward.rewardAmount,
      rewardToken: reward.rewardToken,
      user: reward.user,
      votingIncentives: reward.pool?.votingIncentive || null,
    }))
    return flattenedRewards
  } catch (e) {
    console.error(e)
    return []
  }
}

function RewardsContextProvider({ children }) {
  const { account, chainId } = useWallet()
  const assets = useAssets()
  const v3PoolsWithGauge = useV3PoolsWithGauge(false)

  const {
    data: current,
    error: currentError,
    mutate: currentMutate,
  } = useSWRImmutable(account && chainId ? ['current rewards api', account, chainId] : null, () =>
    fetchUserRewards(account.toLowerCase(), chainId),
  )

  const currentRewards = useMemo(() => {
    if (!current || !current.length) return []
    if (currentError) {
      console.log('current rewards error :>> ', currentError)
      return []
    }

    return v3PoolsWithGauge
      .map(pool => {
        const result = {}
        const isFeeExist = false
        const isBribeExist = false
        const userPoolRewards = current.filter(reward => reward?.pool?.id === pool?.address)
        if (userPoolRewards && userPoolRewards.length) {
          userPoolRewards.forEach(userPoolReward => {
            const { rewardAmount, rewardToken } = userPoolReward
            result[rewardToken] = {
              address: rewardToken,
              amount: !result[rewardToken]
                ? fromWei(rewardAmount)
                : result[rewardToken].amount.plus(fromWei(rewardAmount)),
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
  }, [current, currentError, v3PoolsWithGauge, assets])

  const final = useMemo(
    () => ({
      current: {
        rewards: currentRewards,
        currentMutate,
      },
    }),
    [currentRewards, currentMutate],
  )

  return <rewardsContext.Provider value={final}>{children}</rewardsContext.Provider>
}

export { rewardsContext, RewardsContextProvider }
