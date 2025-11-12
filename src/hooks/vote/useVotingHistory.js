import BigNumber from 'bignumber.js'
import { gql } from 'graphql-request'
import { useState } from 'react'
import useSWR from 'swr'

import Contracts from '@/constant/contracts'
import { useAssets } from '@/context/assetsContext'
import { batchCallMulti } from '@/lib/contractActions'
import { getVoterV3Contract } from '@/lib/contracts'
import { voterSubgraph } from '@/lib/graphql'
import { fromWei } from '@/lib/utils'

import useWallet from '../useWallet'

const VOTE_LIST_QUERY = gql`
  query voteList($voter: String!, $skip: Int!) {
    voteList: userVotePerEpoches(first: 1000, skip: $skip, where: { user: $voter, votes_: { isVoted: true } }) {
      id
      epochStartTimestamp
      votes {
        vetheBalance
      }
    }
  }
`

const getVoteListData = async (chainId, voter) => {
  try {
    let results = []
    const PAGE_SIZE = 1000
    let skip = 0
    let hasMore = true

    while (hasMore) {
      const res = await voterSubgraph[chainId].request(VOTE_LIST_QUERY, { voter, skip })

      const voteList = res?.voteList || []
      results = results.concat(voteList)

      if (voteList.length < PAGE_SIZE) {
        hasMore = false
      } else {
        skip += PAGE_SIZE
      }
    }

    return results
  } catch (error) {
    console.error('getVoteListData error :>> ', error)
    return []
  }
}

const VOTING_REWARDS_QUERY = gql`
  query votingRewards($skip: Int!, $epochStartTimestamps: [BigInt!]!, $poolAddresses: [String!]!) {
    poolRewards: votingRewards(
      where: {
        votingIncentive_: { isActive: true, pool_in: $poolAddresses }
        epochStartTimestamp_in: $epochStartTimestamps
      }
      first: 1000
      skip: $skip
      orderBy: epochStartTimestamp
      orderDirection: desc
    ) {
      epochStartTimestamp
      rewardToken
      rewardTokenDecimals
      rewardsPerEpoch
      votingIncentive {
        pool {
          id
        }
      }
    }
  }
`

const getVotingRewardsData = async (chainId, epochStartTimestamps, poolAddresses) => {
  try {
    let results = []
    const PAGE_SIZE = 1000
    let skip = 0
    let hasMore = true

    while (hasMore) {
      const res = await voterSubgraph[chainId].request(VOTING_REWARDS_QUERY, {
        skip,
        epochStartTimestamps,
        poolAddresses,
      })

      const rewards = res?.poolRewards || []
      results = results.concat(rewards)

      if (rewards.length < PAGE_SIZE) {
        hasMore = false
      } else {
        skip += PAGE_SIZE
      }
    }

    const poolRewards = results.reduce((acc, curr) => {
      const key = `${curr.votingIncentive.pool.id}-${curr.epochStartTimestamp}`
      acc[key] = (acc[key] || []).concat([curr])
      return acc
    }, {})

    return poolRewards
  } catch (error) {
    console.error('getVotingRewardsData error :>> ', error)
    return {}
  }
}

const POOL_VOTE_PER_EPOCH_QUERY = gql`
  query poolVotePerEpoches($skip: Int!, $epochStartTimestamps: [BigInt!]!) {
    poolVotePerEpoches(
      first: 1000
      skip: $skip
      where: { votingIncentive_: { isActive: true }, epochStartTimestamp_in: $epochStartTimestamps }
    ) {
      epochStartTimestamp
      totalVotes
      pool
      id
    }
  }
`

const getPoolVotePerEpochData = async (chainId, epochStartTimestamps) => {
  try {
    let results = []
    const PAGE_SIZE = 1000
    let skip = 0
    let hasMore = true

    while (hasMore) {
      const res = await voterSubgraph[chainId].request(POOL_VOTE_PER_EPOCH_QUERY, {
        skip,
        epochStartTimestamps,
      })

      const poolVotePerEpoches = res?.poolVotePerEpoches || []
      results = results.concat(poolVotePerEpoches)

      if (poolVotePerEpoches.length < PAGE_SIZE) {
        hasMore = false
      } else {
        skip += PAGE_SIZE
      }
    }

    const poolVoteKeys = Array.from(new Set(results.map(p => p.id)))

    const contract = getVoterV3Contract(chainId)

    const poolVoteResults = await batchCallMulti(
      poolVoteKeys.map(key => {
        const [pool, epochStartTimestamp] = key.split('-')
        return {
          ...contract,
          functionName: 'poolTotalWeights',
          args: [pool, epochStartTimestamp],
        }
      }),
      50,
    )

    const poolVotePerEpochs = poolVoteResults.reduce((acc, curr, index) => {
      const [pool, epochStartTimestamp] = poolVoteKeys[index].split('-')
      acc[poolVoteKeys[index]] = {
        epochStartTimestamp,
        pool,
        totalVotes: Number(curr),
      }
      return acc
    }, {})

    return poolVotePerEpochs
  } catch (error) {
    console.error('getPoolVotePerEpochData error :>> ', error)
    return {}
  }
}

