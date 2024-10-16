'use client'

import dayjs from 'dayjs'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'

import { STABLE_TOKENS } from '@/constant'
import { wrappedAddress } from '@/lib/utils'
import { useChainSettings } from '@/state/settings/hooks'

import { CandleStickChartBase } from './CandleStickChartBase'
import { ChartTimeInterval } from './fetch'
import { fetchAdvancedPairPrices } from './hooks'

// const test = [
//   { open: 10, high: 10.63, low: 9.49, close: 9.55, time: 1642427876 },
//   { open: 9.55, high: 10.3, low: 9.42, close: 9.94, time: 1642514276 },
//   { open: 9.94, high: 10.17, low: 9.92, close: 9.78, time: 1642600676 },
//   { open: 9.78, high: 10.59, low: 9.18, close: 9.51, time: 1642687076 },
//   { open: 9.51, high: 10.46, low: 9.1, close: 10.17, time: 1642773476 },
//   { open: 10.17, high: 10.96, low: 10.16, close: 10.47, time: 1642859876 },
//   { open: 10.47, high: 11.39, low: 10.4, close: 10.81, time: 1642946276 },
//   { open: 10.81, high: 11.6, low: 10.3, close: 10.75, time: 1643032676 },
//   { open: 10.75, high: 11.6, low: 10.49, close: 10.93, time: 1643119076 },
//   { open: 10.93, high: 11.53, low: 10.76, close: 10.96, time: 1643205476 },
// ]

// const genNewBar = time =>
//   // const currentTime = dayjs().unix()
//   ({ open: 10.93, high: 11.53, low: 10.76, close: 10.96, time })

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
  // const [dataTest, setDataTest] = useState(test)
  const [isScrolling, setScrolling] = useState(false)
  // const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [allData, setAllData] = useState([])

  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     setEndTimeStampFirstPage(dayjs())
  //   }, 1000 * 60)

  //   return () => clearInterval(interval)
  // }, [])

  // const handleLoadmoreData = useCallback(async () => {
  //   if (!activeToken || !networkId || !timeInterval) return
  //   const firstDataTime = loadMoreData[0]?.time
  //   console.log({
  //     firstDataTime,
  //   })
  //   if (firstDataTime) {
  //     const from = Math.max(
  //       dayjs(firstDataTime)
  //         .subtract(Number(timeInterval) * NUMBER_CHART_DATA, 'minutes')
  //         .startOf('minutes')
  //         .unix(),
  //       FUSION_MULTI_CHAIN_START_TIME[networkId],
  //     )

  //     const data =
  //       (await fetchAdvancedPairPrices(wrappedAddress(activeToken), networkId, dayjs(from * 1000 - 1), timeInterval)) ??
  //       []
  //     console.log({
  //       loadMoreData: data,
  //     })
  //     const newData = [...data, ...data]
  //     setLoadMoreData([...newData])
  //     setScrolling(false)
  //   }
  // }, [loadMoreData, activeToken, networkId, timeInterval])

  // useEffect(() => {
  //   if (isScrolling) {
  //     handleLoadmoreData()
  //   }
  // }, [isScrolling, handleLoadmoreData])

  // ---------------------------------------------OK

  const resetData = () => {
    // console.log('resetData', { asset0 })
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
