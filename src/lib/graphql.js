/* eslint-disable max-len */
import { GraphQLClient } from 'graphql-request'
import { ChainId } from 'thena-sdk-core/dist'

import { CHAIN_ID } from '@/constant/contracts'

export const v1GraphUrl = {
  // eslint-disable-next-line max-len
  [ChainId.BSC]: `https://gateway.thegraph.com/api/${process.env.NEXT_PUBLIC_V1_API_KEY}/subgraphs/id/FKEt2N5VmSdEYcz7fYLPvvnyEUkReQ7rvmXzs6tiKCz1`,
  [ChainId.OPBNB]: `https://open-platform-ap.nodereal.io/${process.env.NEXT_PUBLIC_NODEREAL_API_KEY}/opbnb-mainnet-graph-query/subgraphs/name/thena/exchange-v1`,
}

export const fusionGraphUrl = {
  // eslint-disable-next-line max-len
  [CHAIN_ID.BSC]: `https://gateway.thegraph.com/api/${process.env.NEXT_PUBLIC_FUSION_API_KEY}/subgraphs/id/Hnjf3ipVMCkQze3jmHp8tpSMgPmtPnXBR38iM4ix1cLt`,
  [CHAIN_ID.OPBNB]: `https://open-platform-ap.nodereal.io/${process.env.NEXT_PUBLIC_NODEREAL_API_KEY}/opbnb-mainnet-graph-query/subgraphs/name/thena/exchange-fusion`,
  [CHAIN_ID.TEST_BSC]: 'https://api.studio.thegraph.com/query/70764/thena-v3-fusions/version/latest',
}

export const blockGraphUrl = {
  // eslint-disable-next-line max-len
  [ChainId.BSC]: `https://gateway.thegraph.com/api/${process.env.NEXT_PUBLIC_BLOCKS_API_KEY}/subgraphs/id/9SVVDE76Z3sN4qprVruoHUB5sxxzpaLshppV5WvUjdz`,
  [ChainId.OPBNB]: `https://open-platform-ap.nodereal.io/${process.env.NEXT_PUBLIC_NODEREAL_API_KEY}/opbnb-mainnet-graph-query/subgraphs/name/thena/opbnb-blocks`,
}

// export const v4GraphUrl = 'https://stg-thena-squid.zinza.com.vn/graphql'
// export const v4GraphWsUrl = 'wss://stg-thena-squid.zinza.com.vn/graphql'

export const v4GraphUrl = 'https://squid.subsquid.io/thena-squid/v/v4/graphql'
export const v4GraphWsUrl = 'wss://squid.subsquid.io/thena-squid/v/v4/graphql'

export const v4SubGraphT2EUrl = 'https://api.studio.thegraph.com/query/70764/thena-subgraph/version/latest'
export const codexGraphUrl = 'https://graph.codex.io/graphql'
export const v3SubGraphUrl = 'https://api.studio.thegraph.com/query/70764/thena-v3-voters/version/latest'

export const v1Client = {
  [ChainId.BSC]: new GraphQLClient(v1GraphUrl[ChainId.BSC]),
  [ChainId.OPBNB]: new GraphQLClient(v1GraphUrl[ChainId.OPBNB]),
}

export const fusionClient = {
  [CHAIN_ID.BSC]: new GraphQLClient(fusionGraphUrl[CHAIN_ID.BSC]),
  [CHAIN_ID.OPBNB]: new GraphQLClient(fusionGraphUrl[CHAIN_ID.OPBNB]),
  [CHAIN_ID.TEST_BSC]: new GraphQLClient(fusionGraphUrl[CHAIN_ID.TEST_BSC]),
}

export const blockClient = {
  [ChainId.BSC]: new GraphQLClient(blockGraphUrl[ChainId.BSC]),
  [ChainId.OPBNB]: new GraphQLClient(blockGraphUrl[ChainId.OPBNB]),
}

export const v4Client = new GraphQLClient(v4GraphUrl)
export const v4ClientSubGraphT2E = new GraphQLClient(v4SubGraphT2EUrl)
export const codexClient = new GraphQLClient(codexGraphUrl)
export const v3ClientSubGraph = new GraphQLClient(v3SubGraphUrl)

export const v3PoolGraphURL = 'https://api.studio.thegraph.com/query/49739/thena-v3/version/latest'
// export const v3PoolGraphURL = 'https://testnet-thena-backend.zinza.com.vn/api/v1/topPairsV3/97'
export const v3PoolGraphClient = new GraphQLClient(v3PoolGraphURL)
