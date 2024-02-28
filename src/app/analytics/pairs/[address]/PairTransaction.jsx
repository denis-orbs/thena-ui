'use client'

import dayjs from 'dayjs'
import { gql } from 'graphql-request'
import { useMemo, useState } from 'react'
import useSWRImmutable from 'swr/immutable'

import Table from '@/components/table'
import Tabs from '@/components/tabs'
import { Paragraph, TextHeading } from '@/components/typography'
import { SizeTypes } from '@/constant/type'
import { fusionClient, v1Client } from '@/lib/graphql'
import { formatAmount, goScan } from '@/lib/utils'
import { useChainSettings } from '@/state/settings/hooks'

const TXN_TYPE = {
  All: 'All',
  SWAP: 'Swaps',
  ADD: 'Additions',
  REMOVE: 'Removals',
}

const V1_TRANSATIONS = gql`
  query v1Transactions($pairs: [String]!) {
    mints(first: 50, where: { pair_in: $pairs }, orderBy: timestamp, orderDirection: desc) {
      transaction {
        id
        timestamp
      }
      pair {
        token0 {
          id
          symbol
        }
        token1 {
          id
          symbol
        }
      }
      to
      liquidity
      amount0
      amount1
      amountUSD
    }
    burns(first: 50, where: { pair_in: $pairs }, orderBy: timestamp, orderDirection: desc) {
      transaction {
        id
        timestamp
      }
      pair {
        token0 {
          id
          symbol
        }
        token1 {
          id
          symbol
        }
      }
      sender
      liquidity
      amount0
      amount1
      amountUSD
    }
    swaps(first: 50, where: { pair_in: $pairs }, orderBy: timestamp, orderDirection: desc) {
      transaction {
        id
        timestamp
      }
      id
      pair {
        token0 {
          id
          symbol
        }
        token1 {
          id
          symbol
        }
      }
      amount0In
      amount0Out
      amount1In
      amount1Out
      amountUSD
      to
    }
  }
`

const FUSION_TRANSACTIONS = gql`
  query fusionTransactions($pairs: [String]!) {
    mints(first: 50, orderBy: timestamp, orderDirection: desc, where: { pool_in: $pairs }) {
      timestamp
      transaction {
        id
      }
      pool {
        token0 {
          id
          symbol
        }
        token1 {
          id
          symbol
        }
      }
      owner
      sender
      origin
      amount0
      amount1
      amountUSD
    }
    swaps(first: 50, orderBy: timestamp, orderDirection: desc, where: { pool_in: $pairs }) {
      timestamp
      transaction {
        id
      }
      pool {
        token0 {
          id
          symbol
        }
        token1 {
          id
          symbol
        }
      }
      origin
      amount0
      amount1
      amountUSD
    }
    burns(first: 50, orderBy: timestamp, orderDirection: desc, where: { pool_in: $pairs }) {
      timestamp
      transaction {
        id
      }
      pool {
        token0 {
          id
          symbol
        }
        token1 {
          id
          symbol
        }
      }
      owner
      amount0
      amount1
      amountUSD
    }
  }
`

const formatTokenSymbol = symbol => (symbol === 'WBNB' ? 'BNB' : symbol)

const formatTime = unix => {
  const now = dayjs()
  const timestamp = dayjs.unix(unix)

  const inSeconds = now.diff(timestamp, 'second')
  const inMinutes = now.diff(timestamp, 'minute')
  const inHours = now.diff(timestamp, 'hour')
  const inDays = now.diff(timestamp, 'day')

  if (inHours >= 24) {
    return `${inDays} ${inDays === 1 ? 'day' : 'days'} ago`
  }
  if (inMinutes >= 60) {
    return `${inHours} ${inHours === 1 ? 'hour' : 'hours'} ago`
  }
  if (inSeconds >= 60) {
    return `${inMinutes} ${inMinutes === 1 ? 'minute' : 'minutes'} ago`
  }
  return `${inSeconds} ${inSeconds === 1 ? 'second' : 'seconds'} ago`
}

