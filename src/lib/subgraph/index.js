import { gql, GraphQLClient } from 'graphql-request'
import orderBy from 'lodash/orderBy'

import { blockGraphUrl } from '../graphql'

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
