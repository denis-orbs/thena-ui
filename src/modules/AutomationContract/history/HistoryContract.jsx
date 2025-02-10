import dayjs from 'dayjs'
import { isEmpty } from 'lodash'
import { useTranslations } from 'next-intl'
import React, { useMemo, useState } from 'react'

import Highlight from '@/components/highlight'
import Table from '@/components/table'
import { Paragraph, TextHeading } from '@/components/typography'
import { useCopyText } from '@/hooks/useCopyText'
import { formatAddress, formatAmount, fromWei } from '@/lib/utils'
import { CheckIcon, CopyArenaIcon, InfoCircleWhite } from '@/svgs'

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

function HistoryContract({ histories }) {
  const { onCopy, copied } = useCopyText()
  const [sort, setSort] = useState({})
  const [currentPage, setCurrentPage] = useState(1)

  const finalData = useMemo(
    () =>
      (histories || []).map(transaction => ({
        date: <Paragraph>{dayjs.unix(transaction.timestamp).format('MMM D, YYYY [at] HH:mm [UTC]')}</Paragraph>,
        hash: (
          <TextHeading className='flex flex-row gap-1'>
            {formatAddress(transaction.transactionHash)}
            <div
              onClick={e => onCopy(e, transaction.transactionHash, transaction.transactionHash)}
              className='h-5 w-5 cursor-pointer stroke-neutral-200'
            >
              {copied === transaction.transactionHash ? (
                <CheckIcon className='stroke-success-500' />
              ) : (
                <CopyArenaIcon />
              )}
            </div>
          </TextHeading>
        ),
        type: <TextHeading>{transaction.type}</TextHeading>,
        amount: (
          <TextHeading>
            {!fromWei(transaction.amount).gt(0) ? '-' : `${formatAmount(fromWei(transaction.amount))} Link`}
          </TextHeading>
        ),
      })),
    [copied, histories, onCopy],
  )
  const t = useTranslations()

  return (
    <div className='space-y-4'>
      <TextHeading className='text-2xl lg:text-3xl'>{t('History')}</TextHeading>
      {!isEmpty(histories) ? (
        <Table
          notAction
          data={finalData}
          sortOptions={sortOptions}
          sort={sort}
          setSort={setSort}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
        />
      ) : (
        <div className='flex w-full flex-col items-center justify-center gap-4 rounded-xl border border-neutral-800 px-6 py-[120px] '>
          <Highlight>
            <InfoCircleWhite className='h-4 w-4' />
          </Highlight>
          <div className='flex flex-col items-center gap-3'>
            <h2>{t('No History Found')}</h2>
          </div>
        </div>
      )}
    </div>
  )
}

export default HistoryContract
