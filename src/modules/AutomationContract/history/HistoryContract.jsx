import dayjs from 'dayjs'
import { useTranslations } from 'next-intl'
import React, { useMemo, useState } from 'react'
import { zeroAddress } from 'viem'

import Table from '@/components/table'
import { Paragraph, TextHeading } from '@/components/typography'
import { useCopyText } from '@/hooks/useCopyText'
import { formatAddress } from '@/lib/utils'
import { CheckIcon, CopyArenaIcon } from '@/svgs'

const sortOptions = [
  {
    label: 'Date',
    value: 'date',
    width: 'lg:w-[25%] max-lg:hidden',
    isDesc: true,
    disabled: true,
  },
  {
    label: 'Date',
    value: 'date',
    width: 'lg:w-[25%] lg:hidden',
    isDesc: true,
    disabled: true,
  },
  {
    label: 'Transaction Hash',
    value: 'hash',
    width: 'lg:w-[25%]',
    isDesc: true,
    disabled: true,
  },
  {
    label: 'Activity Type',
    value: 'type',
    width: 'lg:w-[25%]',
    isDesc: true,
    disabled: true,
  },
  {
    label: 'Amount',
    value: 'amount',
    width: 'lg:w-[25%]',
    isDesc: true,
    disabled: true,
  },
]

function HistoryContract() {
  const date = new Date().getTime()
  const { onCopy, copied } = useCopyText()
  const [sort, setSort] = useState({})
  const [currentPage, setCurrentPage] = useState(1)
  // TODO: mock data
  const finalData = useMemo(
    () =>
      [1, 2, 3, 4, 5].map((_, index) => ({
        date: <Paragraph>{dayjs(date).format('MMM D, YYYY [at] HH:mm [UTC]')}</Paragraph>,
        hash: (
          <TextHeading className='flex flex-row gap-1'>
            {formatAddress(zeroAddress)}
            <div
              onClick={e => onCopy(e, zeroAddress, `hasAddress_${index}`)}
              className='h-5 w-5 cursor-pointer stroke-neutral-200'
            >
              {copied === `hasAddress_${index}` ? <CheckIcon className='stroke-success-500' /> : <CopyArenaIcon />}
            </div>
          </TextHeading>
        ),
        type: <TextHeading>{`Type ${index}`}</TextHeading>,
        amount: <TextHeading>999 Link</TextHeading>,
      })),
    [copied, date, onCopy],
  )
  const t = useTranslations()

  return (
    <div className='space-y-4'>
      <TextHeading className='text-2xl lg:text-3xl'>{t('History')}</TextHeading>
      <Table
        notAction
        data={finalData}
        sortOptions={sortOptions}
        sort={sort}
        setSort={setSort}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      />
    </div>
  )
}

export default HistoryContract
