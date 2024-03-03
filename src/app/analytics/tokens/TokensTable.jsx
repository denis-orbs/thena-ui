'use client'

import { useRouter } from 'next/navigation'
import React, { useMemo, useState } from 'react'

import PercentBadge from '@/components/badges/PercentBadge'
import CircleImage from '@/components/image/CircleImage'
import Table from '@/components/table'
import { Paragraph, TextHeading } from '@/components/typography'
import { formatAmount } from '@/lib/utils'

const sortOptions = [
  {
    label: 'Asset',
    value: 'asset',
    width: 'lg:w-[24%]',
    isDesc: true,
  },
  {
    label: 'Value',
    value: 'price',
    width: 'lg:w-[19%]',
    isDesc: true,
  },
  {
    label: 'Price Change',
    value: 'priceChange',
    width: 'lg:w-[19%]',
    isDesc: true,
  },
  {
    label: 'Volume (24h)',
    value: 'volume',
    width: 'lg:w-[19%]',
    isDesc: true,
  },
  {
    label: 'Liquidity',
    value: 'liquidity',
    width: 'lg:flex-1',
    isDesc: true,
  },
]

export default function TokensTable({ data, hidePagination = false }) {
  const [sort, setSort] = useState(sortOptions[3])
  const [currentPage, setCurrentPage] = useState(1)
  const { push } = useRouter()

  const sortedData = useMemo(
    () =>
      !data
        ? []
        : data.sort((a, b) => {
            let res
            switch (sort.value) {
              case 'asset':
                res = a.symbol.localeCompare(b.symbol) * (sort.isDesc ? -1 : 1)
                break
              case 'price':
                res = (a.price - b.price) * (sort.isDesc ? -1 : 1)
                break
              case 'priceChange':
                res = (a.priceChange - b.priceChange) * (sort.isDesc ? -1 : 1)
                break
              case 'volume':
                res = (a.volume - b.volume) * (sort.isDesc ? -1 : 1)
                break
              case 'liquidity':
                res = (a.liquidity - b.liquidity) * (sort.isDesc ? -1 : 1)
                break

              default:
                break
            }
            return res
          }),
    [data, sort],
  )

  const final = useMemo(
    () =>
      sortedData.map(item => ({
        asset: (
          <div className='flex items-center gap-3'>
            <CircleImage className='h-8 w-8' src={item.logoURI} alt='thena logo' />
            <TextHeading>{item.symbol}</TextHeading>
          </div>
        ),
        price: <Paragraph>${formatAmount(item.price)}</Paragraph>,
        priceChange: <PercentBadge value={item.priceChange} />,
        volume: <Paragraph>${formatAmount(item.volume)}</Paragraph>,
        liquidity: <Paragraph>${formatAmount(item.liquidity)}</Paragraph>,
        onRowClick: () => {
          push(`/analytics/tokens/${item.address}`)
        },
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(sortedData)],
  )
  return (
    <Table
      sortOptions={sortOptions}
      data={final}
      sort={sort}
      setSort={setSort}
      currentPage={currentPage}
      setCurrentPage={setCurrentPage}
      notAction
      hidePagination={hidePagination}
    />
  )
}
