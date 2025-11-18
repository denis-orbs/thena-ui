'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from 'nextjs-toploader/app'
import React, { useEffect, useMemo, useState } from 'react'

import GroupIconTokens from '@/components/icongroup/GroupIconTokens'
import Table from '@/components/table'
import { Paragraph, TextHeading } from '@/components/typography'
import { PAIR_TYPES } from '@/constant'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import cn from '@/utils/classes'
import { formatAmount } from '@/utils/utils'

const sortOptions = [
  {
    label: 'Asset',
    value: 'name',
    width: 'lg:w-[20%]',
    isDesc: true,
  },
  {
    label: 'Liquidity',
    value: 'liquidity',
    width: 'lg:w-[16%]',
    isDesc: true,
  },
  {
    label: 'Volume (24h)',
    value: 'dayVolume',
    width: 'lg:w-[16%]',
    isDesc: true,
  },
  {
    label: 'Volume (7d)',
    value: 'weekVolume',
    width: 'lg:w-[16%]',
    isDesc: true,
  },
  {
    label: 'Fees (24h)',
    value: 'dayFees',
    width: 'lg:w-[16%]',
    isDesc: true,
  },
  {
    label: 'Fees (7d)',
    value: 'weekFees',
    width: 'lg:w-[16%]',
    isDesc: true,
  },
]

export default function PairsTable({ data, hidePagination = false, backUrlNumber, searchTextPairs }) {
  const [sort, setSort] = useState(sortOptions[1])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)
  const { push } = useRouter()
  const t = useTranslations()

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTextPairs])

  const { isLgDown } = useMediaQuery()

  const sortedData = useMemo(
    () =>
      !data
        ? []
        : data.sort((a, b) => {
            let res
            switch (sort.value) {
              case 'name':
                res = a.symbol.localeCompare(b.symbol) * (sort.isDesc ? -1 : 1)
                break
              case 'liquidity':
                res = (a.tvlUSD - b.tvlUSD) * (sort.isDesc ? -1 : 1)
                break
              case 'dayVolume':
                res = (a.dayVolume - b.dayVolume) * (sort.isDesc ? -1 : 1)
                break
              case 'weekVolume':
                res = (a.weekVolume - b.weekVolume) * (sort.isDesc ? -1 : 1)
                break
              case 'dayFees':
                res = (a.dayFees - b.dayFees) * (sort.isDesc ? -1 : 1)
                break
              case 'weekFees':
                res = (a.weekFees - b.weekFees) * (sort.isDesc ? -1 : 1)
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
        name: (
          <div className='flex items-center gap-3'>
            <GroupIconTokens
              classNames={{
                image: cn('outline-2 w-7 h-7', 'w-7 h-7'),
                rows: 'flex *:-ml-2',
                toolTip: 'hidden',
              }}
              width={isLgDown ? 28 : 32}
              height={isLgDown ? 28 : 32}
              tokens={item.type === PAIR_TYPES.WEIGHTED ? item.tokens : [item.token0, item.token1]}
              showToolTip={false}
            />
            <div className='hidden flex-col lg:flex'>
              <TextHeading>{item.symbol}</TextHeading>
              <Paragraph className='text-sm'>{t(item.type)}</Paragraph>
            </div>
          </div>
        ),
        liquidity: <Paragraph>${formatAmount(item.tvlUSD)}</Paragraph>,
        dayVolume: <Paragraph>${formatAmount(item.dayVolume)}</Paragraph>,
        weekVolume: <Paragraph>${formatAmount(item.weekVolume)}</Paragraph>,
        dayFees: <Paragraph>${formatAmount(item.dayFees)}</Paragraph>,
        weekFees: <Paragraph>${formatAmount(item.weekFees)}</Paragraph>,
        onRowClick: () => {
          push(`/analytics/pairs/${item.address}?back=${backUrlNumber}`)
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
          width: 'w-[20%]',
          // disabled: true,
        },
        {
          ...sortOptions[1],
          width: 'w-[30%]',
          // disabled: true,
        },
        {
          ...sortOptions[2],
          width: 'w-[30%]',
          // disabled: true,
        },
        {
          ...sortOptions[4],
          width: 'w-[20%]',
          // disabled: true,
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
      className='max-md:bg-transparent max-md:px-0 max-md:py-0'
      classNames={{
        headerItem: 'max-md:h-5! max-md:[&>div]:pt-0! max-md:[&>div]:px-1! max-md:[&>div]:pb-2!',
        tableContainer: 'max-md:p-0',
        cellItemContent: 'max-md:h-11 pl-0.5 flex-row items-center',
        paginationContainer: 'max-md:px-0 border-none pt-0 mx-auto w-full',
        paginationList: 'max-md:p-0 mx-auto',
      }}
      tableBasic
    />
  )
}
