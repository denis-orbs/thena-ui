import BigNumber from 'bignumber.js'
import dayjs from 'dayjs'
import { gql } from 'graphql-request'
import { omit } from 'lodash'
import React, { useContext, useMemo } from 'react'
import useSWR from 'swr'

import { veDistAbi, veTHEAbi, voterAbi } from '@/constant/abi'
import Contracts from '@/constant/contracts'
import useWallet from '@/hooks/useWallet'
import { callMulti, readCall } from '@/lib/contractActions'
import { getVoterContract } from '@/lib/contracts'
import { vetheClient } from '@/lib/graphql'
import { fromWei } from '@/lib/utils'

const createCallMulti = (calls, abi) =>
  callMulti(
    calls.map(call => ({
      abi,
      address: call.address,
      functionName: call.name,
      args: call.params,
    })),
  )

const getAllVeThesData = async (vethes, chainId, epochTimestamp) => {
  const tokenIdVotesCalls = []
  const claimableCalls = []
  const votingAmountCalls = []
  const votedCalls = []

  vethes.forEach(ve => {
    tokenIdVotesCalls.push({
      address: Contracts.voter[chainId],
      name: 'tokenIdVotes',
      params: [ve.tokenId, epochTimestamp],
    })

    claimableCalls.push({
      address: Contracts.veDist[chainId],
      name: 'claimable',
      params: [ve.tokenId],
    })

    votingAmountCalls.push({
      address: Contracts.veTHE[chainId],
      name: 'balanceOfNFT',
      params: [ve.tokenId],
    })

    votedCalls.push({
      address: Contracts.veTHE[chainId],
      name: 'voted',
      params: [ve.tokenId],
    })
  })

  const [tokenIdVotesRes, rebaseAmountRes, votingAmountRes, votedRes] = await Promise.all([
    createCallMulti(tokenIdVotesCalls, voterAbi),
    createCallMulti(claimableCalls, veDistAbi),
    createCallMulti(votingAmountCalls, veTHEAbi),
    createCallMulti(votedCalls, veTHEAbi),
  ])

  const results = []

  for (let i = 0; i < vethes.length; i++) {
    const item = vethes[i]
    const tokenIdVotes = tokenIdVotesRes[i]
    const rebaseAmount = rebaseAmountRes[i]
    const votingAmount = votingAmountRes[i]
    const voted = votedRes[i]

    const poolVotes = tokenIdVotes.pools || []
    const poolWeights = tokenIdVotes.weights || []
    const vetheBalance = tokenIdVotes.vetheBalance || 0
    const totalWeight = tokenIdVotes.totalWeight || 1

    const votes = poolVotes.map((pool, index) => ({
      pair: pool.toLowerCase(),
      weight:
        Number(totalWeight) > 0
          ? fromWei(Number(vetheBalance))
              .times(Number(poolWeights[index] ?? 0))
              .div(Number(totalWeight))
              .toNumber()
          : 0,
    }))

    results.push({
      ...item,
      token: Contracts.THE[chainId].toLowerCase(),
      decimals: 18,
      votes,
      amount: fromWei(Number(item.amount ?? 0)).toNumber(),
      rebaseAmount: fromWei(Number(rebaseAmount ?? 0)).toNumber(),
      votingAmount: fromWei(Number(votingAmount ?? 0)).toNumber(),
      voted,
      votedCurrentEpoch: !!votes.length,
    })
  }

  return results
}
const VETHE_GQL_QUERY = gql`
  query veTokens($address: String!) {
    veTokens(where: { account: $address }) {
      id
      account
      amount
      tokenId
      lockedAt
      lockedEnd
    }
  }
`

const getVethesData = async (chainId, address) => {
  const data = await vetheClient[chainId].request(VETHE_GQL_QUERY, {
    address,
  })

  return data.veTokens
}

const getEpochTimestamp = async chainId => {
  const voterContract = getVoterContract(chainId)
  return await readCall(voterContract, 'epochTimestamp', [], chainId)
}

const fetchVeTHETokens = async (chainId, address) => {
  try {
    const [epochTimestamp, vethes] = await Promise.all([getEpochTimestamp(chainId), getVethesData(chainId, address)])

    const results = await getAllVeThesData(vethes, chainId, epochTimestamp)

    return results.map(o => omit(o, ['id']))
  } catch (err) {
    console.error('fetchVeTHETokens error :>> ', err)
    return []
  }
}

const veTHEsContext = React.createContext({
  veTHEs: [],
})

function VeTHEsContextProvider({ children }) {
  const { account, chainId } = useWallet()

  const { data, isLoading, error, mutate } = useSWR(account ? ['vethes api', account, chainId] : null, () =>
    fetchVeTHETokens(chainId, account?.toLowerCase()),
  )

  const result = useMemo(() => {
    if (error) {
      console.error('vethes api error :>> ', error)
    }

    const finalData = (data || []).map(veTHE => {
      const { amount, rebaseAmount, votingAmount, tokenId, lockedEnd, lockedAt, votes, voted, votedCurrentEpoch } =
        veTHE
      const totalWeight = votes.reduce((sum, current) => sum + Number(current.weight), 0)
      const diff = dayjs.unix(Number(lockedEnd)).diff(dayjs(), 'days')
      return {
        voted,
        votedCurrentEpoch,
        id: Number(tokenId),
        amount: new BigNumber(amount),
        voting_amount: new BigNumber(votingAmount),
        rebase_amount: new BigNumber(rebaseAmount),
        lockedEnd: Number(lockedEnd),
        lockedAt: Number(lockedAt),
        votes: votes.map(ele => ({
          address: ele.pair,
          weight: new BigNumber(ele.weight),
          weightPercent: totalWeight > 0 ? new BigNumber(ele.weight).div(totalWeight).times(100) : new BigNumber(0),
        })),
        expire: diff,
      }
    })
    return {
      veTHEs: finalData ?? [],
      isLoading,
      updateVeTHEs: () => {
        mutate()
      },
    }
  }, [data, error, isLoading, mutate])

  return <veTHEsContext.Provider value={result}>{children}</veTHEsContext.Provider>
}

function useVeTHEsContext() {
  return useContext(veTHEsContext)
}

export { useVeTHEsContext, VeTHEsContextProvider }
