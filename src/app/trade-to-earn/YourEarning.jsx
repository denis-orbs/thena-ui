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
import { useTotalRewardADay } from '@/hooks/useTotalRewardADay'
import { readCall } from '@/lib/contractActions'
import { formatAmount, fromWei } from '@/lib/utils'
import useWallet from '@/lib/wallets/useWallet'
import { fetchDataTotalVolume, useClaimRewardMutation, useGetMuonMutation } from '@/modules/TradeToEarn'

function YourEarning({ earnings = [], refetchEarnings, setPending }) {
  const assets = useAssets()

  const [refetchCount, setRefetchCount] = useState(0)

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
        disabled: true,
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

        let isClaimable = false
        if (totalTradingADay && totalTradingADay.amountAsUser > 0) {
          for (const reward of totalRewardADay) {
            const earnedWei =
              reward.totalReward *
              (fromWei(item.amountAsUser).toNumber() / fromWei(totalTradingADay.amountAsUser).toNumber())

            if (account) {
              const claimed = await readCall(dibsRewarder, 'claimed', [account, reward.address, Number(item.day)])

              if (fromWei(earnedWei).toNumber() !== 0 && fromWei(claimed).toNumber() === 0) {
                isClaimable = true
              }
            }
            earned.push({
              total: fromWei(earnedWei).toNumber(),
              symbol: reward.symbol,
            })
          }
        }
        let inUSD = 0
        if (earned.length) {
          inUSD = earned.reduce((accumulator, currentValue, index) => {
            let price = 1
            const asset = assets.find(assetItem => assetItem.symbol === earned[index].symbol)
            if (asset) {
              price = asset.price
            }
            return accumulator + currentValue.total * price
          }, 0)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, assets, dibsRewarder, earnings, fetchTotalRewardADay, totalVolume, refetchCount])

  const { mutateAsync: getMuon, isPending: pendingGetMuon } = useGetMuonMutation()

  const { mutateAsync: claimReward, isPending: pendingClaim } = useClaimRewardMutation()

  const handleClaimReward = useCallback(
    async day => {
      try {
        setPending(true)
        const muonResponse = await getMuon(day)
        if (muonResponse) {
          const sigTimestamp = muonResponse?.data?.timestamp
          const reqId = muonResponse?.reqId
          const userVolume = muonResponse?.data?.result?.userVolume
          const totalVolumeBody = muonResponse?.data?.result?.totalVolume
          const schnorrsign = {
            signature: muonResponse?.signatures?.[0]?.signature,
            owner: muonResponse?.signatures?.[0]?.owner,
            nonce: muonResponse?.data?.init?.nonceAddress,
          }
          const gatewaySignature = muonResponse?.nodeSignature

          const body = [
            parseInt(day, 10),
            userVolume,
            totalVolumeBody,
            sigTimestamp,
            reqId,
            schnorrsign,
            gatewaySignature,
          ]

          const isSuccess = await claimReward(body)
          if (isSuccess) {
            refetchEarnings()
            setRefetchCount(count => count + 1)
          }
        }
        setPending(false)
      } catch (error) {
        setPending(false)
        console.log(error)
      }
    },
    [claimReward, getMuon, refetchEarnings, setPending],
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
        earned: item.earned.length && (
          <Paragraph>
            <div className='flex flex-col'>
              {item.earned.some(e => e.total) ? (
                item.earned.map(e =>
                  e.total ? (
                    <span key={e.symbol}>
                      {formatAmount(e.total)} {e.symbol}
                    </span>
                  ) : (
                    ''
                  ),
                )
              ) : (
                <span>
                  {formatAmount(item.earned[0].total)} {item.earned[0].symbol}
                </span>
              )}
            </div>
          </Paragraph>
        ),
        inUSD: <Paragraph>{item.inUSD ? `$${formatAmount(item.inUSD)}` : '$0'}</Paragraph>,
        action: Number(item.epoch) !== Number(currentDay) && Boolean(item.earned.find(e => e.total !== 0)) && (
          <PrimaryButton
            className='w-full'
            onClick={() => handleClaimReward(item.epoch)}
            disabled={!item.isClaimable || pendingGetMuon || pendingClaim}
          >
            {t(item.isClaimable ? 'Claim' : 'Claimed')}
          </PrimaryButton>
        ),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pendingClaim, pendingGetMuon, sortedData, t],
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
