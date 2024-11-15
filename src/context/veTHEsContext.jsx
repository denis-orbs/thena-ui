import BigNumber from 'bignumber.js'
import dayjs from 'dayjs'
import { gql } from 'graphql-request'
import React, { useContext, useMemo } from 'react'
import useSWR from 'swr'

import useWallet from '@/hooks/useWallet'
import { readCall } from '@/lib/contractActions'
import { getVeTHEAPIContract } from '@/lib/contracts'
import { v3ClientSubGraph } from '@/lib/graphql'
import { fromWei } from '@/lib/utils'

const veTHEsContext = React.createContext({
  veTHEs: [],
})

const V3_VETHE_TOKEN = gql`
  query V3_VETHE_TOKEN($account: String!) {
    veTokens(where: { account: $account }) {
      id
      tokenId
      lockedAt
      lockedEnd
      decimals
      attachments
      amount
      account
      rebaseAmount
      token
      voted
      votingAmount
    }
  }
`

const fetVeTHEToken = async account => {
  try {
    const { veTokens } = await v3ClientSubGraph.request(V3_VETHE_TOKEN, { account })
    if (veTokens) {
      return veTokens
    }
    return null
  } catch (error) {
    console.trace(error)
    return null
  }
}

// async function fetchVeTHEsFromAddress([_, account, chainId]) {
//   console.log('------------------ vethes from address --------------------------')
//   const contract = getVeTHEAPIContract(chainId)
//   const veTHEInfos = await readCall(contract, 'getNFTFromAddress', [account], chainId)
//   return veTHEInfos.map(veTHE => {
//     const { votes, vote_ts, voted, id, amount, voting_amount, rebase_amount, lockEnd } = veTHE
//     const totalWeight = votes.reduce((sum, current) => sum + current.weight, 0n)
//     const votedWeek = Math.floor(Number(vote_ts) / (86400 * 7))
//     const currentWeek = Math.floor(new Date().getTime() / (86400 * 7 * 1000))
//     const votedCurrentEpoch = votedWeek === currentWeek && voted
//     const diff = dayjs.unix(Number(lockEnd)).diff(dayjs(), 'days')

//     return {
//       voted,
//       votedCurrentEpoch,
//       id: Number(id),
//       amount: fromWei(amount),
//       voting_amount: fromWei(voting_amount),
//       rebase_amount: fromWei(rebase_amount),
//       lockedEnd: Number(lockEnd),
//       vote_ts: Number(vote_ts),
//       votes: votes.map(ele => ({
//         address: ele.pair,
//         weight: fromWei(ele.weight),
//         weightPercent: totalWeight > 0 ? new BigNumber(ele.weight).div(totalWeight).times(100) : new BigNumber(0),
//       })),
//       expire: diff,
//     }
//   })
// }

export async function fetchVeTHEFromId(veTHEId, chainId) {
  console.log('------------------ vethes id --------------------------')
  const contract = getVeTHEAPIContract(chainId)
  const veTHEInfo = await readCall(contract, 'getNFTFromId', [veTHEId], chainId)
  const { votes, vote_ts, voted, id, amount, voting_amount, rebase_amount, lockEnd } = veTHEInfo
  const totalWeight = votes.reduce((sum, current) => sum + current.weight, 0n)
  const votedWeek = Math.floor(Number(vote_ts) / (86400 * 7))
  const currentWeek = Math.floor(new Date().getTime() / (86400 * 7 * 1000))
  const votedCurrentEpoch = votedWeek === currentWeek && voted
  const diff = dayjs.unix(Number(lockEnd)).diff(dayjs(), 'days')

  return {
    voted,
    votedCurrentEpoch,
    id: Number(id),
    amount: fromWei(amount),
    voting_amount: fromWei(voting_amount),
    rebase_amount: fromWei(rebase_amount),
    lockedEnd: Number(lockEnd),
    vote_ts: Number(vote_ts),
    votes: votes.map(ele => ({
      address: ele.pair,
      weight: fromWei(ele.weight),
      weightPercent: totalWeight > 0 ? new BigNumber(ele.weight).div(totalWeight).times(100) : new BigNumber(0),
    })),
    expire: diff,
  }
}

function VeTHEsContextProvider({ children }) {
  const { account } = useWallet()
  const { data, isLoading, error, mutate } = useSWR(account ? ['vethes api', account] : null, () =>
    fetVeTHEToken(account),
  )

  const result = useMemo(() => {
    if (error) {
      console.log('vethes api error :>> ', error)
    }

    const finalData = (data || []).map(veTHE => {
      const {
        votes = [],
        lockedAt: vote_ts,
        voted,
        tokenId,
        amount,
        votingAmount: voting_amount,
        rebaseAmount: rebase_amount,
        lockedEnd: lockEnd,
      } = veTHE
      const totalWeight = votes.reduce((sum, current) => sum + current.weight, 0n)
      const votedWeek = Math.floor(Number(vote_ts) / (86400 * 7))
      const currentWeek = Math.floor(new Date().getTime() / (86400 * 7 * 1000))
      const votedCurrentEpoch = votedWeek === currentWeek && voted
      const diff = dayjs.unix(Number(lockEnd)).diff(dayjs(), 'days')

      return {
        voted,
        votedCurrentEpoch,
        id: Number(tokenId),
        amount: fromWei(amount),
        voting_amount: fromWei(voting_amount),
        rebase_amount: fromWei(rebase_amount),
        lockedEnd: Number(lockEnd),
        vote_ts: Number(vote_ts),
        votes: votes.map(ele => ({
          address: ele.pair,
          weight: fromWei(ele.weight),
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
