import { gql, GraphQLClient } from 'graphql-request'
import orderBy from 'lodash/orderBy'

import { blockGraphUrl, fusionClient, fusionFarmingClient } from '../graphql'

const requestWithTimeout = (graphQLClient, request, variables, timeout = 30000) =>
  Promise.race([
    variables ? graphQLClient.request(request, variables) : graphQLClient.request(request),
    new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Request timed out after ${timeout} milliseconds`))
      }, timeout)
    }),
  ])

/**
 * Helper function to get large amount GraphQL subqueries
 * @param queryConstructor constructor function that combines subqueries
 * @param subqueries individual queries
 * @param endpoint GraphQL endpoint
 * @param skipCount how many subqueries to fire at a time
 * @returns
 */
export const multiQuery = async (queryConstructor, subqueries, endpoint, skipCount = 1000) => {
  let fetchedData = {}
  let allFound = false
  let skip = 0
  const client = typeof endpoint === 'string' ? new GraphQLClient(endpoint) : endpoint
  try {
    while (!allFound) {
      let end = subqueries.length
      if (skip + skipCount < subqueries.length) {
        end = skip + skipCount
      }
      const subqueriesSlice = subqueries.slice(skip, end)
      // eslint-disable-next-line no-await-in-loop
      const result = await requestWithTimeout(client, queryConstructor(subqueriesSlice))
      fetchedData = {
        ...fetchedData,
        ...result,
      }
      allFound = Object.keys(result).length < skipCount || skip + skipCount > subqueries.length
      skip += skipCount
    }
    return fetchedData
  } catch (error) {
    console.error('Failed to fetch info data', error)
    return null
  }
}

const getBlockSubqueries = timestamps =>
  timestamps.map(
    timestamp =>
      `t${timestamp}:blocks(
        first: 1, orderBy: timestamp, orderDirection: desc, where: { timestamp_gt: ${timestamp}, timestamp_lt: ${
          timestamp + 600
        }})
      {
        number
      }
    `,
  )

const blocksQueryConstructor = subqueries =>
  gql`query blocks {
    ${subqueries}
  }`

/**
 * @notice Fetches block objects for an array of timestamps.
 * @param {Array} timestamps
 */
export const getBlocksFromTimestamps = async (timestamps, sortDirection, skipCount, chainId) => {
  if (timestamps?.length === 0) {
    return []
  }

  const fetchedData = await multiQuery(
    blocksQueryConstructor,
    getBlockSubqueries(timestamps),
    blockGraphUrl[chainId],
    skipCount,
  )

  const blocks = []
  if (fetchedData) {
    // eslint-disable-next-line no-restricted-syntax
    for (const key of Object.keys(fetchedData)) {
      if (fetchedData[key].length > 0) {
        blocks.push({
          timestamp: key.split('t')[1],
          number: parseInt(fetchedData[key][0].number, 10),
        })
      }
    }
    // graphql-request does not guarantee same ordering of batched requests subqueries, hence manual sorting
    return orderBy(blocks, block => block.number, sortDirection)
  }
  return blocks
}

const FARMING_LIST_QUERY = gql`
  query ($poolIds: [String!]) {
    eternalFarmings(
      first: 1000
      where: { pool_in: $poolIds, isDeactivated: false }
      orderBy: nonce
      orderDirection: desc
    ) {
      id
      virtualPool
      pool
      rewardToken
      bonusRewardToken
      rewardRate
      bonusRewardRate
    }
  }
`

export const getFusionFarmingData = async ({ chainId, poolIds }) => {
  if (!poolIds?.length) return []

  try {
    const { eternalFarmings = [] } = await fusionFarmingClient[chainId].request(FARMING_LIST_QUERY, {
      poolIds,
    })

    const uniquePools = new Map()

    for (const item of eternalFarmings) {
      if (!uniquePools.has(item.pool)) {
        uniquePools.set(item.pool, item)
      }
    }

    return Array.from(uniquePools.values())
  } catch (error) {
    console.error('Fusion farming list data error:', error)
    return []
  }
}

const FEES_DATA_QUERY = gql`
  query pools($poolIds: [String!], $date: Int!) {
    poolDayDatas(first: 1000, where: { pool_in: $poolIds, date_gt: $date }, orderBy: date) {
      feesUSD
      pool {
        id
      }
    }
  }
`

export const getFusionFeesData = async ({ chainId, poolIds, date }) => {
  try {
    const { poolDayDatas = [] } = await fusionClient[3][chainId].request(FEES_DATA_QUERY, {
      poolIds,
      date,
    })

    // Group by pool
    const result = poolDayDatas.reduce((acc, item) => {
      const poolId = item.pool.id
      const feesUSD = parseFloat(item.feesUSD)

      if (!acc[poolId]) {
        acc[poolId] = { sumDayFees: 0, length: 0 }
      }

      acc[poolId].sumDayFees += feesUSD
      acc[poolId].length += 1

      return acc
    }, {})

    // Calculate averages in a single pass
    return Object.entries(result).reduce((acc, [poolId, data]) => {
      const avgPoolDayFees = data.sumDayFees / data.length
      acc[poolId] = {
        avgPoolDayFees,
        annualPoolFees: avgPoolDayFees * 365,
      }
      return acc
    }, {})
  } catch (error) {
    console.error(`[${chainId}] fusion fees data fetch error:`, error)
    return {}
  }
}
