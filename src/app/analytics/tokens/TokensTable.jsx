'use client'

import { useRouter } from 'nextjs-toploader/app'
import React, { useEffect, useMemo, useState } from 'react'

import PercentBadge from '@/components/badges/PercentBadge'
import CircleImage from '@/components/image/CircleImage'
import Table from '@/components/table'
import { Paragraph, TextHeading } from '@/components/typography'
import { useMediaQuery } from '@/hooks/useMediaQuery'
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

export default function TokensTable({ data, hidePagination = false, backUrlNumber, searchTextTokens }) {
  const [sort, setSort] = useState(sortOptions[3])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)
  const { isLgDown } = useMediaQuery()
  const { push } = useRouter()

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTextTokens])

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
          push(`/analytics/tokens/${item.address}?back=${backUrlNumber}`)
        },
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(sortedData)],
  )

  const finalSortOption = useMemo(() => {
    if (isLgDown) {
      return [
        {
          ...sortOptions[0],
          width: 'w-[45%]',
        },
        {
          ...sortOptions[1],
          width: 'w-[28%]',
        },
        {
          ...sortOptions[3],
          width: 'w-[27%]',
        },
      ]
    }
    return sortOptions
  }, [isLgDown])

  return (
    <Table
      sortOptions={finalSortOption}
      data={final}
      sort={sort}
      setSort={setSort}
      currentPage={currentPage}
      setCurrentPage={setCurrentPage}
      notAction
      hidePagination={hidePagination}
      showNumberOfPage={!isLgDown}
      defaultNumberItem={5}
      setNumberOfPage={setItemsPerPage}
      pageSize={itemsPerPage}
      tableBasic
      className='max-lg:bg-transparent max-md:px-0 max-md:py-0'
      classNames={{
        headerItem: 'max-md:h-5! max-md:[&>div]:pt-0! max-md:[&>div]:px-1! max-md:[&>div]:pb-2!',
        tableContainer: 'max-md:p-0',
        cellItemContent: 'max-md:h-11 py-2 px-1',
        paginationContainer: 'max-md:px-0 border-none pt-0',
        paginationList: 'max-md:py-0',
      }}
    />
  )
}
