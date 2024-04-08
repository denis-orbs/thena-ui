import Image from 'next/image'
import { useTranslations } from 'next-intl'
import React, { useMemo, useState } from 'react'

import SearchInput from '@/components/input/SearchInput'
import Table from '@/components/table'
import { Paragraph, TextHeading, TextSubHeading } from '@/components/typography'
import { TransferIcon } from '@/svgs'

const sortOptions = [
  {
    label: 'Traded Token',
    value: 'traded_token',
    width: 'w-[30%]',
    isDesc: false,
    minWidth: 'min-w-40',
  },
  {
    label: 'Token amount',
    value: 'token_amount',
    width: 'w-[15%]',
    isDesc: true,
  },
  {
    label: 'Transaction Hash',
    value: 'hash',
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
  const [searchText, setSearchText] = useState('')
  const t = useTranslations()
  const [currentPage, setCurrentPage] = useState(1)

  const [sort, setSort] = useState(sortOptions[0])

  const sortedData = Array.from({ length: 5 })

  const finalLeaderBoards = useMemo(
    () =>
      sortedData?.map(() => ({
        traded_token: (
          <div className='flex items-center justify-between space-x-1'>
            <div className='flex items-center gap-1'>
              <Image
                alt='ETH'
                src='https://cdn.thena.fi/assets/ETH.png'
                className='flex-shrink-0'
                width={24}
                height={24}
                loading='lazy'
              />
              <TextHeading>ETH</TextHeading>
            </div>
            <TransferIcon className='h-4 w-4 stroke-neutral-400' />
            <div className='flex items-center gap-1'>
              <Image
                alt='BNB'
                src='https://cdn.thena.fi/assets/BNB.png'
                className='flex-shrink-0'
                width={24}
                height={24}
                loading='lazy'
              />
              <TextHeading>BNB</TextHeading>
            </div>
          </div>
        ),
        token_amount: <Paragraph>12.34</Paragraph>,
        hash: <Paragraph>123AbC456...891</Paragraph>,
        timestamp: (
          <div className='flex flex-col'>
            <Paragraph>Nov 15, 2024</Paragraph>
            <TextSubHeading>12:00:00 UTC</TextSubHeading>
          </div>
        ),
      })),

    [sortedData],
  )

  return (
    <>
      <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
        <TextHeading className='text-xl lg:flex-2 '>{t('Trade History')}</TextHeading>
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
