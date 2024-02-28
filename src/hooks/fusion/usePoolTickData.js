import { gql } from 'graphql-request'
import { useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'
import { Pool, TICK_SPACING, tickToPrice } from 'thena-fusion-sdk'
import { FUSION_FACTORY_ADDRESSES, JSBI } from 'thena-sdk-core'

import computeSurroundingTicks from '@/lib/fusion/computeSurroundingTicks'
import { fusionClient } from '@/lib/graphql'
import { useChainSettings } from '@/state/settings/hooks'

import { PoolState, useFusion } from './useFusions'

const PRICE_FIXED_DIGITS = 8

const getActiveTick = (tickCurrent, feeAmount) =>
  tickCurrent && feeAmount ? Math.floor(tickCurrent / TICK_SPACING) * TICK_SPACING : undefined

const ALL_TICKS = gql`
  query allV3Ticks($poolAddress: String!, $skip: Int!) {
    ticks(first: 1000, skip: $skip, where: { poolAddress: $poolAddress }, orderBy: tickIdx) {
      tickIdx
      liquidityNet
      price0
      price1
    }
  }
`

const fetchTicksData = async (chainId, address, skip = 0) => {
  try {
    const { ticks } = await fusionClient[chainId].request(ALL_TICKS, {
      poolAddress: address,
      skip,
    })
    return { ticks, error: false }
  } catch (error) {
    console.error('Failed to fetch fusion ticks data', error)
    return { error: true }
  }
}

function useTicksFromSubgraph(currencyA, currencyB, feeAmount, skip = 0) {
  const { networkId } = useChainSettings()
  const poolAddress =
    currencyA && currencyB && feeAmount
      ? Pool.getAddress(
          currencyA?.wrapped,
          currencyB?.wrapped,
          feeAmount,
          undefined,
          networkId ? FUSION_FACTORY_ADDRESSES[networkId] : undefined,
        )
      : undefined
  return useSWR(poolAddress && ['fusion/ticks', poolAddress], () =>
    fetchTicksData(networkId, poolAddress?.toLowerCase(), skip),
  )
}

const MAX_THE_GRAPH_TICK_FETCH_VALUE = 1000
// Fetches all ticks for a given pool
function useAllV3Ticks(currencyA, currencyB, feeAmount) {
  const [skipNumber, setSkipNumber] = useState(0)
  const [subgraphTickData, setSubgraphTickData] = useState([])
  const { data, error, isLoading } = useTicksFromSubgraph(currencyA, currencyB, feeAmount, skipNumber)

  useEffect(() => {
    if (data?.ticks.length) {
      setSubgraphTickData(tickData => [...tickData, ...data.ticks])
      if (data.ticks.length === MAX_THE_GRAPH_TICK_FETCH_VALUE) {
        setSkipNumber(val => val + MAX_THE_GRAPH_TICK_FETCH_VALUE)
      }
    }
  }, [data?.ticks, setSubgraphTickData])

  return {
    isLoading: isLoading || data?.ticks?.length === MAX_THE_GRAPH_TICK_FETCH_VALUE,
    error,
    ticks: subgraphTickData,
  }
}

export function usePoolActiveLiquidity(currencyA, currencyB, feeAmount) {
  const pool = useFusion(currencyA, currencyB, feeAmount)

  // Find nearest valid tick for pool in case tick is not initialized.
  const activeTick = useMemo(() => getActiveTick(pool[1]?.tickCurrent, feeAmount), [pool, feeAmount])

  const { isLoading, error, ticks } = useAllV3Ticks(currencyA, currencyB, feeAmount)

  return useMemo(() => {
    if (
      !currencyA ||
      !currencyB ||
      activeTick === undefined ||
      pool[0] !== PoolState.EXISTS ||
      !ticks ||
      ticks.length === 0 ||
      isLoading
    ) {
      return {
        isLoading: isLoading || pool[0] === PoolState.LOADING,
        error,
        activeTick,
        data: undefined,
      }
    }

    const token0 = currencyA?.wrapped
    const token1 = currencyB?.wrapped

    // find where the active tick would be to partition the array
    // if the active tick is initialized, the pivot will be an element
    // if not, take the previous tick as pivot
    const pivot = ticks.findIndex(({ tickIdx }) => tickIdx > activeTick) - 1

    if (pivot < 0) {
      // consider setting a local error
      console.error('TickData pivot not found')
      return {
        isLoading,
        error,
        activeTick,
        data: undefined,
      }
    }

    const activeTickProcessed = {
      liquidityActive: JSBI.BigInt(pool[1]?.liquidity ?? 0),
      tickIdx: activeTick,
      liquidityNet:
        Number(ticks[pivot].tickIdx) === activeTick ? JSBI.BigInt(ticks[pivot].liquidityNet) : JSBI.BigInt(0),
      price0: tickToPrice(token0, token1, activeTick).toFixed(PRICE_FIXED_DIGITS),
    }

    const subsequentTicks = computeSurroundingTicks(token0, token1, activeTickProcessed, ticks, pivot, true)

    const previousTicks = computeSurroundingTicks(token0, token1, activeTickProcessed, ticks, pivot, false)

    const ticksProcessed = previousTicks.concat(activeTickProcessed).concat(subsequentTicks)

    return {
      isLoading,
      error,
      activeTick,
      data: ticksProcessed,
    }
  }, [currencyA, currencyB, activeTick, pool, ticks, isLoading, error])
}
