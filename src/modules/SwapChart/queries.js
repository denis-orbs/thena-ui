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
