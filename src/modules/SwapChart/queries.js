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
        symbolType: TOKEN
      ) {
        o,
        t
      }
    }
  `
}

export const getCurrentPriceUSDCodexQuery = (token, networkId) => gql`
  query {
    getTokenPrices(
      inputs: [
        { address: "${token}", networkId: ${networkId} }
      ]
    ) {
      address
      priceUsd
      timestamp
    }
  }
`
export const getCurrentPriceCodexQuery = (tokenA, tokenB, networkId) => gql`
  query {
    getTokenPrices(
      inputs: [
        { address: "${tokenA}", networkId: ${networkId} }
        { address: "${tokenB}", networkId: ${networkId} }
      ]
    ) {
      address
      priceUsd
      timestamp
    }
  }
`
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
        removeEmptyBars: true
        symbolType: TOKEN
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
