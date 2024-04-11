import moment from 'moment'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useMemo, useState } from 'react'

import Box from '@/components/box'
import { PrimaryButton, TrailingButton } from '@/components/buttons/Button'
import ConnectButton from '@/components/buttons/ConnectButton'
import Table from '@/components/table'
import { Paragraph, TextHeading, TextSubHeading } from '@/components/typography'
import { formatAmount, fromWei } from '@/lib/utils'
import useWallet from '@/lib/wallets/useWallet'

function YourEarning({ earnings = [] }) {
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
  const { account } = useWallet()

  const data = useMemo(
    () =>
      earnings.map(item => ({
        epoch: item.day,
        date: item.lastUpdate,
        tradingVolume: item.amountAsUser,
        earned: 0,
        inUSD: 0,
      })),
    [earnings],
  )

  const sortedData = useMemo(
    () =>
      data.sort((a, b) => {
        let res
        switch (sort.value) {
          case 'epoch':
            res = (a.epoch - b.epoch) * (sort.isDesc ? -1 : 1)
            break
          case 'date':
            res = (a.date - b.date) * (sort.isDesc ? -1 : 1)
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
        date: <Paragraph>{moment(new Date(item.date * 1000)).format('ll')}</Paragraph>,
        tradingVolume: <Paragraph>${formatAmount(fromWei(item.tradingVolume))}</Paragraph>,
        earned: <Paragraph>{item.earned.toLocaleString()} THE</Paragraph>,
        inUSD: <Paragraph>${item.inUSD.toLocaleString()}</Paragraph>,
        action: <PrimaryButton className='w-full lg:w-fit'>{t('Claim')}</PrimaryButton>,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(sortedData), t],
  )

  return (
    <div className='mb-8'>
      <div className='mb-8 flex flex-col items-end gap-1 md:flex-row md:items-center md:justify-between md:gap-3'>
        <div className='mb-8 flex flex-col gap-2'>
          <TextHeading className='text-xl font-semibold md:text-3xl'>{t('Your Earnings')}</TextHeading>
          <TextSubHeading>{t('Your Earnings Description')}</TextSubHeading>
        </div>
      </div>
      {account ? (
        !finalData.length ? (
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
        )
      ) : (
        <Box className='flex flex-col items-center gap-4 lg:py-8'>
          <ConnectButton />
        </Box>
      )}
    </div>
  )
}

export default YourEarning
