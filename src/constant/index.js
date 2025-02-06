import dayjs from 'dayjs'
import { WBNB } from 'thena-sdk-core'

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

export const RPC_PROVIDERS = {
  // [CHAIN_ID.BSC]: ['https://rpc.ankr.com/bsc/c524849c12e5d6a1f7c0a4def3ae2b387b9f9a7902adc16822bc6825aff6d5b6'],
  [CHAIN_ID.BSC]: ['https://bsc-rpc.publicnode.com'],
  [CHAIN_ID.OPBNB]: ['https://opbnb-mainnet-rpc.bnbchain.org'],
  97: ['https://bsc-testnet-rpc.publicnode.com'],
}

export const LOCALES = {
  en: 'en',
  zh: 'zh',
}

export const SCAN_URLS = {
  [CHAIN_ID.BSC]: 'https://bscscan.com',
  [CHAIN_ID.OPBNB]: 'https://opbnb.bscscan.com',
  97: 'https://testnet.bscscan.com',
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

export const V1_ROUTE_ASSETS = {
  [CHAIN_ID.BSC]: [
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
  [CHAIN_ID.OPBNB]: [
    {
      symbol: 'WBNB',
      address: WBNB[CHAIN_ID.OPBNB].address,
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

export const NEW_POOLS = {
  [CHAIN_ID.BSC]: ['0xdc6f26e5f8a7ea128a8a06ce07681b3cde5280f2', '0x01dd2d28eeb95d740acb5344b1e2c99b61cc3e64'],
  [CHAIN_ID.OPBNB]: [],
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

export const AUTOMATION_STATUS = {
  PENDING: 'Pending',
  ACTIVE: 'Active',
  PAUSED: 'Paused',
  CANCELED: 'Canceled',
  NO: 'No',
  UNKNOWN: 'unknown',
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

export const EDIT_AUTOMATION_TYPE = {
  OPERATIONS: 'operations',
  POOL_AND_WEIGHT: 'poolAndWeight',
  ALL: 'all',
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
  'Narrow_Farming',
  'Wide_Farming',
  'Correlated_Farming',
  'Narrow_SwapFee',
  'Wide_SwapFee',
  'Correlated_SwapFee',
  'CL_Stable',
]
export const MANUAL_TYPES = ['CL_Farming', 'CL_SwapFee']
export const ICHI_TYPES = ['ICHI_Farming', 'ICHI_SwapFee', 'ICHI']
export const NARROW_TYPES = ['Narrow_Farming', 'Narrow_SwapFee']
export const ICHI_SwapFee = 'ICHI_SwapFee'

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
  '0x04d6115703b0127888323f142b8046c7c13f857d',
  '0x5b0baf66718caabda49a4af32eb455c3b99b5821',
  '0xbf121d987f9635ed6d2f7bb957fbbe163bdea0e0',
  '0xf8a4cdf9efc4b9b38eaa6e27ee281cb2111fa664',
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

export const TC_TIMESTAMP = {
  MIN_REG: 3600 * 1000,
  MAX_REG: 3600 * 24 * 7 * 1000,
  MIN_TS: 3600 * 1000,
  MAX_TS: 3600 * 24 * 7 * 1000 * 4,
}

export const TC_STEPS = ['DETAILS', 'TIME SETTINGS', 'TYPE AND TOKENS', 'FEES AND PRIZES']

export const TC_PARTICIPANTS = {
  MIN: 2,
  MAX: 1000,
}

export const MAX_ASSETS_PRIZE_TOKEN = 8

export const TC_MARKET_TYPES = {
  ALL: 'ALL',
  SPOT: 'SPOT',
  PERPETUAL: 'PERPETUALS',
}

export const DEPOSIT_TYPE = {
  FREE: false,
  FIXED: true,
}

export const WIN_TYPE = {
  AMOUNT: false,
  PNL: true,
}

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

const { MIN_REG, MIN_TS } = TC_TIMESTAMP

const roundupTime = () => {
  const finalTS = dayjs()

  let hours = finalTS.hour()
  let minutes = finalTS.minute()

  if (minutes < 30) {
    minutes = 30
  } else {
    minutes = 0
    hours = hours === 23 ? 0 : hours + 1
  }

  return dayjs().set('hour', hours).set('minute', minutes).valueOf()
}

export const INIT_VALUES = {
  name: '',
  description: '',
  maxParticipants: 1000,
  timestamp: {
    registrationStart: roundupTime(), // start timestamp
    registrationEnd: roundupTime() + MIN_REG, // end timestamp
    startTimestamp: roundupTime() + MIN_REG * 1.5, // registration start timestamp
    endTimestamp: roundupTime() + MIN_REG + MIN_TS, // registration end timestamp
  },
  market: TC_MARKET_TYPES.SPOT,
  participantCount: 0,
  participants: [],
  prize: {
    placements: 2, //  number of placements
    ownerFee: 0, //  owner fee
    totalPrize: [''], //  total prize amounts
    token: [], //  prize tokens
    weights: [0, 0], //  placement weights
    // winType: false, //  win type
  },
  competitionRules: {
    startingBalance: '', //  starting balance
    winningToken: null, //  winning token
    tradingTokens: [], //  trading tokens
    pairIds: [],
    minimumBalance: '', // minimum balance
  },
  entryFee: [], // entry fee of 0 prize token
  owner: {
    id: '',
  }, // owner address
  tcAddress: ZERO_ADDRESS, // trading competition contract address
  depositType: DEPOSIT_TYPE.FREE,
  winType: WIN_TYPE.PNL,
}

export const SWAP_TYPES = {
  SWAP: '1',
  TWAP: '2',
  LIMIT: '3',
}

export const trade2EarnStartTime = 1712534400

export const LIST_CATEGORY = {
  ALL: 'All',
  '1_LETTER_WORDS': '1 Letter Words',
  '2_LETTER_WORDS': '2 Letter Words',
  '3_LETTER_WORDS': '3 Letter Words',
  '4_LETTER_WORDS': '4 Letter Words',
  '5_LETTER_WORDS': '5 Letter Words',
  '6_LETTER_WORDS': '6 Letter Words',
  '7_LETTER_WORDS': '7 Letter Words',
  '8_LETTER_WORDS': '8 Letter Words',
  '9_LETTER_WORDS': '9 Letter Words',
  '10_LETTER_WORDS': '10 Letter Words',
  '11_LETTER_WORDS': '11 Letter Words',
  '12_LETTER_WORDS': '12 Letter Words',
  '13_LETTER_WORDS': '13 Letter Words',
  '14_LETTER_WORDS': '14 Letter Words',
  '15_LETTER_WORDS': '15 Letter Words',
  ADJECTIVES: 'Adjectives',
  CAPITALS: 'Capitals',
  CITIES: 'Cities',
  COMPANIES: 'Companies',
  CONTINENTS: 'Continents',
  COUNTRIES: 'Countries',
  COUNTRY_CODES: 'Country Codes',
  FEMALE_NAMES: 'Female Names',
  FIRST_NAMES: ' First Names',
  FRUITS: 'Fruits',
  GREEK_GODS: 'Greek Gods',
  LAST_NAMES: 'Last Names',
  MALE_NAMES: ' Male Names',
  NOUNS: 'Nouns',
  VEGETABLES: 'Vegetables',
  VERBS: 'Verbs',
}

export const LIST_PAIRS = {
  0: 'ALL',
  1: 'BTCUSDT',
  2: 'ETHUSDT',
  3: 'BCHUSDT',
  4: 'XRPUSDT',
  5: 'EOSUSDT',
  6: 'LTCUSDT',
  7: 'TRXUSDT',
  8: 'ETCUSDT',
  9: 'LINKUSDT',
  10: 'XLMUSDT',
  11: 'ADAUSDT',
  12: 'XMRUSDT',
  13: 'DASHUSDT',
  14: 'ZECUSDT',
  15: 'XTZUSDT',
  16: 'BNBUSDT',
  17: 'ATOMUSDT',
  18: 'ONTUSDT',
  19: 'IOTAUSDT',
  20: 'BATUSDT',
  21: 'VETUSDT',
  22: 'QTUMUSDT',
  23: 'IOSTUSDT',
  24: 'THETAUSDT',
  25: 'ALGOUSDT',
  26: 'ZILUSDT',
  27: 'KNCUSDT',
  28: 'ZRXUSDT',
  29: 'COMPUSDT',
  30: 'OMGUSDT',
  31: 'DOGEUSDT',
  32: 'SXPUSDT',
  33: 'KAVAUSDT',
  34: 'BANDUSDT',
  35: 'RLCUSDT',
  36: 'WAVESUSDT',
  37: 'MKRUSDT',
  38: 'SNXUSDT',
  39: 'DOTUSDT',
  40: 'DEFIUSDT',
  41: 'YFIUSDT',
  42: 'BALUSDT',
  43: 'CRVUSDT',
  44: 'RUNEUSDT',
  45: 'SUSHIUSDT',
  46: 'EGLDUSDT',
  47: 'SOLUSDT',
  48: 'STORJUSDT',
  49: 'UNIUSDT',
  50: 'AVAXUSDT',
  51: 'FTMUSDT',
  52: 'HNTUSDT',
  53: 'ENJUSDT',
  54: 'FLMUSDT',
  55: 'TOMOUSDT',
  56: 'RENUSDT',
  57: 'KSMUSDT',
  58: 'NEARUSDT',
  59: 'AAVEUSDT',
  60: 'FILUSDT',
  61: 'LRCUSDT',
  62: 'MATICUSDT',
  63: 'OCEANUSDT',
  64: 'AXSUSDT',
  65: 'ZENUSDT',
  66: 'SKLUSDT',
  67: 'GRTUSDT',
  68: '1INCHUSDT',
  69: 'CHZUSDT',
  70: 'SANDUSDT',
  71: 'ANKRUSDT',
  72: 'LITUSDT',
  73: 'UNFIUSDT',
  74: 'REEFUSDT',
  75: 'COTIUSDT',
  76: 'CHRUSDT',
  77: 'MANAUSDT',
  78: 'ALICEUSDT',
  79: 'ONEUSDT',
  80: 'LINAUSDT',
  81: 'STMXUSDT',
  82: 'DENTUSDT',
  83: 'CELRUSDT',
  84: 'HOTUSDT',
  85: 'MTLUSDT',
  86: 'OGNUSDT',
  87: '1000SHIBUSDT',
  88: 'BTCDOMUSDT',
  89: 'IOTXUSDT',
  90: 'AUDIOUSDT',
  91: 'C98USDT',
  92: 'MASKUSDT',
  93: 'ATAUSDT',
  94: 'DYDXUSDT',
  95: '1000XECUSDT',
  96: 'GALAUSDT',
  97: 'CELOUSDT',
  98: 'ARUSDT',
  99: 'KLAYUSDT',
  100: 'ARPAUSDT',
  101: 'ENSUSDT',
  102: 'PEOPLEUSDT',
  103: 'ANTUSDT',
  104: 'ROSEUSDT',
  105: 'DUSKUSDT',
  106: 'FLOWUSDT',
  107: 'IMXUSDT',
  108: 'API3USDT',
  109: 'GMTUSDT',
  110: 'APEUSDT',
  111: 'WOOUSDT',
  112: 'JASMYUSDT',
  113: 'DARUSDT',
  114: 'GALUSDT',
  115: 'OPUSDT',
  116: 'INJUSDT',
  117: 'STGUSDT',
  118: 'FOOTBALLUSDT',
  119: 'SPELLUSDT',
  120: '1000LUNCUSDT',
  121: 'LUNA2USDT',
  122: 'LDOUSDT',
  123: 'CVXUSDT',
  124: 'APTUSDT',
  125: 'QNTUSDT',
  126: 'BLUEBIRDUSDT',
  127: 'RNDRUSDT',
  128: 'BNXUSDT',
  129: 'ARBUSDT',
  130: 'JOEUSDT',
  131: 'SUIUSDT',
  132: '1000PEPEUSDT',
  133: 'TRBUSDT',
  134: 'ASTRUSDT',
  135: 'SSVUSDT',
  136: 'PHBUSDT',
  137: 'LPTUSDT',
  138: 'GTCUSDT',
  139: 'CTSIUSDT',
  140: 'TUSDT',
  141: 'RDNTUSDT',
  142: 'BLZUSDT',
  143: 'BELUSDT',
  144: 'AGIXUSDT',
  145: 'HBARUSDT',
  146: 'XVSUSDT',
  147: 'RADUSDT',
  148: 'KEYUSDT',
  149: 'RSRUSDT',
  150: 'IDUSDT',
  151: 'NKNUSDT',
  152: 'HFTUSDT',
  153: 'STXUSDT',
  154: 'PERPUSDT',
  155: 'UMAUSDT',
  156: 'TRUUSDT',
  157: 'BAKEUSDT',
  158: 'HIGHUSDT',
  159: 'COMBOUSDT',
  160: 'ALPHAUSDT',
  161: 'LEVERUSDT',
  162: 'XEMUSDT',
  163: 'MDTUSDT',
  164: '1000FLOKIUSDT',
  165: 'MINAUSDT',
  166: 'CFXUSDT',
  167: 'TLMUSDT',
  168: 'CTKUSDT',
  169: 'CKBUSDT',
  170: 'GMXUSDT',
  171: 'SFPUSDT',
  172: 'NMRUSDT',
  173: 'FETUSDT',
  174: 'MAGICUSDT',
  175: 'ICXUSDT',
  176: 'DGBUSDT',
  177: 'EDUUSDT',
  178: 'USDCUSDT',
  179: 'ACHUSDT',
  180: 'LQTYUSDT',
  181: 'BLURUSDT',
  182: 'FXSUSDT',
  183: 'ICPUSDT',
  184: 'HOOKUSDT',
  185: 'RVNUSDT',
  186: 'IDEXUSDT',
  187: 'NEOUSDT',
  188: 'AMBUSDT',
  189: 'WLDUSDT',
  190: 'PENDLEUSDT',
  191: 'ARKMUSDT',
  192: 'AGLDUSDT',
  193: 'TIAUSDT',
  194: 'ORDIUSDT',
  195: 'KASUSDT',
  196: '1000BONKUSDT',
  197: 'PYTHUSDT',
  198: 'ILVUSDT',
  199: 'MEMEUSDT',
  200: 'BEAMXUSDT',
  201: 'USTCUSDT',
  202: 'SEIUSDT',
  203: 'JTOUSDT',
}

export const ThenaAuthToken = 'thena-token'
export const NotShowDiscoverArenaModal = 'not-show-discover-arena-modal'
export const NotShowDiscoverPoolsAnalyticsModal = 'not-show-discover-pools-analytics-modal'
export const HASH = {
  TRANSFER: '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
}
