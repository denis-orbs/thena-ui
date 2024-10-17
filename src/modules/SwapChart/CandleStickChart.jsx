'use client'

import dayjs from 'dayjs'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'

import { STABLE_TOKENS } from '@/constant'
import { wrappedAddress } from '@/lib/utils'
import { useChainSettings } from '@/state/settings/hooks'

import { CandleStickChartBase } from './CandleStickChartBase'
import { ChartTimeInterval } from './fetch'
import { fetchAdvancedPairPrices } from './hooks'

const currentTime = dayjs().unix()

const formatChartData = arr =>
  arr
    .filter((item, index, self) => index === self.findIndex(t => t?.time === item?.time))
    .sort((a, b) => a.time - b.time)
// const logData = (name, data) => {
//   console.log(
//     { name },
//     {
//       from: data?.[0]?.time ? dayjs(data[0].time * 1000).format('YYYY-MM-DD HH:mm') : null,
//       to: data?.[data.length - 1]?.time ? dayjs(data[data.length - 1].time * 1000).format('YYYY-MM-DD HH:mm') : null,
//       length: data.length,
//       interval: data?.[1]?.time - data?.[0]?.time,
//     },
//   )
// }

function CandleStickChart({ asset0, asset1, isResetChart, setResetChart }) {
  const { networkId } = useChainSettings()
  const [timeInterval, setTimeInterval] = useState(ChartTimeInterval.MIN_30)

  const [loadMoreData, setLoadMoreData] = useState([])
  const [isScrolling, setScrolling] = useState(false)
  const [allData, setAllData] = useState([])

  const resetData = () => {
    setAllData([])
    setLoadMoreData([])
  }

  const activeToken = useMemo(() => {
    let token = asset0
    const listStableTokenAddress = Object.values(STABLE_TOKENS[networkId]).map(address => address.toLowerCase())
    if (listStableTokenAddress.includes(asset0?.address)) {
      token = asset1
    }
    return token
  }, [networkId, asset0, asset1])

  const fetchChartData = useCallback(
    async time => {
      const data = await fetchAdvancedPairPrices(wrappedAddress(activeToken), networkId, time, timeInterval)
      setLoadMoreData(data)
    },
    [activeToken, networkId, timeInterval],
  )

  // load more data
  useEffect(() => {
    if (isScrolling) {
      const lastFromTimeStamp = allData[0]?.time
      if (!lastFromTimeStamp) return
      const timeStamp = lastFromTimeStamp - 1
      fetchChartData(timeStamp)
      setScrolling(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isScrolling])

  useEffect(() => {
    resetData()
    fetchChartData(currentTime)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    resetData()
    fetchChartData(currentTime)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeInterval])

  useEffect(() => {
    if (isResetChart) {
      resetData()
      fetchChartData(currentTime)
      setResetChart(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isResetChart])

  useEffect(() => {
    const interval = setInterval(() => {
      fetchChartData(dayjs().unix())
    }, 1000 * 60)

    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (Array.isArray(loadMoreData) && loadMoreData.length) {
      setAllData(allPreData =>
        formatChartData([...loadMoreData, ...allPreData]).filter(data => data.tokenAddress === activeToken.address),
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadMoreData])

  // logData('loadMoreData', loadMoreData)
  // logData('allData', allData)

  return (
    <>
      {/* <PrimaryButton onClick={() => {}}>Test</PrimaryButton> */}
      {activeToken && (
        <CandleStickChartBase
          key={activeToken.symbol}
          data={allData}
          setLoadMoreData={setLoadMoreData}
          setData={setAllData}
          setScrolling={setScrolling}
          timeInterval={timeInterval}
          setTimeInterval={setTimeInterval}
          activeToken={activeToken}
        />
      )}
    </>
  )
}

export default memo(CandleStickChart)
