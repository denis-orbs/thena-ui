import { gql } from 'graphql-request'
import useSWR from 'swr'

import { v4Client } from '@/lib/graphql'

const V4_TC_TRADE_HISTORY = gql`
  query V4_TC_TRADE_HISTORY($id: String!, $account: String!) {
    tcTrades(where: { tradingCompetition: { id_eq: $id }, user: { id_eq: $account } }) {
      id
      amountIn
      amountOut
      timestamp
      txHash
      tokenOut {
        symbol
        id
      }
      tokenIn {
        symbol
        id
      }
    }
  }
`

const fetchTCTradeHistory = async (id, account) => {
  try {
    const { tcTrades } = await v4Client.request(V4_TC_TRADE_HISTORY, { id, account })

    return tcTrades
  } catch (error) {
    return { error: true }
  }
}

export const useTCTradeHistory = (id, account) => {
  const { data } = useSWR(['tc trade history api', id, account], () => fetchTCTradeHistory(id, account), {
    refreshInterval: 30000,
    revalidateOnFocus: true,
  })

  return data
}
