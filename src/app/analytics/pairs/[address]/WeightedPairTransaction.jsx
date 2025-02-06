'use client'

import dayjs from 'dayjs'
import { gql } from 'graphql-request'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'
import useSWR from 'swr'

import Table from '@/components/table'
import Tabs from '@/components/tabs'
import { Paragraph, TextHeading } from '@/components/typography'
import { SizeTypes } from '@/constant/type'
import { weightedClient } from '@/lib/graphql'
import { formatAmount, goScan } from '@/lib/utils'
import { useChainSettings } from '@/state/settings/hooks'

import { TXN_TYPE } from './PairTransaction'

const WEIGHTED_TRANSACTIONS = gql`
  query fusionTransactions($address: String!) {
    swaps(first: 50, orderBy: timestamp, orderDirection: desc, where: { poolId_: { address: $address } }) {
      tokenIn
      tokenOut
      tx
      timestamp
      tokenAmountIn
      tokenAmountOut
      tokenInSym
      tokenOutSym
      valueUSD
    }
    poolActivities(first: 100, orderBy: timestamp, orderDirection: desc, where: { pool_: { address: $address } }) {
      id
      tx
      type
      user
      valueUSD
      sender
      timestamp
      block
      amounts
      pool {
        tokens {
          address
          symbol
        }
      }
    }
  }
`

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

const getWeightedTransactions = async (chainId, address) => {
  try {
    const newTxns = []
    const { poolActivities, swaps } = await weightedClient[chainId].request(WEIGHTED_TRANSACTIONS, {
      address,
    })
    console.log({ poolActivities, swaps })

    poolActivities.forEach(ele => {
      newTxns.push({
        hash: ele.tx,
        timestamp: ele.timestamp,
        type: ele.type === 'Join' ? TXN_TYPE.ADD : TXN_TYPE.REMOVE,
        account: ele.sender,
        amountUSD: ele.valueUSD,
        tokens: ele.pool.tokens.map((token, index) => ({
          ...token,
          amount: ele.amounts[index],
        })),
      })
    })

    // TODO: update ele type based on response of API
    swaps.forEach(ele => {
      const newTxn = {}
      newTxn.hash = ele.tx
      newTxn.timestamp = ele.timestamp
      newTxn.account = ele.caller
      newTxn.amountUSD = ele.valueUSD
      newTxn.type = TXN_TYPE.SWAP
      newTxn.token0Symbol = ele.tokenIn
      newTxn.token1Symbol = ele.tokenOut
      newTxn.token0Amount = ele.tokenAmountIn
      newTxn.token1Amount = ele.tokenAmountOut
      newTxns.push(newTxn)
    })

    const data = newTxns
      .map(ele => ({
        ...ele,
        timestamp: parseFloat(ele.timestamp),
        amountUSD: parseFloat(ele.amountUSD),
      }))
      .sort((a, b) => b.timestamp - a.timestamp)
    return data
  } catch (error) {
    console.error('Failed to fetch fusion pair transaction data', error)
    return []
  }
}

const getTransactionType = (event, symbol0, symbol1, t, tokens, isWeighted = false) => {
  const formattedS0 = symbol0?.length > 8 ? `${symbol0.slice(0, 7)}...` : symbol0
  const formattedS1 = symbol1?.length > 8 ? `${symbol1.slice(0, 7)}...` : symbol1
  switch (event) {
    case TXN_TYPE.ADD:
      if (!isWeighted) {
        return t('Add [symbolA] and [symbolB]', {
          symbolA: formattedS0,
          symbolB: formattedS1,
        })
      }

      return tokens.reduce(
        (str, tk, index) => str + tk.symbol + (index < tokens.length - 1 ? ` ${t('And')} ` : ''),
        `${t('Add')} `,
      )

    case TXN_TYPE.REMOVE:
      return t('Remove [symbolA] and [symbolB]', {
        symbolA: formattedS0,
        symbolB: formattedS1,
      })
    case TXN_TYPE.SWAP:
      return t('Swap [symbolA] for [symbolB]', {
        symbolA: formattedS0,
        symbolB: formattedS1,
      })
    default:
      return ''
  }
}

export default function WeightedTransactionTable({ pair }) {
  const sortOptions = useMemo(
    () => [
      {
        label: 'Action',
        value: 'action',
        width: 'lg:w-[20%]',
        isDesc: true,
      },
      {
        label: 'Total Value',
        value: 'total',
        width: 'lg:w-[16%]',
        isDesc: true,
      },
      ...pair.tokens.map(t => ({
        label: t.symbol,
        value: t.symbol,
        width: 'lg:w-[16%]',
        isDesc: true,
      })),
      {
        label: 'Account',
        value: 'account',
        width: 'lg:w-[16%]',
        isDesc: true,
      },
      {
        label: 'Time',
        value: 'time',
        width: 'min-w-[130px] w-[16%]',
        isDesc: true,
      },
    ],
    [pair.tokens],
  )
  const [sort, setSort] = useState(sortOptions.at(-1))
  const [currentPage, setCurrentPage] = useState(1)
  const [filter, setFilter] = useState(TXN_TYPE.All)
  const { networkId } = useChainSettings()
  const t = useTranslations()

  const { data: txnData } = useSWR(
    pair && ['analytics/pair/transaction', pair.address],
    () => getWeightedTransactions(networkId, pair.address),
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
      (txnData ?? [])
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
            // case 'token0':
            //   res = (a.token0Amount - b.token0Amount) * (sort.isDesc ? -1 : 1)
            //   break
            // case 'token1':
            //   res = (a.token1Amount - b.token1Amount) * (sort.isDesc ? -1 : 1)
            //   break
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
            {getTransactionType(item.type, item.token1Symbol, item.token0Symbol, t, pair.tokens, true)}
          </div>
        ),
        total: <Paragraph>${formatAmount(item.amountUSD, true)}</Paragraph>,
        ...item.tokens.reduce((acc, token) => {
          acc[token.symbol] = (
            <Paragraph>
              {formatAmount(token.amount)} {token.symbol}
            </Paragraph>
          )
          return acc
        }, {}),
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
    [networkId, pair.tokens, sortedData, t],
  )

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex flex-col gap-4'>
        <TextHeading className='text-xl'>{t('Transactions')}</TextHeading>
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
