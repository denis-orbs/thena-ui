'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useMemo, useState } from 'react'

import GroupIconTokens from '@/components/icongroup/GroupIconTokens'
import Table from '@/components/table'
import { Paragraph, TextHeading } from '@/components/typography'
import { PAIR_TYPES } from '@/constant'
import { cn, formatAmount } from '@/lib/utils'
import { ListTokenPercantage } from '@/modules/WeightedPool/TokenPercentage'

const sortOptions = [
  {
    label: 'Name',
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

export default function PairsTable({ data, hidePagination = false, backUrlNumber }) {
  const [sort, setSort] = useState(sortOptions[1])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)
  const { push } = useRouter()
  const t = useTranslations()

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
            {item.type !== PAIR_TYPES.WEIGHTED ? (
              <>
                <GroupIconTokens
                  classNames={{
                    image: cn('outline-2 w-7 h-7', 'w-7 h-7'),
                    rows: 'flex *:-ml-2',
                    toolTip: 'hidden',
                  }}
                  width={32}
                  height={32}
                  tokens={[item.token0, item.token1]}
                  showToolTip={false}
                />
                <div className='flex flex-col'>
                  <TextHeading>{item.symbol}</TextHeading>
                  <Paragraph className='text-sm'>{t(item.type)}</Paragraph>
                </div>
              </>
            ) : (
              <ListTokenPercantage listToken={item.tokens} poolAddress={item?.address} />
            )}
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
      showNumberOfPage
      defaultNumberItem={5}
      setNumberOfPage={setItemsPerPage}
      pageSize={itemsPerPage}
    />
  )
}