const getV1Transactions = async (chainId, pairs) => {
  const transactions = {}
  const newTxns = []
  try {
    const result = await v1Client[chainId].request(V1_TRANSATIONS, {
      pairs,
    })
    transactions.mints = result.mints
    transactions.burns = result.burns
    transactions.swaps = result.swaps
    if (transactions.mints.length > 0) {
      transactions.mints.map(mint => {
        const newTxn = {}
        newTxn.hash = mint.transaction.id
        newTxn.timestamp = mint.transaction.timestamp
        newTxn.type = TXN_TYPE.ADD
        newTxn.token0Amount = mint.amount0
        newTxn.token1Amount = mint.amount1
        newTxn.account = mint.to
        newTxn.token0Symbol = formatTokenSymbol(mint.pair.token0.symbol)
        newTxn.token1Symbol = formatTokenSymbol(mint.pair.token1.symbol)
        newTxn.amountUSD = mint.amountUSD
        return newTxns.push(newTxn)
      })
    }
    if (transactions.burns.length > 0) {
      transactions.burns.map(burn => {
        const newTxn = {}
        newTxn.hash = burn.transaction.id
        newTxn.timestamp = burn.transaction.timestamp
        newTxn.type = TXN_TYPE.REMOVE
        newTxn.token0Amount = burn.amount0
        newTxn.token1Amount = burn.amount1
        newTxn.account = burn.sender
        newTxn.token0Symbol = formatTokenSymbol(burn.pair.token0.symbol)
        newTxn.token1Symbol = formatTokenSymbol(burn.pair.token1.symbol)
        newTxn.amountUSD = burn.amountUSD
        return newTxns.push(newTxn)
      })
    }
    if (transactions.swaps.length > 0) {
      transactions.swaps.map(swap => {
        const netToken0 = swap.amount0In - swap.amount0Out
        const netToken1 = swap.amount1In - swap.amount1Out

        const newTxn = {}

        if (netToken0 < 0) {
          newTxn.token0Symbol = formatTokenSymbol(swap.pair.token0.symbol)
          newTxn.token1Symbol = formatTokenSymbol(swap.pair.token1.symbol)
          newTxn.token0Amount = Math.abs(netToken0)
          newTxn.token1Amount = Math.abs(netToken1)
        } else if (netToken1 < 0) {
          newTxn.token0Symbol = formatTokenSymbol(swap.pair.token1.symbol)
          newTxn.token1Symbol = formatTokenSymbol(swap.pair.token0.symbol)
          newTxn.token0Amount = Math.abs(netToken1)
          newTxn.token1Amount = Math.abs(netToken0)
        }

        newTxn.hash = swap.transaction.id
        newTxn.timestamp = swap.transaction.timestamp
        newTxn.type = TXN_TYPE.SWAP
        newTxn.amountUSD = swap.amountUSD
        newTxn.account = swap.to
        return newTxns.push(newTxn)
      })
    }
    const data = newTxns
      .map(ele => ({
        ...ele,
        timestamp: parseFloat(ele.timestamp),
        token0Amount: parseFloat(ele.token0Amount),
        token1Amount: parseFloat(ele.token1Amount),
        amountUSD: parseFloat(ele.amountUSD),
      }))
      .sort((a, b) => b.timestamp - a.timestamp)
    return { data, error: false }
  } catch (error) {
    console.error('Failed to fetch v1 pair transaction data', error)
    return { error: true }
  }
}

