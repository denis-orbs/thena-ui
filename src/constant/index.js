import { CHAIN_ID } from './contracts'

export const CHAIN_LIST = {
  [CHAIN_ID.BSC]: {
    chainId: CHAIN_ID.BSC,
    title: 'BNB Chain',
    img: '/images/header/bnb.svg',
    scanUrl: 'https://bscscan.com',
    scanName: 'View on BscScan',
  },
  [CHAIN_ID.OPBNB]: {
    chainId: CHAIN_ID.OPBNB,
    title: 'opBNB',
    img: '/images/header/opbnb.svg',
    scanUrl: 'https://opbnb.bscscan.com/',
    scanName: 'View on opBNBScan',
  },
  97: {
    chainId: 97,
    title: 'Testnet BNB',
    img: '/images/header/opbnb.svg',
    scanUrl: 'https://testnet.bscscan.com/',
    scanName: 'View on testnet',
  },
}

export const CHAINLINK_ADDRESS = '0xf8a0bf9cf54bb92f17374d9e9a321e6a111a51bd'

// export const RPC_PROVIDERS = {
//   // [ChainId.BSC]: ['https://rpc.ankr.com/bsc/c524849c12e5d6a1f7c0a4def3ae2b387b9f9a7902adc16822bc6825aff6d5b6'],
//   [ChainId.BSC]: ['https://bsc-rpc.publicnode.com'],
//   [ChainId.OPBNB]: ['https://opbnb-mainnet-rpc.bnbchain.org'],
// }

export const LOCALES = {
  en: 'en',
  zh_CN: 'zh-CN', // Mandarin (Simplified)
  zh_TW: 'zh-TW', // Mandarin (Traditional)
  vi: 'vi', // Vietnamese
  pt: 'pt', // Portuguese
  th: 'th', // Thai
  ja: 'ja', // Japanese
  ko: 'ko', // Korean
  es: 'es', // Spanish
}

export const SCAN_URLS = {
  [CHAIN_ID.BSC]: 'https://bscscan.com',
  [CHAIN_ID.OPBNB]: 'https://opbnb.bscscan.com',
  97: 'https://testnet.bscscan.com',
}

