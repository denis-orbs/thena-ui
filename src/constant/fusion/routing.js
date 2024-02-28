// a list of tokens by chain
import { ChainId, Token, WBNB } from 'thena-sdk-core'

export const toToken = t => new Token(t.chainId, t.address, t.decimals, t.symbol, t.name)

const routeAssets = {
  [ChainId.BSC]: {
    BNB: {
      name: 'Wrapped BNB',
      symbol: 'WBNB',
      address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
      chainId: 56,
      decimals: 18,
    },
    BUSD: {
      name: 'BUSD Token',
      symbol: 'BUSD',
      address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
      chainId: 56,
      decimals: 18,
    },
    USDC: {
      name: 'USD Coin',
      symbol: 'USDC',
      address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
      chainId: 56,
      decimals: 18,
    },
    USDT: {
      name: 'Tether USD',
      symbol: 'USDT',
      address: '0x55d398326f99059fF775485246999027B3197955',
      chainId: 56,
      decimals: 18,
    },
    THE: {
      name: 'THENA',
      symbol: 'THE',
      address: '0xF4C8E32EaDEC4BFe97E0F595AdD0f4450a863a11',
      chainId: 56,
      decimals: 18,
    },
    FRAX: {
      name: 'FRAX',
      symbol: 'FRAX',
      address: '0x90c97f71e18723b0cf0dfa30ee176ab653e89f40',
      chainId: 56,
      decimals: 18,
    },
    BNBx: {
      name: 'Liquid Staking BNB',
      symbol: 'BNBx',
      address: '0x1bdd3cf7f79cfb8edbb955f20ad99211551ba275',
      chainId: 56,
      decimals: 18,
    },
    ankrBNB: {
      name: 'Ankr Reward Bearing BNB',
      symbol: 'ankrBNB',
      address: '0x52F24a5e03aee338Da5fd9Df68D2b6FAe1178827',
      chainId: 56,
      decimals: 18,
    },
    stkBNB: {
      name: 'Staked BNB',
      symbol: 'stkBNB',
      address: '0xc2e9d07f66a89c44062459a47a0d2dc038e4fb16',
      chainId: 56,
      decimals: 18,
    },
    ETH: {
      name: 'Ethereum Token',
      symbol: 'ETH',
      address: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8',
      chainId: 56,
      decimals: 18,
    },
    'USD+': {
      name: 'USD+',
      symbol: 'USD+',
      address: '0xe80772eaf6e2e18b651f160bc9158b2a5cafca65',
      chainId: 56,
      decimals: 6,
    },
  },
  [ChainId.OPBNB]: {
    BNB: {
      name: 'Wrapped BNB',
      symbol: 'WBNB',
      address: '0x4200000000000000000000000000000000000006',
      chainId: 204,
      decimals: 18,
    },
    USDT: {
      name: 'Tether USD',
      symbol: 'USDT',
      address: '0x9e5aac1ba1a2e6aed6b32689dfcf62a509ca96f3',
      chainId: 204,
      decimals: 18,
    },
    ETH: {
      name: 'Ethereum Token',
      symbol: 'ETH',
      address: '0xe7798f023fc62146e8aa1b36da45fb70855a77ea',
      chainId: 204,
      decimals: 18,
    },
    BTCB: {
      name: 'BTCB Token',
      symbol: 'BTCB',
      address: '0x7c6b91d9be155a6db01f749217d76ff02a7227f2',
      chainId: 204,
      decimals: 18,
    },
  },
}

export const USDT = {
  [ChainId.BSC]: toToken(routeAssets[ChainId.BSC].USDT),
  [ChainId.OPBNB]: toToken(routeAssets[ChainId.OPBNB].USDT),
}
const ETH = {
  [ChainId.BSC]: toToken(routeAssets[ChainId.BSC].ETH),
  [ChainId.OPBNB]: toToken(routeAssets[ChainId.OPBNB].ETH),
}
const BTCB = {
  [ChainId.BSC]: toToken(routeAssets[ChainId.BSC].ETH),
  [ChainId.OPBNB]: toToken(routeAssets[ChainId.OPBNB].BTCB),
}

const USDC = toToken(routeAssets[ChainId.BSC].USDC)
const BUSD = toToken(routeAssets[ChainId.BSC].BUSD)
const FRAX = toToken(routeAssets[ChainId.BSC].FRAX)
const BNBx = toToken(routeAssets[ChainId.BSC].BNBx)
const ankrBNB = toToken(routeAssets[ChainId.BSC].ankrBNB)
const stkBNB = toToken(routeAssets[ChainId.BSC].stkBNB)
const USDPlus = toToken(routeAssets[ChainId.BSC]['USD+'])
const THE = toToken(routeAssets[ChainId.BSC].THE)

const WBNB_ONLY = Object.fromEntries(Object.entries(WBNB).map(([key, value]) => [key, [value]]))

// used to construct intermediary pairs for trading
export const BASES_TO_CHECK_TRADES_AGAINST = {
  [ChainId.BSC]: [
    ...WBNB_ONLY[ChainId.BSC],
    BUSD,
    USDC,
    USDT[ChainId.BSC],
    ETH[ChainId.BSC],
    FRAX,
    BNBx,
    ankrBNB,
    stkBNB,
    THE,
    USDPlus,
  ],
  [ChainId.OPBNB]: [...WBNB_ONLY[ChainId.OPBNB], USDT[ChainId.OPBNB], ETH[ChainId.OPBNB], BTCB[ChainId.OPBNB]],
}

export const ADDITIONAL_BASES = {}
