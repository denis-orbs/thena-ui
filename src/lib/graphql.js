import { GraphQLClient } from 'graphql-request'
import { ChainId } from 'thena-sdk-core/dist'

export const v1GraphUrl = {
  // eslint-disable-next-line max-len
  [ChainId.BSC]: `https://gateway.thegraph.com/api/${process.env.NEXT_PRIVATE_V1_API_KEY}/subgraphs/id/FKEt2N5VmSdEYcz7fYLPvvnyEUkReQ7rvmXzs6tiKCz1`,
  [ChainId.OPBNB]:
    'https://open-platform-ap.nodereal.io/05d844a21964497bbbcaae823c36871b/opbnb-mainnet-graph-query/subgraphs/name/thena/exchange-v1',
}

export const fusionGraphUrl = {
  // eslint-disable-next-line max-len
  [ChainId.BSC]: `https://gateway-arbitrum.network.thegraph.com/api/${process.env.NEXT_PRIVATE_FUSION_API_KEY}/deployments/id/QmXJF8ptng63aan78aoARrgAv6XEHPVVWKqNzg7im19NaM`,
  [ChainId.OPBNB]:
    'https://open-platform-ap.nodereal.io/05d844a21964497bbbcaae823c36871b/opbnb-mainnet-graph-query/subgraphs/name/thena/exchange-fusion',
}

export const blockGraphUrl = {
  // eslint-disable-next-line max-len
  [ChainId.BSC]: `https://gateway-arbitrum.network.thegraph.com/api/${process.env.NEXT_PRIVATE_BLOCKS_API_KEY}/deployments/id/9SVVDE76Z3sN4qprVruoHUB5sxxzpaLshppV5WvUjdz`,
  [ChainId.OPBNB]:
    'https://open-platform-ap.nodereal.io/05d844a21964497bbbcaae823c36871b/opbnb-mainnet-graph-query/subgraphs/name/thena/opbnb-blocks',
}

// export const v4GraphUrl = 'https://stg-thena-squid.zinza.com.vn/graphql'
// export const v4GraphWsUrl = 'wss://stg-thena-squid.zinza.com.vn/graphql'

export const v4GraphUrl = 'https://squid.subsquid.io/thena-squid/v/v4/graphql'
export const v4GraphWsUrl = 'wss://squid.subsquid.io/thena-squid/v/v4/graphql'

export const v4SubGraphT2EUrl = 'https://api.studio.thegraph.com/query/70764/thena-subgraph/version/latest'

export const v1Client = {
  [ChainId.BSC]: new GraphQLClient(v1GraphUrl[ChainId.BSC]),
  [ChainId.OPBNB]: new GraphQLClient(v1GraphUrl[ChainId.OPBNB]),
}

export const fusionClient = {
  [ChainId.BSC]: new GraphQLClient(fusionGraphUrl[ChainId.BSC]),
  [ChainId.OPBNB]: new GraphQLClient(fusionGraphUrl[ChainId.OPBNB]),
}

export const blockClient = {
  [ChainId.BSC]: new GraphQLClient(blockGraphUrl[ChainId.BSC]),
  [ChainId.OPBNB]: new GraphQLClient(blockGraphUrl[ChainId.OPBNB]),
}

export const v4Client = new GraphQLClient(v4GraphUrl)
export const v4ClientSubGraphT2E = new GraphQLClient(v4SubGraphT2EUrl)