export const SOCIAL_LINKS = {
  X: {
    icon: '/images/footer/x.svg',
    iconColored: '/images/footer/xcolored.svg',
    url: 'https://x.com/ThenaFi',
  },
  Medium: {
    icon: '/images/footer/vector.svg',
    iconColored: '/images/footer/vectorcolored.svg',
    url: 'https://medium.com/@ThenaFi',
  },
  Discord: {
    icon: '/images/footer/discord.svg',
    iconColored: '/images/footer/discordcolored.svg',
    url: 'https://discord.gg/thena',
  },
  Telegram: {
    icon: '/images/footer/telegram.svg',
    iconColored: '/images/footer/telegramcolored.svg',
    url: 'https://t.me/Thena_Fi',
  },
  Coingecko: {
    icon: '/images/footer/dinasour.svg',
    iconColored: '/images/footer/dinasourcolored.svg',
    url: 'https://www.coingecko.com/en/coins/thena',
  },
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

export const SupportedChainIds = [CHAIN_ID.BSC, CHAIN_ID.OPBNB]

export const LOGO_PATH = 'https://cdn.thena.fi/logos'
export const THE_LOGO = `${LOGO_PATH}/THE.png`
export const BNB_LOGO = `${LOGO_PATH}/WBNB.png`
export const BSC_LOGO = `${LOGO_PATH}/BSC.png`
export const LINK_LOGO = `${LOGO_PATH}/LINK.png`
export const UNKNOWN_LOGO = `${LOGO_PATH}/UNKNOWN.png`

export const ONE_DAY_UNIX = 86400

export const V1_MULTI_CHAIN_START_TIME = {
  [CHAIN_ID.BSC]: 1672790400,
  [CHAIN_ID.OPBNB]: 1701993600,
}

export const FUSION_MULTI_CHAIN_START_TIME = {
  [CHAIN_ID.BSC]: 1681862400,
  [CHAIN_ID.OPBNB]: 1702339200,
}

export const WEIGHTED_MULTI_CHAIN_START_TIME = {
  [CHAIN_ID.BSC]: 1681862400,
  [CHAIN_ID.OPBNB]: 1702339200,
  [CHAIN_ID.TEST_BSC]: 1681862400,
}

export const STABLE_TOKENS = {
  [CHAIN_ID.BSC]: {
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
  [CHAIN_ID.OPBNB]: {
    USDT: '0x9e5aac1ba1a2e6aed6b32689dfcf62a509ca96f3',
  },
}

export const DoubleRewarders = {
  [CHAIN_ID.BSC]: [
    // {
    //   pairAddress: '0x3765476bffe43cf4c0656bf3a7529c54ae247056',
    //   doubleRewarderAddress: '0x28BB19EAFB1f637ECC754f458f9d415b00287AF7',
    //   doubleRewarderSymbol: 'liveTHE',
    // },
  ],
  [CHAIN_ID.OPBNB]: [],
  97: [],
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
  LSD: 'Conc Liquidity',
  STABLE: 'Stable',
  CLASSIC: 'Classic',
  WEIGHTED: 'Weighted',
}

export const POSITION_EARNED_TYPES = {
  EARN_THE: 'Earn $THE',
  EARN_FEE: 'Earn Fees',
  STAKED: 'Staked',
  NOT_STAKED: 'Not Staked',
}

export const AUTOMATION_STATUS = {
  PENDING: 'Pending',
  ACTIVE: 'Active',
  PAUSED: 'Paused',
  CANCELED: 'Canceled',
  NO: 'No',
}

export const ACTION_AUTOMATION_TYPE = {
  DETAIL: 'detail',
  EDIT_SETTINGS: 'editSettings',
  EDIT_EXECUTION_TIME: 'editExecutionTime',
  EDIT_GAS_LIMIT: 'editGasLimit',
  EDIT_MAX_GAS_PRICE: 'editMaxGasPrice',
  WITHDRAW_FUNDS: 'withdrawFunds',
  PAUSE: 'pause',
  CANCEL: 'cancel',
  UNPAUSE: 'unpause',
  CREATE: 'create',
  REGISTER_AUTOMATION: 'registerAutomation',
  DEPOSIT_FUNDS: 'depositFunds',
}

export const SELECT_TOKEN_STYLE = {
  LARGE: 'large',
  BADGE: 'bage',
}

export const CHAINLINK_TOKEN = {
  [CHAIN_ID.BSC]: [
    {
      address: '0xf8a0bf9cf54bb92f17374d9e9a321e6a111a51bd',
      name: 'Chainlink Token ERC20',
      symbol: 'LINK',
      decimals: 18,
    },
    {
      address: '0x404460c6a5ede2d891e8297795264fde62adbb75',
      name: 'Chainlink Token ERC677',
      symbol: 'LINK',
      decimals: 18,
    },
  ],
  [CHAIN_ID.TEST_BSC]: [
    {
      address: '0x84b9b910527ad5c03a9ca831909e21e236ea7b06',
      name: 'Chainlink Token ERC20',
      symbol: 'LINK',
      decimals: 18,
    },
  ],
}

export const FusionRangeType = {
  ICHI_RANGE: 'ichi',
  GAMMA_RANGE: 'gamma',
  DEFIEDGE_RANGE: 'defiedge',
  MANUAL_RANGE: 'manual',
}

export const GAMMA_TYPES = [
  'Narrow',
  'Wide',
  'Correlated',
  'CL_Stable',
  'Narrow_Farming',
  'Narrow_SwapFee',
  'Wide_Farming',
  'Wide_SwapFee',
  'Correlated_SwapFee',
  'Correlated_Farming',
  'CL_Stable_Farming',
]
export const MANUAL_TYPES = ['CL_Farming', 'CL_SwapFee']
export const ICHI_TYPES = ['ICHI_Farming', 'ICHI_SwapFee', 'ICHI', 'ICHI_Single_Sided']
export const NARROW_TYPES = ['Narrow_Farming', 'Narrow_SwapFee']
export const ICHI_SwapFee = 'ICHI_SwapFee'
export const ICHI_SINGLE_SIDED = 'ICHI_Single_Sided'

export const TAX_ASSETS = {
  [CHAIN_ID.BSC]: [
    '0x74ccbe53f77b08632ce0cb91d3a545bf6b8e0979', // fBOMB
    '0xc95cd75dcea473a30c8470b232b36ee72ae5dcc2', // CHAM
    '0x3a806a3315e35b3f5f46111adb6e2baf4b14a70d', // LIBERA
    '0x9a7b04fd5788ea39819723e7eb9ef5f609bc57ab', // cpTHE
    '0x5dbcb073bedb36a411b5dd9b23b47ccbb5f7238f', // cpTHENA
    '0xa7266989b0df675cc8257d53b6bc1358faf6626a', // IPAD
    '0xa1a020d3b354d6460ee3c272976f213160bd6b1c', // FS
  ],
  [CHAIN_ID.OPBNB]: [],
}

export const SPECIAL_POOLS = [
  '0x755a52d29b24d6871899a84f476339183e9dc95d',
  '0xa07bbf09b48e8d219774ac9b92622f5260a9c9f4',
  // '0x04d6115703b0127888323f142b8046c7c13f857d',
  '0x5b0baf66718caabda49a4af32eb455c3b99b5821',
  '0xbf121d987f9635ed6d2f7bb957fbbe163bdea0e0',
  '0xf8a4cdf9efc4b9b38eaa6e27ee281cb2111fa664',
]

export const STABLE_PAIRS = [
  '0x7491c04dc4575e086a8ee31f7ce1c6d56fb7dcc1', // USDT/USDC
  '0x368416031518556f9dc0996c4b8abb36c8b4c35e', // BNB/BNBx
]

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

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

export const SWAP_TYPES = {
  SWAP: '1',
  TWAP: '2',
  LIMIT: '3',
  STOP_LOSS: '4',
  TAKE_PROFIT: '5',
}

export const ThenaAuthToken = 'thena-token'
export const NotShowDiscoverArenaModal = 'not-show-discover-arena-modal'
export const ThenaLiquidityHubEnabledKey = 'thena-liquidity-hub-enabled'

export const HASH = {
  TRANSFER: '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
}

export const THENACOLORS = ['#F199EE', '#EA66E5', '#E333DD', '#DC00D4', '#B000AA', '#84007F', '#580055', '#32002F']

export const VE_AUTOMATION_HISTORY_TYPES = Object.freeze({
  DEPOSIT_FUNDS: 'Deposit Funds',
  CANCEL_UPKEEP: 'Cancel Upkeep',
  SET_GAS_LIMIT: 'Set Gas Limit',
  SET_EXECUTION_TIME: 'Set Execution Time',
  RELOCK: 'Relock',
  CLAIM: 'Claim Rebase',
  VOTE: 'Vote',
  RELOCK_CLAIM: 'Relock & Claim Rebase',
  VOTE_RELOCK: 'Vote & Relock',
  VOTE_CLAIM: 'Vote & Claim Rebase',
  VOTE_CLAIM_RELOCK: 'Vote & Claim Rebase & Relock',
  PERFORM_UPKEEP: 'Perform Upkeep',
  SET_OPERATION: 'Set Operation',
})

export const V1_POOL_TYPES = Object.freeze({
  STABLE: 'Stable',
  VOLATILE: 'Volatile',
  CLASSIC: 'Classic',
})
