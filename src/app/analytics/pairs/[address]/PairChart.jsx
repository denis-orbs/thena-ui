'use client'

import { gql } from 'graphql-request'
import useSWR from 'swr'

import BarChart from '@/components/charts/BarChart'
import HoverableChart from '@/components/charts/HoverableChart'
import LineChart from '@/components/charts/LineChart'
import {
  FUSION_MULTI_CHAIN_START_TIME,
  ICHI_SINGLE_SIDED,
  MANUAL_TYPES,
  PAIR_TYPES,
  V1_MULTI_CHAIN_START_TIME,
} from '@/constant'
import { fetchChartData } from '@/hooks/useGraph'
import { fetchHistoricalTokensPrice } from '@/lib/api'
import { AlgebraClient, v1Client, weightedClient } from '@/lib/graphql'
import { useChainSettings } from '@/state/settings/hooks'

const V1_DAY_DATAS = gql`
  query v1PairCharts($address: String!, $startTime: Int!, $tokens: [String!]!, $skip: Int!) {
    pairDayDatas(
      first: 1000
      skip: $skip
      where: { pairAddress: $address, date_gte: $startTime }
      orderBy: date
      orderDirection: asc
    ) {
      date
      dailyVolumeUSD
      reserveUSD
      dailyVolumeToken0
      dailyVolumeToken1
      reserve0
      reserve1
    }
    tokens(where: { id_in: $tokens }) {
      derivedETH
    }
  }
`

// const FUSION_TOKEN_DATAS = gql`
//   query fusionPairCharts($tokens: [String!]!) {
//     tokens(where: { id_in: $tokens }) {
//       derivedBNB
//     }
//   }
// `

const FUSION_DAY_DATAS = gql`
  query fusionPairCharts($address: String!, $startTime: Int!, $skip: Int!) {
    poolDayDatas(
      first: 1000
      skip: $skip
      where: { pool: $address, date_gte: $startTime }
      orderBy: date
      orderDirection: asc
    ) {
      date
      feesUSD
      volumeUSD
      untrackedVolumeUSD
      tvlUSD
      feesToken0
      feesToken1
    }
  }
`

const WEIGHTED_DAY_DATA = gql`
  query weightedPairCharts($address: String!) {
    poolSnapshots(first: 1000, where: { pool_: { address: $address } }) {
      timestamp
      swapsCount
      swapVolume
      swapFees
      liquidity
      amounts
    }
  }
`

export const getHistoricalTokenPrice = async ({ chainId, tokenAddresses, startTime }) => {
  const result = []
  const PAGE_SIZE = 1000
  let page = 1
  let hasMore = true

  while (hasMore) {
    try {
      const { data } = await fetchHistoricalTokensPrice({
        chainId,
        tokenAddresses,
        page,
        limit: PAGE_SIZE,
        startDate: startTime,
      })

      result.push(...data)
      if (data.length < PAGE_SIZE) {
        hasMore = false
      } else {
        page++
      }
    } catch (e) {
      console.error('Error fetching HistoricalTokensPrice:', e)
      hasMore = false
    }
  }
  return result
}

// export const checkFusionTokensData = async tokenAddresses => {
//   try {
//     const { tokens } = await AlgebraClient[version][chainId].request(FUSION_TOKEN_DATAS, {
//       tokens: tokenAddresses,
//     })
//     return tokens.some(token => Number(token.derivedETH ?? 0) === 0)
//   } catch (error) {
//     console.error('Failed to fetch fusion token', error)
//     return true
//   }
// }

export function findNearestPrice(historicalPrices, targetTimestamp, address) {
  let nearest = null
  let minDiff = Infinity
  const found = historicalPrices.find(item => item.date === targetTimestamp && address === item.address)
  if (found) return found.priceUSD
  for (const datePrice of historicalPrices) {
    if (datePrice.address.toLowerCase() === address.toLowerCase()) {
      const diff = Math.abs(Number(datePrice.date) - Number(targetTimestamp))
      if (diff < minDiff) {
        nearest = datePrice.priceUSD
        minDiff = diff
      }
    }
  }

  return nearest
}