const getFusionTransactions = async (chainId, pairs) => {
  try {
    const newTxns = []
    const result = await fusionClient[chainId].request(FUSION_TRANSACTIONS, {
      pairs,
    })

    result.mints.forEach(mint => {
      const newTxn = {}
      newTxn.hash = mint.transaction.id
      newTxn.timestamp = mint.timestamp
      newTxn.type = TXN_TYPE.ADD
      newTxn.token0Amount = mint.amount0
      newTxn.token1Amount = mint.amount1
      newTxn.account = mint.origin
      newTxn.token0Symbol = formatTokenSymbol(mint.pool.token0.symbol)
      newTxn.token1Symbol = formatTokenSymbol(mint.pool.token1.symbol)
      newTxn.amountUSD = mint.amountUSD
      newTxns.push(newTxn)
    })
    result.burns.forEach(burn => {
      const newTxn = {}
      newTxn.hash = burn.transaction.id
      newTxn.timestamp = burn.timestamp
      newTxn.type = TXN_TYPE.REMOVE
      newTxn.token0Amount = burn.amount0
      newTxn.token1Amount = burn.amount1
      newTxn.account = burn.owner
      newTxn.token0Symbol = formatTokenSymbol(burn.pool.token0.symbol)
      newTxn.token1Symbol = formatTokenSymbol(burn.pool.token1.symbol)
      newTxn.amountUSD = burn.amountUSD
      newTxns.push(newTxn)
    })

    result.swaps.forEach(swap => {
      const newTxn = {}
      newTxn.hash = swap.transaction.id
      newTxn.timestamp = swap.timestamp
      newTxn.type = TXN_TYPE.SWAP
      newTxn.account = swap.origin

      if (parseFloat(swap.amount0) < 0) {
        newTxn.token0Amount = swap.amount0
        newTxn.token1Amount = swap.amount1
        newTxn.token0Symbol = formatTokenSymbol(swap.pool.token0.symbol)
        newTxn.token1Symbol = formatTokenSymbol(swap.pool.token1.symbol)
      } else {
        newTxn.token1Amount = swap.amount0
        newTxn.token0Amount = swap.amount1
        newTxn.token1Symbol = formatTokenSymbol(swap.pool.token0.symbol)
        newTxn.token0Symbol = formatTokenSymbol(swap.pool.token1.symbol)
      }
      newTxn.amountUSD = swap.amountUSD
      newTxns.push(newTxn)
    })
    const data = newTxns
      .map(ele => ({
        ...ele,
        timestamp: parseFloat(ele.timestamp),
        token0Amount: parseFloat(ele.token0Amount),
        token1Amount: parseFloat(ele.token1Amount),
        amountUSD: parseFloat(ele.amountUSD),
      }))
      .sort((a, b) => b.timestamp - a.timestamp)
    return { data, error: false }
  } catch (error) {
    console.error('Failed to fetch fusion pair transaction data', error)
    return { error: true }
  }
}

const getTransactionType = (event, symbol0, symbol1) => {
  const formattedS0 = symbol0?.length > 8 ? `${symbol0.slice(0, 7)}...` : symbol0
  const formattedS1 = symbol1?.length > 8 ? `${symbol1.slice(0, 7)}...` : symbol1
  switch (event) {
    case TXN_TYPE.ADD:
      return `Add ${formattedS0} and ${formattedS1}`
    case TXN_TYPE.REMOVE:
      return `Remove ${formattedS0} and ${formattedS1}`
    case TXN_TYPE.SWAP:
      return `Swap ${formattedS0} for ${formattedS1}`
    default:
      return ''
  }
}

const fetchPairTransaction = async (chainId, pairs, isFusion) => {
  console.log('fetch pair transaction data ======================')
  if (isFusion) {
    const { data: fusiondata } = await getFusionTransactions(chainId, pairs)
    return fusiondata
  }
  const { data: v1data } = await getV1Transactions(chainId, pairs)
  return v1data
}

