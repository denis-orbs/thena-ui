import BigNumber from 'bignumber.js'
import { gql } from 'graphql-request'
import React, { useMemo } from 'react'
import useSWRImmutable from 'swr/immutable'
import { ChainId } from 'thena-sdk-core'

import { rewardsAPIAbi } from '@/constant/abi'
import Contracts from '@/constant/contracts'
import { useAssets } from '@/context/assetsContext'
import useWallet from '@/hooks/useWallet'
import { callMulti } from '@/lib/contractActions'
import { v3ClientSubGraph } from '@/lib/graphql'
import { fromWei } from '@/lib/utils'
import { usePoolsWithGauge } from '@/state/pools/hooks'

const rewardsContext = React.createContext({
  current: {
    rewards: [],
    currentMutate: () => {},
  },
  next: {
    rewards: [],
    nextMutate: () => {},
  },
})

// const fetchCurrentRewards = async (_, account, chainId, pools) => {
//   console.log('--------------current start---------------')
//   const res = await callMulti(
//     pools.map(pool => ({
//       address: Contracts.veTHEAPI[chainId],
//       abi: veTHEApiAbi,
//       functionName: 'singlePairRewardAddress',
//       args: [account, pool],
//       chainId,
//     })),
//   )
//   console.log('-------------current end--------')
//   return res
// }

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
      tokenId
      user
    }
  }
`

const fetchUserRewards = async userId => {
  try {
    const { userRewards } = await v3ClientSubGraph.request(V3_GET_USER_REWARDS, {
      user: userId,
    })

    const flattenedRewards = (userRewards || []).map(reward => ({
      id: reward.id,
      lastUpdate: reward.lastUpdate,
      pool: reward.pool,
      rewardAmount: reward.rewardAmount,
      rewardToken: reward.rewardToken,
      tokenId: reward.tokenId,
      user: reward.user,
      votingIncentives: reward.pool?.votingIncentives || null,
    }))
    return flattenedRewards
  } catch (e) {
    console.error(e)
    return []
  }
}

const fetchNextRewards = async (_, account, chainId, pools) => {
  console.log('--------------next---------------')
  return await callMulti(
    pools.map(pool => ({
      address: Contracts.rewardsAPI[chainId],
      abi: rewardsAPIAbi,
      functionName: 'getExpectedClaimForNextEpochAddress',
      args: [account, [pool]],
      chainId,
    })),
  )
}

function RewardsContextProvider({ children }) {
  const { account, chainId } = useWallet()
  const assets = useAssets()
  const pools = usePoolsWithGauge()
  const gaugeAddresses = useMemo(
    () => pools.map(pool => pool.address),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(pools.map(pool => pool.address))],
  )
  // const {
  //   data: current,
  //   error: currentError,
  //   mutate: currentMutate,
  // } = useSWRImmutable(
  //   account && gaugeAddresses.length > 0 && chainId === ChainId.BSC ? ['current rewards api', account] : null,
  //   ([url, acc]) => fetchCurrentRewards(url, acc, chainId, gaugeAddresses),
  //   {
  //     refreshInterval: 60000,
  //   },
  // )

  const {
    data: next,
    error: nextError,
    mutate: nextMutate,
  } = useSWRImmutable(
    account && gaugeAddresses.length > 0 && chainId === ChainId.BSC ? ['next rewards api', account] : null,
    ([url, acc]) => fetchNextRewards(url, acc, chainId, gaugeAddresses),
    {
      refreshInterval: 60000,
    },
  )

  const {
    data: current,
    error: currentError,
    mutate: currentMutate,
  } = useSWRImmutable(
    account && gaugeAddresses.length > 0 && chainId === 97 ? ['current rewards api', account] : null,
    () => fetchUserRewards(account.toLowerCase()),
  )

  const currentRewards = useMemo(() => {
    if (!current || !current.length) return []
    if (currentError) {
      console.log('current rewards error :>> ', currentError)
      return []
    }

    return pools
      .map(pool => {
        const result = {}
        const isFeeExist = false
        const isBribeExist = false
        const userPoolRewards = current.filter(reward => reward?.pool === pool?.address)
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
        // if (current[index]) {
        //   current[index].forEach((reward, idx) => {
        //     const { amount, decimals, token } = reward
        //     if (idx < 2) {
        //       isFeeExist = isFeeExist || amount > 0
        //     } else {
        //       isBribeExist = isBribeExist || amount > 0
        //     }
        //     if (Number(amount) > 0) {
        //       result[token] = {
        //         address: token,
        //         amount: !result[token]
        //           ? fromWei(amount, decimals)
        //           : result[token].amount.plus(fromWei(amount, decimals)),
        //       }
        //     }
        //   })
        // }
        return {
          ...pool,
          rewards: Object.values(result),
          isFeeExist,
          isBribeExist,
          votingIncentives: userPoolRewards?.[0]?.votingIncentives,
          tokenId: userPoolRewards?.[0]?.tokenId,
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
  }, [current, currentError, pools, assets])

  const nextRewards = useMemo(() => {
    if (!next || !next.length) return []
    if (nextError) {
      console.log('next rewards error :>> ', nextError)
      return []
    }
    return pools
      .map((pool, index) => {
        const result = {}
        // bribes
        if (!next[index] || !next[index].length) {
          return {
            ...pool,
            rewards: Object.values(result),
          }
        }
        const { tokens, decimals, amounts } = next[index][0].bribes[0]
        tokens.forEach((token, idx) => {
          if (amounts[idx] > 0) {
            result[token] = {
              address: token,
              amount: !result[token]
                ? fromWei(amounts[idx], decimals[idx])
                : result[token].amount.plus(fromWei(amounts[idx], decimals[idx])),
            }
          }
        })

        // fees
        const { tokens: feeTokens, decimals: feeDecimals, amounts: feeAmounts } = next[index][0].bribes[1]
        feeTokens.forEach((token, idx) => {
          if (Number(feeAmounts[idx]) > 0) {
            result[token] = {
              address: token,
              amount: !result[token]
                ? fromWei(Number(feeAmounts[idx]), Number(feeDecimals[idx]))
                : result[token].amount.plus(fromWei(Number(feeAmounts[idx]), Number(feeDecimals[idx]))),
            }
          }
        })
        return {
          ...pool,
          rewards: Object.values(result),
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
  }, [next, nextError, assets, pools])

  const final = useMemo(
    () => ({
      current: {
        rewards: currentRewards,
        currentMutate,
      },
      next: {
        rewards: nextRewards,
        nextMutate,
      },
    }),
    [currentRewards, currentMutate, nextRewards, nextMutate],
  )

  return <rewardsContext.Provider value={final}>{children}</rewardsContext.Provider>
}

export { rewardsContext, RewardsContextProvider }
