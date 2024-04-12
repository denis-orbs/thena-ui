import { useQuery } from '@tanstack/react-query'
import moment from 'moment'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import Box from '@/components/box'
import { PrimaryButton, TrailingButton } from '@/components/buttons/Button'
import ConnectButton from '@/components/buttons/ConnectButton'
import Table from '@/components/table'
import { Paragraph, TextHeading, TextSubHeading } from '@/components/typography'
import { useAssets } from '@/context/assetsContext'
import { useDibsRewarder } from '@/context/dibsRewarderContext'
import { useClaimReward } from '@/hooks/useDibsRewarder'
import { useTotalRewardADay } from '@/hooks/useTotalRewardADay'
import { readCall } from '@/lib/contractActions'
import { warnToast } from '@/lib/notify'
import { formatAmount, fromWei } from '@/lib/utils'
import useWallet from '@/lib/wallets/useWallet'
import { fetchDataTotalVolume } from '@/modules/TradeToEarn'

function YourEarning({ earnings = [] }) {
  const assets = useAssets()
  const { onClaimReward, pending } = useClaimReward()

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
        width: 'lg:w-[15%]',
        disabled: true,
      },
    ],
    [],
  )

  const { data: totalVolume } = useQuery({
    queryKey: ['getTotalVolumeEveryDay'],
    queryFn: () =>
      fetchDataTotalVolume('0x0000000000000000000000000000000000000000', '0x0000000000000000000000000000000000000000'),
    refetchInterval: 30000,
    gcTime: 0,
  })

  const t = useTranslations()
  const { push } = useRouter()
  const [currentPage, setCurrentPage] = useState(1)
  const [sort, setSort] = useState(sortOptions[0])
  const { account } = useWallet()
  const { fetchTotalRewardADay } = useTotalRewardADay()
  const [data, setData] = useState([])
  const { dibsRewarder, currentDay } = useDibsRewarder()

  const getDataCallback = useCallback(async () => {
    if (earnings.length) {
      const items = []
      for (const item of earnings) {
        const totalRewardADay = await fetchTotalRewardADay(item.day)
        const totalTradingADay = totalVolume?.find(totalVolItem => totalVolItem.day === item.day)
        const earned = []
        const inUSD = []
        let isClaimable = false
        if (totalTradingADay && totalTradingADay.amountAsUser > 0) {
          for (const reward of totalRewardADay) {
            const earnedWei =
              reward.totalReward *
              (fromWei(item.amountAsUser).toNumber() / fromWei(totalTradingADay.amountAsUser).toNumber())
            // ToDo: hard code for test
            // * 10 ** 30

            if (account) {
              const claimed = await readCall(dibsRewarder, 'claimed', [account, reward.address, Number(item.day)])
              const checkClaim = earnedWei - fromWei(claimed).toNumber()
              if (checkClaim > 0) {
                isClaimable = true
              }
            }
            earned.push({
              total: fromWei(earnedWei).toNumber(),
              symbol: reward.symbol,
            })
          }
        }

        if (earned.length) {
          earned.forEach(e => {
            let price = 1
            const asset = assets.find(assetItem => assetItem.symbol === e.symbol)
            if (asset) {
              price = asset.price
            }
            inUSD.push(e.total * price)
          })
        }

        items.push({
          epoch: item.day,
          date: item.lastUpdate,
          tradingVolume: item.amountAsUser,
          earned,
          inUSD,
          isClaimable,
        })
      }

      setData(items)
    } else {
      setData([])
    }
  }, [account, assets, dibsRewarder, earnings, fetchTotalRewardADay, totalVolume])

  const handleClaimReward = useCallback(
    async day => {
      if (account) {
        return await onClaimReward(account, day)
      }
      warnToast('Error')
    },
    [account, onClaimReward],
  )

  useEffect(() => {
    getDataCallback()
  }, [getDataCallback])

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
            res = a.earned[0] && b.earned[0] ? (a.earned[0].total - b.earned[0].total) * (sort.isDesc ? -1 : 1) : 0
            break
          case 'inUSD':
            res = a.inUSD[0] && b.inUSD[0] ? (a.inUSD[0] - b.inUSD[0]) * (sort.isDesc ? -1 : 1) : 0
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
        earned: <Paragraph>{item.earned.map(e => `${formatAmount(e.total)} ${e.symbol}`).join(', ')}</Paragraph>,
        inUSD: (
          <Paragraph>${item.inUSD.length ? item.inUSD.map(usd => `${formatAmount(usd)}`).join(', ') : 0}</Paragraph>
        ),
        action:
          Number(item.epoch) !== Number(currentDay) ? (
            <PrimaryButton
              className='w-full'
              onClick={() => handleClaimReward(item.epoch)}
              disabled={!item.isClaimable || pending}
            >
              {t(item.isClaimable ? 'Claim' : 'Claimed')}
            </PrimaryButton>
          ) : (
            ''
          ),
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
