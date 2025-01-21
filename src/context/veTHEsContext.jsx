import BigNumber from 'bignumber.js'
import dayjs from 'dayjs'
import React, { useContext, useMemo } from 'react'
import useSWR from 'swr'

import useWallet from '@/hooks/useWallet'
import { fetchVeTHETokens } from '@/lib/api'

const veTHEsContext = React.createContext({
  veTHEs: [],
})

function VeTHEsContextProvider({ children }) {
  const { account, chainId } = useWallet()

  const { data, isLoading, error, mutate } = useSWR(account ? ['vethes api', account, chainId] : null, () =>
    fetchVeTHETokens(chainId, account),
  )

  const result = useMemo(() => {
    if (error) {
      console.log('vethes api error :>> ', error)
    }

    const finalData = (data || []).map(veTHE => {
      const { amount, rebaseAmount, votingAmount, tokenId, lockedEnd, votes, voted, votedCurrentEpoch } = veTHE
      const totalWeight = votes.reduce((sum, current) => sum + current.weight, 0)
      const diff = dayjs.unix(Number(lockedEnd)).diff(dayjs(), 'days')

      return {
        voted,
        votedCurrentEpoch,
        id: Number(tokenId),
        amount: new BigNumber(amount),
        voting_amount: new BigNumber(votingAmount),
        rebase_amount: new BigNumber(rebaseAmount),
        lockedEnd: Number(lockedEnd),
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
