import { GraphQLClient } from 'graphql-request'
import { ChainId } from 'thena-sdk-core/dist'

export const v1GraphUrl = {
  [ChainId.BSC]: 'https://api.thegraph.com/subgraphs/name/thenaursa/thena-v1',
  [ChainId.OPBNB]:
    'https://open-platform-ap.nodereal.io/05d844a21964497bbbcaae823c36871b/opbnb-mainnet-graph-query/subgraphs/name/thena/exchange-v1',
}

export const fusionGraphUrl = {
  [ChainId.BSC]: 'https://api.thegraph.com/subgraphs/name/thenaursa/thena-fusion',
  [ChainId.OPBNB]:
    'https://open-platform-ap.nodereal.io/05d844a21964497bbbcaae823c36871b/opbnb-mainnet-graph-query/subgraphs/name/thena/exchange-fusion',
}

export const blockGraphUrl = {
  [ChainId.BSC]: 'https://api.thegraph.com/subgraphs/name/iliaazhel/bsc-blocks',
  [ChainId.OPBNB]:
    'https://open-platform-ap.nodereal.io/05d844a21964497bbbcaae823c36871b/opbnb-mainnet-graph-query/subgraphs/name/thena/opbnb-blocks',
}

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
