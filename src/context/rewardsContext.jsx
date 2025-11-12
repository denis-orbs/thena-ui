import BigNumber from 'bignumber.js'
import React, { useMemo } from 'react'
import { ChainId } from 'thena-sdk-core'
import { zeroAddress } from 'viem'
import { useReadContracts } from 'wagmi'

import { VeTHEAPIABI } from '@/constant/abi/ve/VeTHEAPIABI'
import Contracts from '@/constant/contracts'
import { useAssets } from '@/context/assetsContext'
import useWallet from '@/hooks/useWallet'
import { useUserVotingRewards } from '@/hooks/vote/useUserVotingRewards'
import { fromWei, isInvalidAmount } from '@/lib/utils'
import { usePools, useV3PoolsWithGauge } from '@/state/pools/hooks'

const rewardsContext = React.createContext({
  current: {
    rewards: [],
    currentMutate: () => {},
  },
})

function RewardsContextProvider({ children }) {
  const assets = useAssets()
  const v3PoolsWithGauge = useV3PoolsWithGauge(false)

  const { data: current, error: currentError, mutate: currentMutate } = useUserVotingRewards()

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
        const userPoolRewards = current.filter(reward => reward?.pool === pool?.address)
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

export const useGetVeRewardV2 = () => {
  const { account, chainId } = useWallet()
  const assets = useAssets()
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
    data: veRewards,
    error,
    refetch: refetchVetheRewardV2,
    isLoading,
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

  const currentRewardsV2 = useMemo(() => {
    if (!veRewards || !veRewards.length || error) return []

    return poolsV2
      .map((pool, index) => {
        const result = {}
        let isFeeExist = false
        let isBribeExist = false
        if (veRewards?.[index]?.result) {
          veRewards[index].result.forEach((reward, idx) => {
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
  }, [assets, veRewards, error, poolsV2])

  return {
    veRewardsV2: veRewards,
    errorV2: error,
    refetchVetheRewardV2,
    currentRewardsV2,
    isLoading,
  }
}

export { rewardsContext, RewardsContextProvider }
