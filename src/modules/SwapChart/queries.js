import { gql } from 'graphql-request'
import { ChainId } from 'thena-sdk-core'

export const getTVL = (tokenAddress, isFusion) => gql`
  query DerivedTokenPriceTVL {
    token(id: "${tokenAddress}") {
      totalValueLocked: ${isFusion ? 'totalValueLocked' : 'totalLiquidity'}
    }
  }
`

export const getDerivedPrices = (tokenAddress, blocks, isFusion, chainId) =>
  blocks.map(
    block => `
    t${block.timestamp}:token(id:"${tokenAddress}", block: { number: ${block.number}}) {
        derivedUSD: ${isFusion ? (chainId === ChainId.BSC ? 'derivedMatic' : 'derivedBnb') : 'derivedETH'}
      }
    `,
  )

export const getDerivedPricesQueryConstructor = subqueries => gql`
  query derivedTokenPriceData {
    ${subqueries}
  }
`