const sortOptions = [
  {
    label: 'Action',
    value: 'action',
    width: 'min-w-[180px] w-[20%]',
    isDesc: true,
  },
  {
    label: 'Total Value',
    value: 'total',
    width: 'min-w-[100px] w-[16%]',
    isDesc: true,
  },
  {
    label: 'Asset Amount',
    value: 'token0',
    width: 'min-w-[130px] w-[16%]',
    isDesc: true,
  },
  {
    label: 'Asset Amount',
    value: 'token1',
    width: 'min-w-[130px] w-[16%]',
    isDesc: true,
  },
  {
    label: 'Account',
    value: 'account',
    width: 'min-w-[130px] w-[16%]',
    isDesc: true,
  },
  {
    label: 'Time',
    value: 'time',
    width: 'min-w-[130px] w-[16%]',
    isDesc: true,
  },
]

export default function TransactionTable({ pairs, isFusion }) {
  const [sort, setSort] = useState(sortOptions[5])
  const [currentPage, setCurrentPage] = useState(1)
  const [filter, setFilter] = useState(TXN_TYPE.All)
  const { networkId } = useChainSettings()
  const { data: txnData } = useSWRImmutable(
    pairs && pairs.length > 0 && ['analytics/pair/transaction', pairs[0]],
    () => fetchPairTransaction(networkId, pairs, isFusion),
    {
      refreshInterval: 0,
    },
  )

  const filters = useMemo(
    () =>
      Object.values(TXN_TYPE).map(ele => ({
        label: ele,
        active: filter === ele,
        onClickHandler: () => setFilter(ele),
      })),
    [filter],
  )

  const sortedData = useMemo(
    () =>
      !txnData
        ? []
        : txnData
            .filter(ele => filter === TXN_TYPE.All || ele.type === filter)
            .sort((a, b) => {
              let res
              switch (sort.value) {
                case 'action':
                  res = a.type.localeCompare(b.type) * (sort.isDesc ? -1 : 1)
                  break
                case 'total':
                  res = (a.amountUSD - b.amountUSD) * (sort.isDesc ? -1 : 1)
                  break
                case 'token0':
                  res = (a.token0Amount - b.token0Amount) * (sort.isDesc ? -1 : 1)
                  break
                case 'token1':
                  res = (a.token1Amount - b.token1Amount) * (sort.isDesc ? -1 : 1)
                  break
                case 'account':
                  res = (a.account - b.account) * (sort.isDesc ? -1 : 1)
                  break
                case 'time':
                  res = (a.timestamp - b.timestamp) * (sort.isDesc ? -1 : 1)
                  break
                default:
                  break
              }
              return res
            }),
    [txnData, sort, filter],
  )

  const final = useMemo(
    () =>
      sortedData.map(item => ({
        action: (
          <div
            className='cursor-pointer'
            onClick={() => {
              goScan(networkId, item.hash, true)
            }}
          >
            {getTransactionType(item.type, item.token1Symbol, item.token0Symbol)}
          </div>
        ),
        total: <Paragraph>${formatAmount(item.amountUSD, true)}</Paragraph>,
        token0: (
          <Paragraph>
            {formatAmount(item.token0Amount)} {item.token0Symbol}
          </Paragraph>
        ),
        token1: (
          <Paragraph>
            {formatAmount(item.token1Amount)} {item.token1Symbol}
          </Paragraph>
        ),
        account: (
          <span
            className='cursor-pointer text-primary-600'
            onClick={() => {
              goScan(networkId, item.account)
            }}
          >
            {item.account && `${item.account.slice(0, 6)}...${item.account.slice(38, 42)}`}
          </span>
        ),
        time: <Paragraph>{formatTime(item.timestamp)}</Paragraph>,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(sortedData)],
  )

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex flex-col gap-4'>
        <TextHeading className='text-xl'>Transactions</TextHeading>
        <Tabs data={filters} size={SizeTypes.Medium} className='w-fit' />
      </div>
      <Table
        sortOptions={sortOptions}
        data={final}
        sort={sort}
        setSort={setSort}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        notAction
      />
    </div>
  )
}
