'use client'

import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import _ from 'lodash'
import { useTranslations } from 'next-intl'
import { useRouter } from 'nextjs-toploader/app'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { DibsRewarderABI } from '@/abis/t2e/DibsRewarderABI'
import Box from '@/components/box'
import { PrimaryButton, TrailingButton } from '@/components/buttons/Button'
import ConnectButton from '@/components/buttons/ConnectButton'
import Table from '@/components/table'
import CustomTooltip from '@/components/tooltip'
import { Paragraph, TextHeading, TextSubHeading } from '@/components/typography'
import { trade2EarnStartTime } from '@/constant'
import Contracts from '@/constant/contracts'
import { useAssets } from '@/context/assetsContext'
import { useDibsRewarder } from '@/context/dibsRewarderContext'
import { useTotalRewardADay } from '@/hooks/useTotalRewardADay'
import useWallet from '@/hooks/useWallet'
import { readCall } from '@/lib/contractActions'
import { formatAmount, fromWei } from '@/lib/utils'
import {
  fetchDataEarnings,
  fetchDataTradeToEarnCount,
  useClaimRewardMutation,
  useGetMuonMutation,
} from '@/modules/TradeToEarn'
import { useChainSettings } from '@/state/settings/hooks'

import Loading from '../loading'

dayjs.extend(utc)

function YourEarning({ setPending }) {
  const assets = useAssets()
  const { networkId } = useChainSettings()

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

  const t = useTranslations()
  const { push } = useRouter()
  const [currentPage, setCurrentPage] = useState(1)
  const [sort, setSort] = useState(sortOptions[0])
  const { account } = useWallet()
  const { fetchTotalRewardADay } = useTotalRewardADay()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const { currentDay } = useDibsRewarder()
  const [earningsFetch, setEarningsFetch] = useState([])

  const {
    data: earnings,
    refetch: refetchEarnings,
    isLoading,
  } = useQuery({
    queryKey: ['getEarnings', account, currentPage],
    queryFn: () => fetchDataEarnings(account?.toLowerCase(), currentPage),
    refetchInterval: 30000,
    enabled: Boolean(account),
    gcTime: 0,
  })

  const { data: totalItemEarnings } = useQuery({
    queryKey: ['getTotalCountTradeToEarn', account],
    queryFn: () => fetchDataTradeToEarnCount(account?.toLowerCase(), 17),
    refetchInterval: 30000,
    enabled: Boolean(account),
    gcTime: 0,
  })

  const getDataCallback = useCallback(async () => {
    if (!isLoading) {
      if (earnings && earnings.length) {
        if (!_.isEqual(earnings, earningsFetch) || !data.length) {
          setLoading(true)
        }
        const dibsRewarder = {
          address: Contracts.dibsRewarder[networkId],
          abi: DibsRewarderABI,
        }
        const rs = await Promise.all(
          earnings.map(async item => {
            const totalRewardADay = await fetchTotalRewardADay(item.day)
            const earned = []
            let isClaimable = false
            for (const reward of totalRewardADay) {
              const earnedWei = reward.totalReward * item.amountPercent

              if (account && dibsRewarder) {
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

            if (earned.some(e => e.total)) {
              const parsedDate = dayjs.unix(trade2EarnStartTime).utc().add(item.day, 'days').format('MMM D, YYYY')
              return {
                epoch: item.day,
                date: parsedDate,
                tradingVolume: item.amountAsUser,
                earned,
                inUSD,
                isClaimable,
              }
            }
            return undefined
          }),
        )
        setData(rs.filter(item => item))
        setLoading(false)
      } else {
        setData([])
      }
      setEarningsFetch(earnings)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, earnings, fetchTotalRewardADay, assets, refetchCount])

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
            res = (new Date(a.date).getTime() - new Date(b.date).getTime()) * (sort.isDesc ? -1 : 1)
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

  // eslint-disable-next-line newline-per-chained-call
  const isAfter = dayjs().utc().hour() >= 2

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const activeButton = useMemo(() => isAfter, [JSON.stringify(isAfter)])

  const finalData = useMemo(
    () =>
      sortedData.map(item => ({
        epoch: <Paragraph>{item.epoch}</Paragraph>,
        date: <Paragraph>{item.date}</Paragraph>,
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
          <div>
            <PrimaryButton
              className='w-full'
              onClick={() => handleClaimReward(item.epoch)}
              disabled={
                !item.isClaimable ||
                pendingGetMuon ||
                pendingClaim ||
                (Number(item.epoch) === Number(currentDay) - 1 && !activeButton)
              }
              data-tooltip-id={`claim-button${item.epoch}`}
            >
              {t(item.isClaimable ? 'Claim' : 'Claimed')}
            </PrimaryButton>
            {Number(item.epoch) === Number(currentDay) - 1 && !activeButton && (
              <CustomTooltip id={`claim-button${item.epoch}`}>{t('Claim tooltip')}</CustomTooltip>
            )}
          </div>
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
        !data.length ? (
          !isLoading && !loading ? (
            <Box className='flex flex-col items-center gap-4 lg:py-8'>
              <TextHeading className='text-center text-xl md:text-3xl'>{t('No Earnings Found')}</TextHeading>
              <TextSubHeading className='text-center text-base'>
                {t('Go trade on ALPHA and claim your earnings here')}
              </TextSubHeading>
              <div className='flex justify-center'>
                <TrailingButton onClick={() => push('https://perps.thena.fi/trade/BTCUSDT')}>
                  {t('Trade Now')}
                </TrailingButton>
              </div>
            </Box>
          ) : (
            <Box className='relative min-h-[200px] lg:py-8'>
              <Loading />
            </Box>
          )
        ) : (
          <div className='w-full'>
            <Table
              data={finalData}
              sortOptions={sortOptions}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              sort={sort}
              setSort={setSort}
              loading={loading}
              totalItems={totalItemEarnings}
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