export const getV1ChartData = async ({ chainId, tokens: tokensParam, address, fee }, skip) => {
  try {
    const { pairDayDatas, tokens } = await v1Client[chainId].request(V1_DAY_DATAS, {
      address,
      startTime: V1_MULTI_CHAIN_START_TIME[chainId],
      skip,
      tokens: tokensParam,
    })

    if (tokens.some(token => Number(token.derivedETH ?? 0) === 0)) {
      const priceData = await getHistoricalTokenPrice({
        chainId,
        tokenAddresses: tokensParam,
        startTime: V1_MULTI_CHAIN_START_TIME[chainId],
      })
      const data = pairDayDatas.map(ele => {
        const datePrice0 = findNearestPrice(priceData, ele.date, tokensParam[0])
        const datePrice1 = findNearestPrice(priceData, ele.date, tokensParam[1])

        const tvlUSD = parseFloat(ele.reserve0 * (datePrice0 ?? 0) + ele.reserve1 * (datePrice1 ?? 0))
        const dayVolume = parseFloat(
          ele.dailyVolumeToken0 * (datePrice0 ?? 0) + ele.dailyVolumeToken1 * (datePrice1 ?? 0),
        )
        return {
          date: ele.date,
          tvlUSD,
          dayVolume,
          dayFees: (dayVolume * fee) / 100,
        }
      })
      return { data, error: false }
    }

    const data = pairDayDatas.map(ele => ({
      date: ele.date,
      tvlUSD: parseFloat(ele.reserveUSD),
      dayVolume: parseFloat(ele.dailyVolumeUSD),
      dayFees: (parseFloat(ele.dailyVolumeUSD) * fee) / 100,
    }))
    return { data, error: false }
  } catch (error) {
    console.error('Failed to fetch v1 pair chart data', error)
    return { error: true }
  }
}

export const getFusionChartData = async ({
  chainId,
  tokens: tokensParam,
  address,
  version = 2,
  skip = 0,
  startTime,
}) => {
  try {
    const { poolDayDatas } = await AlgebraClient[version][chainId].request(FUSION_DAY_DATAS, {
      address,
      startTime: startTime || FUSION_MULTI_CHAIN_START_TIME[chainId],
      skip,
      tokens: tokensParam,
    })
    const data = poolDayDatas.map(ele => ({
      date: ele.date,
      dayVolume: parseFloat(ele.volumeUSD) || parseFloat(ele.untrackedVolumeUSD),
      tvlUSD: parseFloat(ele.tvlUSD),
      dayFees: parseFloat(ele.feesUSD),
      feesToken0: parseFloat(ele.feesToken0),
      feesToken1: parseFloat(ele.feesToken1),
    }))
    return { data, error: false }
  } catch (error) {
    console.error('Failed to fetch fusion pair chart data', error)
    return { error: true }
  }
}

export const getWeightedChartData = async (chainId, address, skip) => {
  try {
    const { poolSnapshots } = await weightedClient[chainId].request(WEIGHTED_DAY_DATA, {
      address,
      skip,
    })

    const data = poolSnapshots?.map(ele => ({
      date: ele.timestamp,
      dayVolume: Number(ele.swapVolume),
      tvlUSD: Number(ele.liquidity),
      dayFees: Number(ele.swapFees),
    }))

    return { data, error: false }
  } catch (error) {
    console.error('Failed to fetch fusion pair chart data', error)
    return { data: [], error: true }
  }
}

