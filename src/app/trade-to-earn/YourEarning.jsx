import moment from 'moment'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useMemo, useState } from 'react'

import Box from '@/components/box'
import { EmphasisButton, PrimaryButton, TrailingButton } from '@/components/buttons/Button'
import Table from '@/components/table'
import { Paragraph, TextHeading, TextSubHeading } from '@/components/typography'

function YourEarning() {
  const sortOptions = useMemo(
    () => [
      {
        label: 'Epoch',
        value: 'epoch',
        width: 'lg:w-[15%]',
        isDesc: true,
        hiddenMobile: true,
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
  const [data, setData] = useState([])

  const sortedData = useMemo(
    () =>
      data.sort((a, b) => {
        let res
        switch (sort.value) {
          case 'epoch':
            res = (a.epoch - b.epoch) * (sort.isDesc ? -1 : 1)
            break
          case 'date':
            res = (new Date(a.date).getTime() - new Date(b.date).getTime()) * (sort.isDesc ? -1 : 1)
            break
          case 'tradingVolume':
            res = (a.tradingVolume - b.tradingVolume) * (sort.isDesc ? -1 : 1)
            break
          case 'earned':
            res = (a.earned - b.earned) * (sort.isDesc ? -1 : 1)
            break

          case 'inUSD':
            res = (a.inUSD - b.inUSD) * (sort.isDesc ? -1 : 1)
            break

          default:
            break
        }
        return res
      }),
    [data, sort],
  )

  const finalData = useMemo(
    () =>
      sortedData.map(item => ({
        epoch: <Paragraph>{item.epoch}</Paragraph>,
        date: <Paragraph>{item.date}</Paragraph>,
        tradingVolume: <Paragraph>${item.tradingVolume.toLocaleString()}</Paragraph>,
        earned: <Paragraph>{item.earned.toLocaleString()} THE</Paragraph>,
        inUSD: <Paragraph>${item.inUSD.toLocaleString()}</Paragraph>,
        action: <EmphasisButton className='w-full lg:w-fit'>{t('Claim')}</EmphasisButton>,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(sortedData), t],
  )

  const handleAdd = () => {
    const randomDays = Math.floor(Math.random() * 365)
    const randomDate = moment().add(randomDays, 'days').format('LL')
    const item = {
      epoch: Math.floor(Math.random() * 1000),
      date: randomDate,
      tradingVolume: Math.floor(Math.random() * 10000),
      earned: Math.floor(Math.random() * 10000),
      inUSD: Math.floor(Math.random() * 10000),
    }
    const arr = [...data]
    arr.push(item)
    setData(arr)
  }

  return (
    <div className='mb-8'>
      <div className='mb-8 flex flex-col items-end gap-1 md:flex-row md:items-center md:justify-between md:gap-3'>
        <div className='mb-8 flex flex-col gap-2'>
          <TextHeading className='text-xl font-semibold md:text-3xl'>{t('Your Earnings')}</TextHeading>
          <TextSubHeading>{t('Your Earnings Description')}</TextSubHeading>
        </div>
        <div>
          <PrimaryButton onClick={handleAdd}>Add</PrimaryButton>
        </div>
      </div>
      {!finalData.length ? (
        <Box className='flex flex-col items-center gap-4 lg:py-8'>
          <TextHeading className='text-center text-xl md:text-3xl'>{t('No Earnings Found')}</TextHeading>
          <TextSubHeading className='text-center text-base'>
            {t('Go trade on ALPHA and claim your earnings here')}
          </TextSubHeading>
          <div className='flex justify-center'>
            <TrailingButton onClick={() => push('https://alpha.thena.fi/trade/BTCUSDT')}>
              {t('Trade Now')}
            </TrailingButton>
          </div>
        </Box>
      ) : (
        <div className='w-full'>
          <Table
            data={finalData}
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
