/* eslint-disable max-len */
import { GraphQLClient } from 'graphql-request'
import { ChainId } from 'thena-sdk-core/dist'

import { CHAIN_ID } from '@/constant/contracts'

export const SolidlyGraphUrl = {
  // eslint-disable-next-line max-len
  [ChainId.BSC]: `https://gateway.thegraph.com/api/${process.env.NEXT_PUBLIC_V1_API_KEY}/subgraphs/id/FKEt2N5VmSdEYcz7fYLPvvnyEUkReQ7rvmXzs6tiKCz1`,
  [ChainId.OPBNB]: `https://open-platform-ap.nodereal.io/${process.env.NEXT_PUBLIC_NODEREAL_API_KEY}/opbnb-mainnet-graph-query/subgraphs/name/thena/exchange-v1`,
  [CHAIN_ID.TEST_BSC]: 'https://api.studio.thegraph.com/query/70764/thena-chapel-v1/version/latest',
}

export const FusionGraphUrl = {
  // eslint-disable-next-line max-len
  [CHAIN_ID.BSC]: `https://gateway.thegraph.com/api/${process.env.NEXT_PUBLIC_FUSION_API_KEY}/subgraphs/id/Hnjf3ipVMCkQze3jmHp8tpSMgPmtPnXBR38iM4ix1cLt`,
  [CHAIN_ID.OPBNB]: `https://open-platform-ap.nodereal.io/${process.env.NEXT_PUBLIC_NODEREAL_API_KEY}/opbnb-mainnet-graph-query/subgraphs/name/thena/exchange-fusion`,
  [CHAIN_ID.TEST_BSC]: 'https://api.studio.thegraph.com/query/70764/thena-chapel-v3-fusion/version/latest',
}

export const BlockGraphUrl = {
  // eslint-disable-next-line max-len
  [ChainId.BSC]: `https://gateway.thegraph.com/api/${process.env.NEXT_PUBLIC_BLOCKS_API_KEY}/subgraphs/id/9SVVDE76Z3sN4qprVruoHUB5sxxzpaLshppV5WvUjdz`,
  [ChainId.OPBNB]: `https://open-platform-ap.nodereal.io/${process.env.NEXT_PUBLIC_NODEREAL_API_KEY}/opbnb-mainnet-graph-query/subgraphs/name/thena/opbnb-blocks`,
}

// export const v4GraphUrl = 'https://stg-thena-squid.zinza.com.vn/graphql'
// export const ArenaGraphWssUrl = 'wss://stg-thena-squid.zinza.com.vn/graphql'

export const ArenaGraphUrl = 'https://squid.subsquid.io/thena-squid/v/v4/graphql'
export const ArenaGraphWssUrl = 'wss://squid.subsquid.io/thena-squid/v/v4/graphql'

export const T2EGraphUrl = 'https://api.studio.thegraph.com/query/70764/thena-subgraph/version/latest'
export const CodexGraphUrl = 'https://graph.codex.io/graphql'

export const VoterSubGrapUrl = {
  [CHAIN_ID.BSC]: `https://gateway.thegraph.com/api/${process.env.NEXT_PUBLIC_V1_API_KEY}/subgraphs/id/3DDdHEiqoSMLyu9BnrahCruKjK3ZHeE96vzCgUyPPDCa`,
  [CHAIN_ID.OPBNB]: '',
  [CHAIN_ID.TEST_BSC]: 'https://api.studio.thegraph.com/query/70764/thena-chapel-v3-voter/version/latest',
}

export const SolidlyClient = {
  [ChainId.BSC]: new GraphQLClient(SolidlyGraphUrl[ChainId.BSC]),
  [ChainId.OPBNB]: new GraphQLClient(SolidlyGraphUrl[ChainId.OPBNB]),
}

export const VetheClient = {
  [ChainId.BSC]: new GraphQLClient(
    `https://gateway.thegraph.com/api/${process.env.NEXT_PUBLIC_FUSION_API_KEY}/subgraphs/id/FG5W3USPsJhkyivLku9D5PU1cEbNFQQVUngUNSoXQSRd`,
  ),
}

export const AlgebraClient = {
  3: {
    [CHAIN_ID.BSC]: new GraphQLClient(
      `https://gateway.thegraph.com/api/${process.env.NEXT_PUBLIC_FUSION_API_KEY}/subgraphs/id/BoHp9H2rGzVFPiqc56PJ1Gw7EPDaiHMcupsUuksMGp2K`,
    ),
    [CHAIN_ID.TEST_BSC]: new GraphQLClient(
      'https://api.studio.thegraph.com/query/70764/thena-chapel-v3-fusion/version/latest',
    ),
  },
  2: {
    [CHAIN_ID.BSC]: new GraphQLClient(FusionGraphUrl[CHAIN_ID.BSC]),
    [CHAIN_ID.OPBNB]: new GraphQLClient(FusionGraphUrl[CHAIN_ID.OPBNB]),
  },
  [CHAIN_ID.BSC]: new GraphQLClient(FusionGraphUrl[CHAIN_ID.BSC]),
  [CHAIN_ID.OPBNB]: new GraphQLClient(FusionGraphUrl[CHAIN_ID.OPBNB]),
  [CHAIN_ID.TEST_BSC]: new GraphQLClient(
    'https://api.studio.thegraph.com/query/70764/thena-chapel-v3-fusion/version/latest',
  ),
}

export const IntegralFarmingClient = {
  56: new GraphQLClient(
    `https://gateway.thegraph.com/api/${process.env.NEXT_PUBLIC_FUSION_API_KEY}/subgraphs/id/eTT8C92PwJiquV8S7oCkAzXToG3XJkkZnm4pBFtrSmc`,
  ),
  97: new GraphQLClient('https://api.studio.thegraph.com/query/70764/thena-chapel-v3-fusion-farming/version/latest'),
}

export const blockClient = {
  [ChainId.BSC]: new GraphQLClient(BlockGraphUrl[ChainId.BSC]),
  [ChainId.OPBNB]: new GraphQLClient(BlockGraphUrl[ChainId.OPBNB]),
}

export const ArenaClient = new GraphQLClient(ArenaGraphUrl)
export const T2EClient = new GraphQLClient(T2EGraphUrl)
export const CodexClient = new GraphQLClient(CodexGraphUrl)
// export const v3ClientSubGraph = new GraphQLClient(v3SubGraphUrl)
export const VoterClient = {
  [CHAIN_ID.BSC]: new GraphQLClient(VoterSubGrapUrl[CHAIN_ID.BSC]),
  [CHAIN_ID.OPBNB]: new GraphQLClient(VoterSubGrapUrl[CHAIN_ID.OPBNB]),
  [CHAIN_ID.TEST_BSC]: new GraphQLClient(VoterSubGrapUrl[CHAIN_ID.TEST_BSC]),
}

export const IntegralGraphURL = 'https://api.studio.thegraph.com/query/49739/thena-v3/version/latest'
// export const v3PoolGraphURL = 'https://testnet-thena-backend.zinza.com.vn/api/v1/topPairsV3/97'
export const IntegralClient = new GraphQLClient(IntegralGraphURL)
