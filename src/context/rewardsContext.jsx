import BigNumber from 'bignumber.js'
import React, { useMemo } from 'react'
import useSWRImmutable from 'swr/immutable'
import { ChainId } from 'thena-sdk-core'

import { rewardsAPIAbi, veTHEApiAbi } from '@/constant/abi'
import Contracts from '@/constant/contracts'
import { useAssets } from '@/context/assetsContext'
import { callMulti } from '@/lib/contractActions'
import { fromWei } from '@/lib/utils'
import useWallet from '@/lib/wallets/useWallet'
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

const fetchCurrentRewards = async (_, account, chainId, pools) => {
  console.log('--------------current---------------')
  return await callMulti(
    pools.map(pool => ({
      address: Contracts.veTHEAPI[chainId],
      abi: veTHEApiAbi,
      functionName: 'singlePairRewardAddress',
      args: [account, pool],
      chainId,
    })),
  )
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
  const {
    data: current,
    error: currentError,
    mutate: currentMutate,
  } = useSWRImmutable(
    account && gaugeAddresses.length > 0 && chainId === ChainId.BSC ? ['current rewards api', account] : null,
    ([url, acc]) => fetchCurrentRewards(url, acc, chainId, gaugeAddresses),
    {
      refreshInterval: 60000,
    },
  )
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

  const currentRewards = useMemo(() => {
    if (!current || !current.length) return []
    if (currentError) {
      console.log('current rewards error :>> ', currentError)
      return []
    }

    return pools
      .map((pool, index) => {
        const result = {}
        let isFeeExist = false
        let isBribeExist = false
        if (current[index]) {
          current[index].forEach((reward, idx) => {
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
  }, [current, currentError, assets, pools])

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
