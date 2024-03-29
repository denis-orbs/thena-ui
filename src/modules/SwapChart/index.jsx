'use client'

import dayjs from 'dayjs'
import { memo, useEffect, useMemo, useState } from 'react'

import { GreenBadge, PrimaryBadge } from '@/components/badges/Badge'
import Box from '@/components/box'
import IconGroup from '@/components/icongroup'
import Skeleton from '@/components/skeleton'
import Tabs from '@/components/tabs'
import { Paragraph, TextHeading } from '@/components/typography'
import { formatAmount, wrappedAddress } from '@/lib/utils'

import { PairDataTimeWindow } from './fetch'
import { useFetchPairPrices } from './hooks'
import SwapLineChart from './SwapLineChart'
import { getTimeWindowChange } from './utils'

function SwapChart({ asset0, asset1, currentSwapPrice }) {
  const [timeWindow, setTimeWindow] = useState()

  const { data: pairPrices = [], error } = useFetchPairPrices({
    token0Address: wrappedAddress(asset0),
    token1Address: wrappedAddress(asset1),
    timeWindow,
    currentSwapPrice,
  })

  const [hoverValue, setHoverValue] = useState()
  const [hoverDate, setHoverDate] = useState()
  const valueToDisplay = useMemo(() => hoverValue || pairPrices[pairPrices.length - 1]?.value, [pairPrices, hoverValue])
  const {
    changePercentage: changePercentageToCurrent,
    changeValue: changeValueToCurrent,
    isChangePositive: isChangePositiveToCurrent,
  } = useMemo(() => getTimeWindowChange(pairPrices), [pairPrices])

  const { changePercentage, isChangePositive } = useMemo(() => {
    if (hoverValue) {
      const lastItem = pairPrices[pairPrices.length - 1]
      if (lastItem) {
        const copyPairPrices = [...pairPrices]
        copyPairPrices[pairPrices.length - 1] = { ...lastItem, value: hoverValue }
        return getTimeWindowChange(copyPairPrices)
      }
    }
    return {
      changePercentage: changePercentageToCurrent,
      changeValue: changeValueToCurrent,
      isChangePositive: isChangePositiveToCurrent,
    }
  }, [pairPrices, hoverValue, changePercentageToCurrent, changeValueToCurrent, isChangePositiveToCurrent])

  const currentDate = useMemo(() => {
    if (!hoverDate) {
      return dayjs().format('MMM D, YYYY HH:mm (UTC)')
    }
    return null
  }, [hoverDate])

  const periods = useMemo(
    () => [
      {
        label: '24H',
        active: timeWindow === PairDataTimeWindow.DAY,
        onClickHandler: () => {
          setTimeWindow(PairDataTimeWindow.DAY)
        },
      },
      {
        label: '1W',
        active: timeWindow === PairDataTimeWindow.WEEK,
        onClickHandler: () => {
          setTimeWindow(PairDataTimeWindow.WEEK)
        },
      },
      {
        label: '1M',
        active: timeWindow === PairDataTimeWindow.MONTH,
        onClickHandler: () => {
          setTimeWindow(PairDataTimeWindow.MONTH)
        },
      },
      {
        label: '1Y',
        active: timeWindow === PairDataTimeWindow.YEAR,
        onClickHandler: () => {
          setTimeWindow(PairDataTimeWindow.YEAR)
        },
      },
    ],
    [timeWindow],
  )

  useEffect(() => {
    setTimeWindow(PairDataTimeWindow.DAY)
  }, [])

  return (
    <Box>
      <div className='flex flex-col items-start gap-2 lg:flex-row lg:justify-between'>
        <div className='flex flex-col gap-1'>
          {asset0 && asset1 ? (
            <div className='flex items-center gap-2'>
              <IconGroup
                className='-space-x-1.5'
                classNames={{
                  image: 'outline-[2px] w-6 h-6',
                }}
                logo1={asset1.logoURI}
                logo2={asset0.logoURI}
              />

              <TextHeading className='text-xl'>
                {asset1.symbol}/{asset0.symbol}
              </TextHeading>
            </div>
          ) : (
            <Skeleton className='h-[28px] w-[150px]' />
          )}
          {error ? (
            <TextHeading className='text-xl'>-</TextHeading>
          ) : valueToDisplay ? (
            <div className='flex items-center gap-2'>
              <TextHeading className='text-xl'>{valueToDisplay && formatAmount(valueToDisplay, false, 5)}</TextHeading>
              {isChangePositive ? (
                <GreenBadge>{changePercentage}%</GreenBadge>
              ) : (
                <PrimaryBadge>{changePercentage}%</PrimaryBadge>
              )}
            </div>
          ) : (
            <Skeleton className='h-[28px] w-[150px]' />
          )}
          <Paragraph className='text-sm'>{hoverDate || currentDate}</Paragraph>
        </div>

        <Tabs data={periods} />
      </div>
      <div className='mt-2 flex h-[250px] items-center justify-center'>
        {error ? (
          <Paragraph>Failed to load price chart for this pair</Paragraph>
        ) : (
          <SwapLineChart
            data={pairPrices}
            setHoverValue={setHoverValue}
            setHoverDate={setHoverDate}
            timeWindow={timeWindow}
          />
        )}
      </div>
    </Box>
  )
}

export default memo(SwapChart)
