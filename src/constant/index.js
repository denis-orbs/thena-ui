import { ChainId, WBNB } from 'thena-sdk-core'

export const CHAIN_LIST = {
  [ChainId.BSC]: {
    chainId: ChainId.BSC,
    title: 'BNB Chain',
    img: '/images/header/bnb.svg',
    scanUrl: 'https://bscscan.com',
    scanName: 'View on BscScan',
  },
  [ChainId.OPBNB]: {
    chainId: ChainId.OPBNB,
    title: 'opBNB',
    img: '/images/header/opbnb.svg',
    scanUrl: 'https://opbnb.bscscan.com/',
    scanName: 'View on opBNBScan',
  },
}

export const RPC_PROVIDERS = {
  [ChainId.BSC]: ['https://bsc-dataseed.binance.org/', 'https://bsc.publicnode.com/', 'https://bscrpc.com/'],
  [ChainId.OPBNB]: ['https://opbnb-mainnet-rpc.bnbchain.org'],
}

export const SCAN_URLS = {
  [ChainId.BSC]: 'https://bscscan.com/',
  [ChainId.OPBNB]: 'https://opbnb.bscscan.com/',
}

export const TXN_STATUS = {
  START: 'start',
  WAITING: 'waiting',
  PENDING: 'pending',
  SUCCESS: 'success',
  FAILED: 'failed',
}

export const LOTTERY_STATUS = {
  UNKNOWN: 0,
  WON: 1,
  LOST: 2,
}

export const SupportedChainIds = [ChainId.BSC, ChainId.OPBNB]

export const V1_ROUTE_ASSETS = {
  [ChainId.BSC]: [
    {
      symbol: 'WBNB',
      address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
      logoURI: 'https://cdn.thena.fi/assets/WBNB.png',
    },
    {
      symbol: 'BUSD',
      address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
      logoURI: 'https://cdn.thena.fi/assets/BUSD.png',
    },
    {
      symbol: 'USDC',
      address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
      logoURI: 'https://cdn.thena.fi/assets/USDC.png',
    },
    {
      symbol: 'USDT',
      address: '0x55d398326f99059fF775485246999027B3197955',
      logoURI: 'https://cdn.thena.fi/assets/USDT.png',
    },
    {
      symbol: 'FRAX',
      address: '0x90c97f71e18723b0cf0dfa30ee176ab653e89f40',
      logoURI: 'https://cdn.thena.fi/assets/FRAX.png',
    },
    {
      symbol: 'BNBx',
      address: '0x1bdd3cf7f79cfb8edbb955f20ad99211551ba275',
      logoURI: 'https://cdn.thena.fi/assets/BNBx.png',
    },
    {
      symbol: 'CUSD',
      address: '0xFa4BA88Cf97e282c505BEa095297786c16070129',
      logoURI: 'https://cdn.thena.fi/assets/CUSD.png',
    },
    {
      symbol: 'HAY',
      address: '0x0782b6d8c4551B9760e74c0545a9bCD90bdc41E5',
      logoURI: 'https://cdn.thena.fi/assets/HAY.png',
    },
    {
      symbol: 'USD+',
      address: '0xe80772eaf6e2e18b651f160bc9158b2a5cafca65',
      logoURI: 'https://cdn.thena.fi/assets/USD+.png',
    },
    {
      symbol: 'stkBNB',
      address: '0xc2e9d07f66a89c44062459a47a0d2dc038e4fb16',
      logoURI: 'https://cdn.thena.fi/assets/stkBNB.png',
    },
    {
      symbol: 'ankrBNB',
      address: '0x52F24a5e03aee338Da5fd9Df68D2b6FAe1178827',
      logoURI: 'https://cdn.thena.fi/assets/ankrBNB.png',
    },
    {
      symbol: 'THE',
      address: '0xF4C8E32EaDEC4BFe97E0F595AdD0f4450a863a11',
      logoURI: 'https://thena.fi/logo.png',
    },
  ],
  [ChainId.OPBNB]: [
    {
      symbol: 'WBNB',
      address: WBNB[ChainId.OPBNB].address,
      logoURI: 'https://cdn.thena.fi/assets/WBNB.png',
    },
    {
      symbol: 'USDT',
      address: '0x9e5aac1ba1a2e6aed6b32689dfcf62a509ca96f3',
      logoURI: 'https://cdn.thena.fi/assets/USDT.png',
    },
    {
      symbol: 'ETH',
      address: '0xe7798f023fc62146e8aa1b36da45fb70855a77ea',
      logoURI: 'https://cdn.thena.fi/assets/ETH.png',
    },
    {
      symbol: 'BTCB',
      address: '0x7c6b91d9be155a6db01f749217d76ff02a7227f2',
      logoURI: 'https://cdn.thena.fi/assets/BTCB.png',
    },
  ],
}

export const UNKNOWN_LOGO = 'https://cdn.thena.fi/assets/UKNOWN.png'

export const NEXT_EPOCH_TIMESTAMP = 1696464000

export const ONE_DAY_UNIX = 86400

