import moment from 'moment'
import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useEffect, useMemo, useState } from 'react'
import 'moment/locale/zh-cn'

import SearchInput from '@/components/input/SearchInput'
import Table from '@/components/table'
import { Paragraph, TextHeading, TextSubHeading } from '@/components/typography'
import { useAssets } from '@/context/assetsContext'
import { useTCTradeHistory } from '@/hooks/trade/useTradingCompetitionTradeHistory'
import useDebounce from '@/hooks/useDebounce'
import useWallet from '@/hooks/useWallet'
import { useLocaleSettings } from '@/state/settings/hooks'
import { formatAmount, fromWei } from '@/utils/utils'

import TransferIcon from '~/svgs/switch-horizontal.svg'

const sortOptions = [
  {
    label: 'Traded Token',
    value: 'traded_token',
    width: 'w-[30%]',
    isDesc: true,
    minWidth: 'min-w-40',
  },
  {
    label: 'In Amount',
    value: 'amountIn',
    width: 'w-[15%]',
    isDesc: true,
  },
  {
    label: 'Out Amount',
    value: 'amountOut',
    width: 'w-[15%]',
    isDesc: true,
  },
  {
    label: 'Transaction Hash',
    value: 'txHash',
    width: 'w-[30%]',
    isDesc: true,
    justify: 'justify-center items-center',
  },
  {
    label: 'Date & Time',
    value: 'timestamp',
    width: 'w-[30%]',
    isDesc: true,
    justify: 'justify-center items-center',
  },
]
export function TradeHistory() {
  const assets = useAssets()
  const { account } = useWallet()
  const { locale } = useLocaleSettings()
  const [searchText, setSearchText] = useState('')
  const t = useTranslations()
  const [currentPage, setCurrentPage] = useState(1)
  const [data, setData] = useState([])
  const [sort, setSort] = useState(sortOptions[4])

  const { id } = useParams()

  const dataFetch = useTCTradeHistory(id.toLowerCase(), account.toLowerCase())

  useEffect(() => {
    if (dataFetch) {
      const arr = dataFetch.map(history => {
        const assetIn = assets.find(a => a.address?.toLowerCase() === history.tokenIn?.id?.toLowerCase())
        const assetOut = assets.find(a => a.address?.toLowerCase() === history.tokenOut?.id?.toLowerCase())

        return {
          traded_token: [
            { symbol: assetIn?.symbol || '', logoURI: assetIn?.logoURI || '' },
            { symbol: assetOut?.symbol || '', logoURI: assetOut?.logoURI || '' },
          ],
          amountIn: fromWei(history.amountIn).toNumber(),
          amountOut: fromWei(history.amountOut).toNumber(),
          txHash: history.txHash,
          timestamp: history.timestamp,
        }
      })
      setData(arr)
    } else {
      setData([])
    }
  }, [assets, dataFetch])

  const debounceSearchText = useDebounce(searchText, 300)

  const dataWithSearchText = useMemo(() => {
    let arr = [...data]
    const keyword = debounceSearchText.trim()
    if (keyword) {
      arr = arr.filter(
        item =>
          String(item.hash).toLowerCase().includes(keyword.toLowerCase()) ||
          String(item.traded_token[0].symbol).toLowerCase().includes(keyword.toLowerCase()) ||
          String(item.traded_token[1].symbol).toLowerCase().includes(keyword.toLowerCase()),
      )
    }
    return arr
  }, [data, debounceSearchText])

  const sortedData = useMemo(
    () =>
      dataWithSearchText.sort((a, b) => {
        let res
        switch (sort.value) {
          case 'traded_token':
            res =
              String(a.traded_token[0].symbol).localeCompare(String(b.traded_token[0].symbol)) * (sort.isDesc ? -1 : 1)
            break
          case 'amountIn':
            res = (a.amountIn - b.amountIn) * (sort.isDesc ? -1 : 1)
            break
          case 'amountOut':
            res = (a.amountOut - b.amountOut) * (sort.isDesc ? -1 : 1)
            break
          case 'txHash':
            res = String(a.txHash).localeCompare(String(b.txHash)) * (sort.isDesc ? -1 : 1)
            break
          case 'timestamp':
            res = (new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()) * (sort.isDesc ? -1 : 1)
            break
          default:
            break
        }
        return res
      }),
    [dataWithSearchText, sort],
  )

  const finalLeaderBoards = useMemo(
    () =>
      sortedData?.map(item => {
        const hashText = `${String(item.txHash).slice(0, 9)}...${String(item.txHash).slice(
          String(item.txHash).length - 3,
        )}`

        return {
          traded_token: (
            <div className='flex items-center justify-between gap-1'>
              <div className='flex items-center gap-1'>
                <Image
                  alt={item.traded_token?.[0]?.symbol}
                  src={item.traded_token?.[0]?.logoURI}
                  className='shrink-0'
                  width={24}
                  height={24}
                  loading='lazy'
                />
                <TextHeading>{item.traded_token?.[0]?.symbol}</TextHeading>
              </div>
              <TransferIcon className='h-4 w-4 stroke-neutral-400' />
              <div className='flex items-center gap-1'>
                <Image
                  alt={item.traded_token?.[1]?.symbol}
                  src={item.traded_token?.[1]?.logoURI}
                  className='shrink-0'
                  width={24}
                  height={24}
                  loading='lazy'
                />
                <TextHeading>{item.traded_token?.[1]?.symbol}</TextHeading>
              </div>
            </div>
          ),
          amountIn: <Paragraph>{formatAmount(item.amountIn, false, 4)}</Paragraph>,
          amountOut: <Paragraph>{formatAmount(item.amountOut, false, 4)}</Paragraph>,
          txHash: (
            <Paragraph>
              <Link href={`https://bscscan.com/tx/${item.txHash}`} target='_blank' rel='nofollow noopener'>
                {hashText}
              </Link>
            </Paragraph>
          ),
          timestamp: (
            <div className='flex flex-col'>
              <Paragraph>{moment(item.timestamp.split('T')[0]).locale(locale).format('ll')}</Paragraph>
              <TextSubHeading>{item.timestamp.split('T')[1].split('.')[0]} UTC</TextSubHeading>
            </div>
          ),
        }
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(sortedData)],
  )

  return (
    <>
      <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
        <TextHeading className='text-xl lg:flex-2'>{t('Trade History')}</TextHeading>
        <SearchInput className='w-full lg:flex-1' val={searchText} setVal={setSearchText} />
      </div>

      <Table
        sortOptions={sortOptions}
        data={finalLeaderBoards}
        sort={sort}
        setSort={setSort}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        tableBasic
      />
    </>
  )
}
