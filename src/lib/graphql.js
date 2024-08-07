import { GraphQLClient } from 'graphql-request'
import { ChainId } from 'thena-sdk-core/dist'

export const v1GraphUrl = {
  [ChainId.BSC]: 'https://api.studio.thegraph.com/query/53404/thena-bsc-v1/version/latest',
  [ChainId.OPBNB]:
    'https://open-platform-ap.nodereal.io/05d844a21964497bbbcaae823c36871b/opbnb-mainnet-graph-query/subgraphs/name/thena/exchange-v1',
}

export const fusionGraphUrl = {
  // eslint-disable-next-line max-len
  [ChainId.BSC]: `https://gateway-arbitrum.network.thegraph.com/api/${process.env.NEXT_PUBLIC_FUSION_API_KEY}/subgraphs/id/Hnjf3ipVMCkQze3jmHp8tpSMgPmtPnXBR38iM4ix1cLt`,
  // eslint-disable-next-line max-len
  // [ChainId.BSC]: `https://gateway-arbitrum.network.thegraph.com/api/${process.env.NEXT_PUBLIC_FUSION_API_KEY}/deployments/id/QmXJF8ptng63aan78aoARrgAv6XEHPVVWKqNzg7im19NaM`,
  // [ChainId.BSC]: 'https://api.studio.thegraph.com/query/53404/thena-bsc-fusion/version/latest',
  [ChainId.OPBNB]:
    'https://open-platform-ap.nodereal.io/05d844a21964497bbbcaae823c36871b/opbnb-mainnet-graph-query/subgraphs/name/thena/exchange-fusion',
}

export const blockGraphUrl = {
  [ChainId.BSC]: 'https://api.studio.thegraph.com/query/53404/thena-bsc-blocks/version/latest',
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