export const V1_MULTI_CHAIN_START_TIME = {
  [ChainId.BSC]: 1672790400,
  [ChainId.OPBNB]: 1701993600,
}

export const FUSION_MULTI_CHAIN_START_TIME = {
  [ChainId.BSC]: 1681862400,
  [ChainId.OPBNB]: 1702339200,
}

export const NEW_POOLS = {
  [ChainId.BSC]: ['0xdc6f26e5f8a7ea128a8a06ce07681b3cde5280f2', '0x01dd2d28eeb95d740acb5344b1e2c99b61cc3e64'],
  [ChainId.OPBNB]: [],
}

export const STABLE_TOKENS = {
  [ChainId.BSC]: {
    BUSD: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
    USDT: '0x55d398326f99059fF775485246999027B3197955',
    USDC: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
    DAI: '0x1af3f329e8be154074d8769d1ffa4ee058b1dbc3',
    DEI: '0xDE1E704dae0B4051e80DAbB26ab6ad6c12262DA0',
    USD: '0xe80772eaf6e2e18b651f160bc9158b2a5cafca65',
    ETS: '0x5B852898CD47d2Be1d77D30377b3642290f5Ec75',
    HAY: '0x0782b6d8c4551B9760e74c0545a9bCD90bdc41E5',
    FRAX: '0x90c97f71e18723b0cf0dfa30ee176ab653e89f40',
    CUSD: '0xFa4BA88Cf97e282c505BEa095297786c16070129',
    MAI: '0x3F56e0c36d275367b8C502090EDF38289b3dEa0d',
    DOLA: '0x2F29Bc0FFAF9bff337b31CBe6CB5Fb3bf12e5840',
    DUSD: '0x8ec1877698acf262fe8ad8a295ad94d6ea258988',
    CASH: '0x54c331bb7d32fbfc17bc9accab2e2d12d0d1b222',
    USDV: '0x953e94caf91a1e32337d0548b9274f337920edfa',
  },
  [ChainId.OPBNB]: {
    USDT: '0x9e5aac1ba1a2e6aed6b32689dfcf62a509ca96f3',
  },
}

export const DoubleRewarders = {
  [ChainId.BSC]: [
    {
      pairAddress: '0x2b3510f57365aa17bff8e6360ea67c136175dc6d',
      doubleRewarderAddress: '0xA7266B2303725F731851dfE944a432f8A2EA5c9c',
      doubleRewarderSymbol: 'PSTAKE',
    },
    {
      pairAddress: '0x3765476bffe43cf4c0656bf3a7529c54ae247056',
      doubleRewarderAddress: '0x28BB19EAFB1f637ECC754f458f9d415b00287AF7',
      doubleRewarderSymbol: 'liveTHE',
    },
  ],
  [ChainId.OPBNB]: [],
}

export const PERIOD_LEVELS = [
  {
    value: 0,
    label: '2 weeks',
  },
  {
    value: 1,
    label: '6 months',
  },
  {
    value: 2,
    label: '1 year',
  },
  {
    value: 3,
    label: '2 years',
  },
]

export const PAIR_TYPES = {
  All: 'All Pools',
  LSD: 'Conc. Liquidity',
  STABLE: 'Stable',
  CLASSIC: 'Classic',
}

export const FusionRangeType = {
  ICHI_RANGE: 'ichi',
  GAMMA_RANGE: 'gamma',
  DEFIEDGE_RANGE: 'defiedge',
  MANUAL_RANGE: 'manual',
}

export const GAMMA_TYPES = ['Narrow', 'Wide', 'Correlated', 'CL_Stable']

export const TAX_ASSETS = {
  [ChainId.BSC]: [
    '0x74ccbe53f77b08632ce0cb91d3a545bf6b8e0979', // fBOMB
    '0xc95cd75dcea473a30c8470b232b36ee72ae5dcc2', // CHAM
    '0x3a806a3315e35b3f5f46111adb6e2baf4b14a70d', // LIBERA
    '0x9a7b04fd5788ea39819723e7eb9ef5f609bc57ab', // cpTHE
    '0x5dbcb073bedb36a411b5dd9b23b47ccbb5f7238f', // cpTHENA
    '0xa7266989b0df675cc8257d53b6bc1358faf6626a', // IPAD
  ],
  [ChainId.OPBNB]: [],
}

export const STABLE_FEE = 0.0001
export const VOLATILE_FEE = 0.002
export const TVL_INCREASE = 1e6

export const TXN_TYPE = {
  ALL: 'All',
  SWAP: 'Swaps',
  ADD: 'Adds',
  REMOVE: 'Removes',
}

export const ANALYTIC_VERSIONS = {
  v1: 'v1',
  fusion: 'fusion',
  total: 'total',
}

export const ANALYTIC_CHART = {
  ONE_MONTH_CHART: 1,
  THREE_MONTH_CHART: 2,
  SIX_MONTH_CHART: 3,
  ONE_YEAR_CHART: 4,
  ALL_CHART: 5,
  CHART_COUNT: 60, // limit analytics chart items not more than 60
}
