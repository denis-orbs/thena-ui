import { useMemo, useState } from 'react'

import Skeleton from '@/components/skeleton'
import Tabs from '@/components/tabs'
import { NewTextSubHeading, Paragraph } from '@/components/typography'
import { PairDataTimeWindow } from '@/modules/SwapChart/fetch'
import { useFetchPairPrices } from '@/modules/SwapChart/hooks'
import PoolChart from '@/modules/SwapChart/PoolChart'
import { wrappedAddress } from '@/utils/utils'

function PriceHistoryChart({ baseCurrency, quoteCurrency, currentPrice, position, chartDomain }) {
  const [timeWindow, setTimeWindow] = useState(PairDataTimeWindow.WEEK)

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

  const {
    data: pairPrices = [],
    isLoading,
    error,
  } = useFetchPairPrices({
    token0Address: wrappedAddress(quoteCurrency),
    token1Address: wrappedAddress(baseCurrency),
    timeWindow,
  })

  return (
    <>
      <div className='flex flex-row items-center justify-end gap-2 lg:justify-between'>
        <NewTextSubHeading className='hidden text-sm font-semibold lg:block lg:text-xl'>
          Price History
        </NewTextSubHeading>
        <Tabs itemClassName='text-[8px] sm:text-xs' data={periods} />
      </div>
      {isLoading ? (
        <Skeleton className='mt-2 flex h-[200px] items-center justify-center lg:h-[300px]' />
      ) : (
        <div className='mt-2 flex h-[200px] items-center justify-center lg:h-[300px]'>
          {error ? (
            <Paragraph>Failed to load price chart for this pair</Paragraph>
          ) : (
            <PoolChart
              data={pairPrices}
              timeWindow={timeWindow}
              current={Number(currentPrice)}
              lower={Number(position?.minPrice ?? chartDomain[0] ?? 0)}
              upper={Number(position?.maxPrice ?? chartDomain[1] ?? 0)}
            />
          )}
        </div>
      )}
    </>
  )
}

export default PriceHistoryChart
