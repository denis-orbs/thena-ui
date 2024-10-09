import { gql } from 'graphql-request'

export const getTVL = (tokenAddress, isFusion) => gql`
  query DerivedTokenPriceTVL {
    token(id: "${tokenAddress}") {
      totalValueLocked: ${isFusion ? 'totalValueLocked' : 'totalLiquidity'}
    }
  }
`

export const getDerivedPrices = (tokenAddress, blocks, isFusion) =>
  blocks.map(
    block => `
    t${block.timestamp}:token(id:"${tokenAddress}", block: { number: ${block.number}}) {
      derivedUSD: ${isFusion ? 'derivedBnb' : 'derivedETH'}
      }
    `,
  )

export const getDerivedPricesQueryConstructor = subqueries => gql`
  query derivedTokenPriceData {
    ${subqueries}
  }
`

export const getSimpleChartDataCodexQuery = (
  tokenAddress,
  networkId,
  interval,
  startTimestampUnix,
  endTimestampUnix,
) => {
  const symbol = `${tokenAddress}:${networkId}`

  return gql`
    query {
      getBars(
        symbol: "${symbol}"
        from: ${startTimestampUnix}
        to: ${endTimestampUnix}
        resolution: "${interval}"
      ) {
        o,
        t
      }
    }
  `
}

export const getAdvanceChartDataCodexQuery = (
  tokenAddress,
  networkId,
  interval,
  startTimestampUnix,
  endTimestampUnix,
) => {
  const symbol = `${tokenAddress}:${networkId}`

  return gql`
    query {
      getBars(
        symbol: "${symbol}"
        from: ${startTimestampUnix}
        to: ${endTimestampUnix}
        resolution: "${interval}"
        removeEmptyBars:true
      ) {
        o
        h
        l
        c
        t
        v
      }
    }
  `
}
