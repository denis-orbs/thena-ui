import moment from 'moment'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useMemo, useState } from 'react'

import Box from '@/components/box'
import { TrailingButton } from '@/components/buttons/Button'
import Table from '@/components/table'
import { TextHeading, TextSubHeading } from '@/components/typography'

function YourEarning() {
  const sortOptions = useMemo(
    () => [
      {
        label: 'Epoch',
        value: 'epoch',
        width: 'lg:w-[15%]',
        isDesc: true,
      },
      {
        label: 'Date',
        value: 'date',
        width: 'lg:w-[20%]',
        isDesc: true,
      },
      {
        label: 'Trading Volume',
        value: 'tradingVolume',
        width: 'lg:w-[20%]',
        isDesc: true,
      },
      {
        label: 'Earned',
        value: 'earned',
        width: 'lg:w-[20%]',
        isDesc: true,
      },
      {
        label: 'in USD',
        value: 'inUSD',
        width: 'lg:w-[20%]',
        isDesc: true,
      },
      {
        label: '',
        value: 'action',
        width: 'lg:w-[10%]',
        disabled: true,
      },
    ],
    [],
  )

  const t = useTranslations()
  const { push } = useRouter()
  const [currentPage, setCurrentPage] = useState(1)
  const [sort, setSort] = useState(sortOptions[0])

  const data = useMemo(
    () => [
      {
        epoch: 132,
        date: moment().format('LL'),
        tradingVolume: 9999,
        earned: 9999,
        inUSD: 9999,
      },
      {
        epoch: 85,
        date: moment().format('LL'),
        tradingVolume: 9999,
        earned: 9999,
        inUSD: 9999,
      },
      {
        epoch: 84,
        date: moment().format('LL'),
        tradingVolume: 9999,
        earned: 9999,
        inUSD: 9999,
      },
    ],
    [],
  )

  // const sortedData = useMemo(
  //   () =>
  //     data.sort((a, b) => {
  //       let res
  //       switch (sort.value) {
  //         case 'epoch':
  //           res = (a.epoch - b.epoch) * (sort.isDesc ? -1 : 1)
  //           break
  //         case 'date':
  //           res = (new Date(a.date).getTime() - new Date(b.date).getTime()) * (sort.isDesc ? -1 : 1)
  //           break
  //         case 'tradingVolume':
  //           res = (a.tradingVolume - b.tradingVolume) * (sort.isDesc ? -1 : 1)
  //           break
  //         case 'earned':
  //           res = (a.earned - b.earned) * (sort.isDesc ? -1 : 1)
  //           break

  //         case 'inUSD':
  //           res = (a.inUSD - b.inUSD) * (sort.isDesc ? -1 : 1)
  //           break

  //         default:
  //           break
  //       }
  //       return res
  //     }),
  //   [data, sort],
  // )

  // const finalData = []

  return (
    <div className='mb-8'>
      <div className='mb-8 flex flex-col gap-2'>
        <TextHeading className='text-xl font-semibold md:text-3xl'>{t('Your Earnings')}</TextHeading>
        <TextSubHeading>{t('Your Earnings Description')}</TextSubHeading>
      </div>
      {!data.length ? (
        <Box className='flex flex-col items-center gap-4 lg:py-8'>
          <>
            <TextHeading className='text-center text-xl md:text-3xl'>{t('No Earnings Found')}</TextHeading>
            <TextSubHeading className='text-center text-base'>
              {t('Go trade on ALPHA and claim your earnings here')}
            </TextSubHeading>
            <div className='flex justify-center'>
              <TrailingButton onClick={() => push('/swap')}>{t('Trade Now')}</TrailingButton>
            </div>
          </>
        </Box>
      ) : (
        <div className='w-full'>
          <Table
            data={data}
            sortOptions={sortOptions}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            sort={sort}
            setSort={setSort}
          />
        </div>
      )}
    </div>
  )
}

export default YourEarning
