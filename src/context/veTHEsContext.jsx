import BigNumber from 'bignumber.js'
import dayjs from 'dayjs'
import React, { useContext, useMemo } from 'react'
import useSWRImmutable from 'swr/immutable'
import { ChainId } from 'thena-sdk-core/dist'

import { readCall } from '@/lib/contractActions'
import { getVeTHEAPIContract } from '@/lib/contracts'
import { fromWei } from '@/lib/utils'
import useWallet from '@/lib/wallets/useWallet'

const veTHEsContext = React.createContext({
  veTHEs: [],
})

async function fetchUserVeTHEs([_, account, chainId]) {
  console.log('------------------ vethes --------------------------')
  const contract = getVeTHEAPIContract(chainId)
  const veTHEInfos = await readCall(contract, 'getNFTFromAddress', [account], chainId)
  return veTHEInfos.map(veTHE => {
    const { votes, vote_ts, voted, id, amount, voting_amount, rebase_amount, lockEnd } = veTHE
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
      expire: diff > 0 ? `Expires in ${diff} days` : `Expired ${diff * -1} days ago`,
    }
  })
}

function VeTHEsContextProvider({ children }) {
  const { account, chainId } = useWallet()
  const { data, isLoading, error, mutate } = useSWRImmutable(
    account && chainId === ChainId.BSC ? ['vethes api', account, chainId] : null,
    {
      fetcher: fetchUserVeTHEs,
    },
  )

  const result = useMemo(() => {
    if (error) {
      console.log('vethes api error :>> ', error)
    }
    return {
      veTHEs: data ?? [],
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