const VOTE_HISTORIES_QUERY = tokenId => gql`
  query userVoteHistories($voter: String!, $skip: Int!, $limit: Int!${tokenId ? ', $tokenId: Int!' : ''}) {
    votes: userVotePerEpoches(
      where: { user: $voter, votes_: { isVoted: true } }
      first: $limit
      skip: $skip
      orderBy: epochStartTimestamp
      orderDirection: desc
    ) {
      user
      epochStartTimestamp
      votes(where: { ${tokenId ? 'tokenId: $tokenId, ' : ''} voter: $voter }) {
        tokenId
        epochStartTimestamp
        vetheBalance
        poolVotes: userPoolVotes(where: { isRemoved: false, votingIncentive_: { isActive: true } }) {
          totalWeight
          weight
          totalVotes
          lastUpdate
          pool {
            id
          }
        }
      }
    }
  }
`

const getVoteHistoriesData = async (chainId, voter, tokenId, limit = 10, skip = 0) => {
  try {
    const res = await voterSubgraph[chainId].request(VOTE_HISTORIES_QUERY(tokenId), {
      voter,
      skip,
      limit,
      ...(tokenId ? { tokenId } : {}),
    })

    return res?.votes ?? []
  } catch (error) {
    console.log('getVoteHistoriesData error :>> ', error)
    return []
  }
}

const fetchVotingHistory = async ({ tokenId, limit = 10, skip = 0, userAddress, chainId, assets }) => {
  if (!userAddress || !chainId) return null
  try {
    const [voteList, history] = await Promise.all([
      getVoteListData(chainId, userAddress),
      getVoteHistoriesData(chainId, userAddress, tokenId, limit, skip),
    ])

    const epochStartTimestamps = history.map(h => h.epochStartTimestamp)
    const poolAddresses = history.reduce((acc, curr) => {
      curr.votes.forEach(v => {
        v.poolVotes.forEach(p => {
          acc.add(p.pool.id)
        })
      })
      return acc
    }, new Set())

    const [poolRewards, poolVotePerEpochs] = await Promise.all([
      getVotingRewardsData(chainId, epochStartTimestamps, Array.from(poolAddresses)),
      getPoolVotePerEpochData(chainId, epochStartTimestamps),
    ])

    const theAsset = assets.find(a => a.address.toLowerCase() === Contracts.THE[chainId].toLowerCase())
    const thePrice = Number(theAsset?.price || 0)

    const totalVotesPerEpoch = Object.values(poolVotePerEpochs).reduce((acc, curr) => {
      const key = curr.epochStartTimestamp
      acc[key] = (acc[key] ?? new BigNumber(0)).plus(curr.totalVotes)
      return acc
    }, {})

    const voteHistory = history.map(vote => {
      const votes = vote.votes.map(v => {
        const vetheBalance = fromWei(v.vetheBalance)

        const poolVotes = v.poolVotes.map(p => {
          const key = `${p.pool.id}-${vote.epochStartTimestamp}`
          const poolReward = poolRewards[key] ?? []
          const poolTotalVotes = fromWei(poolVotePerEpochs[key]?.totalVotes ?? 0)
          const vetheLocked = fromWei(p.totalVotes ?? 0)
          const votePercentage = poolTotalVotes.gt(0) ? vetheLocked.div(poolTotalVotes) : new BigNumber(0)
          const vetheLockedUSD = vetheLocked.times(thePrice).toNumber()

          let rewardsUSD = 0
          const tokenRewards = poolReward.map(r => {
            const asset = assets.find(a => a.address.toLowerCase() === r.rewardToken.toLowerCase())
            const voteReward = votePercentage.times(r.rewardsPerEpoch).toNumber()

            const rewardAmount = fromWei(voteReward, asset?.decimals ?? 18)
            rewardsUSD += rewardAmount.times(asset?.price ?? 0).toNumber()

            return {
              token: r.rewardToken.toLowerCase(),
              amount: rewardAmount,
            }
          })

          return {
            ...p,
            totalVote: vetheLocked.toNumber(),
            rewards: tokenRewards || [],
            rewardsUSD,
            apr: vetheLocked
              ? new BigNumber(rewardsUSD ?? 0)
                  .div(vetheLockedUSD)
                  .times(52 * 100)
                  .toNumber()
              : 0,
            totalVotes: undefined,
            totalWeight: undefined,
          }
        })

        return { ...v, vetheBalance, poolVotes }
      })

      return {
        ...vote,
        epochTotalVotes: fromWei(totalVotesPerEpoch[vote.epochStartTimestamp]).toNumber(),
        votes: votes.filter(v => v.poolVotes.length > 0),
      }
    })
    const data = voteHistory.filter(v => v.votes.length > 0)

    if (data) {
      const result = data.map(item => ({
        ...item,
        totalVetheBalance: (item.votes || []).reduce((sum, vote) => sum + parseFloat(vote?.vetheBalance || 0), 0),
        totalVotesEpoch: item.epochTotalVotes,
      }))
      return {
        skip,
        limit,
        total: voteList.length,
        data: result,
      }
    }
    return null
  } catch (error) {
    console.error(error)
    return null
  }
}

export const useVotingHistory = veTHEId => {
  const { account, chainId } = useWallet()
  const [currentPage, setCurrentPage] = useState(1)
  const assets = useAssets()
  const { data: epochVotingHistory, isLoading } = useSWR(
    account && chainId && ['epochVotingHistory', account, currentPage, veTHEId, assets.length],
    () =>
      fetchVotingHistory({
        tokenId: veTHEId !== 'All' ? veTHEId : undefined,
        limit: 10,
        skip: (currentPage - 1) * 10,
        userAddress: account,
        chainId,
        assets,
      }),
    {
      refreshInterval: 0,
    },
  )

  return {
    epochVotingHistory,
    isLoading,
    setCurrentPage,
    currentPage,
  }
}