export const fetchPairChartData = async (chainId, pair) => {
  if (pair.type === PAIR_TYPES.WEIGHTED) {
    const { data: weightedData = [] } = await fetchChartData(getWeightedChartData, [chainId, pair.address], false)
    return weightedData
  }

  if (pair.type === PAIR_TYPES.LSD) {
    const version = pair?.version
    // const needFetchHistoricalPrice = await checkFusionTokensData([pair.token0.address, pair.token1.address])

    // let priceData = null
    // if (needFetchHistoricalPrice) {
    //   priceData = await getHistoricalTokenPrice({
    //     chainId,
    //     tokenAddresses: tokensParam,
    //     startTime: V1_MULTI_CHAIN_START_TIME[chainId],
    //   })
    // }

    const { data: fusionData = [] } = await fetchChartData(
      getFusionChartData,
      [{ chainId, address: pair?.address, version }],
      false,
    )
    if (!pair?.version === 3) return fusionData

    const { data: fusionDataV2 = [] } = await fetchChartData(
      getFusionChartData,
      [{ chainId, address: pair.address, version: 2 }],
      false,
    )

    let fusionFeeData = []
    const swapFeePool = pair.subpools.find(ele => ele.title === MANUAL_TYPES[1])
    if (swapFeePool) {
      const { data } = await fetchChartData(
        getFusionChartData,
        [{ chainId, address: swapFeePool.address, version }],
        false,
      )
      fusionFeeData = data ?? []
    }

    let ichiSingleSidedData = []
    const ichiSingleSidedPool = pair.subpools.find(ele => ele.title === ICHI_SINGLE_SIDED)
    if (ichiSingleSidedPool) {
      const { data } = await fetchChartData(
        getFusionChartData,
        [
          {
            chainId,
            address: ichiSingleSidedPool.algebraV2,
            startTime: 1747872000,
            version: 2,
          },
        ],
        false,
      )
      ichiSingleSidedData = data ?? []
    }

    const mergedData = []
    const allDates = new Set([
      ...fusionData.map(d => d.date),
      ...fusionFeeData.map(d => d.date),
      ...fusionDataV2.map(d => d.date),
      ...ichiSingleSidedData.map(d => d.date),
    ])

    allDates.forEach(date => {
      const data1 = fusionData.find(d => d.date === date)
      const data2 = fusionFeeData.find(d => d.date === date)
      const data3 = fusionDataV2.find(d => d.date === date)
      const data4 = ichiSingleSidedData.find(d => d.date === date)
      const dateData = {
        date,
        dayFees: (data1?.dayFees ?? 0) + (data2?.dayFees ?? 0) + (data3?.dayFees ?? 0) + (data4?.dayFees ?? 0),
        dayVolume:
          (data1?.dayVolume ?? 0) + (data2?.dayVolume ?? 0) + (data3?.dayVolume ?? 0) + (data4?.dayVolume ?? 0),
        tvlUSD: (data1?.tvlUSD ?? 0) + (data2?.tvlUSD ?? 0) + (data3?.tvlUSD ?? 0) + (data4?.tvlUSD ?? 0),
      }

      // if (priceData) {
      //   const datePrice0 = priceData.find(item => item.date === ele.date && tokensParam[0] === item.address)
      //   const datePrice1 = priceData.find(item => item.date === ele.date && tokensParam[1] === item.address)

      //   const dailyVolumeToken0 =
      //     (data1?.dailyVolumeToken0 ?? 0) +
      //     (data2?.dailyVolumeToken0 ?? 0) +
      //     (data3?.dailyVolumeToken0 ?? 0) +
      //     (data4?.dailyVolumeToken0 ?? 0)
      //   const dailyVolumeToken1 =
      //     (data1?.dailyVolumeToken1 ?? 0) +
      //     (data2?.dailyVolumeToken1 ?? 0) +
      //     (data3?.dailyVolumeToken1 ?? 0) +
      //     (data4?.dailyVolumeToken1 ?? 0)
      //   const feesToken0 =
      //     (data1?.feesToken0 ?? 0) + (data2?.feesToken0 ?? 0) + (data3?.feesToken0 ?? 0) + (data4?.feesToken0 ?? 0)
      //   const feesToken1 =
      //     (data1?.feesToken1 ?? 0) + (data2?.feesToken1 ?? 0) + (data3?.feesToken1 ?? 0) + (data4?.feesToken1 ?? 0)

      //   dateData.dayVolume = dailyVolumeToken0 * datePrice0.priceUSD + dailyVolumeToken1 * datePrice1.priceUSD
      //   dateData.dayFees = feesToken0 * datePrice0.priceUSD + feesToken1 * datePrice1.priceUSD
      // }

      mergedData.push(dateData)
    })

    return mergedData
  }

  const { data: v1data } = await fetchChartData(
    getV1ChartData,
    [
      {
        chainId,
        tokens: [pair.token0.address, pair.token1.address],
        address: pair.address,
        fee: pair.fee,
      },
    ],
    false,
  )
  return v1data
}

export default function PairChart({ pair }) {
  const { networkId } = useChainSettings()
  const { data: chartData } = useSWR(
    pair && ['analytics/pair/chart', pair.address],
    () => fetchPairChartData(networkId, pair),
    {
      refreshInterval: 0,
    },
  )
  return (
    <div className='flex flex-col gap-6'>
      <HoverableChart
        chartData={chartData}
        protocolData={pair}
        valueProperty='tvlUSD'
        title='TVL'
        ChartComponent={LineChart}
      />
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
        <HoverableChart
          chartData={chartData ? chartData.slice(0, chartData.length - 1) : undefined}
          protocolData={pair}
          valueProperty='dayVolume'
          title='Volume (24h)'
          ChartComponent={BarChart}
        />
        <HoverableChart
          chartData={chartData ? chartData.slice(0, chartData.length - 1) : undefined}
          protocolData={pair}
          valueProperty='dayFees'
          title='Fees (24h)'
          ChartComponent={BarChart}
        />
      </div>
    </div>
  )
}
