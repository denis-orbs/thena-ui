import { ChainId } from 'thena-sdk-core'

export const PairDataTimeWindow = {
  HOUR: 'HOUR',
  DAY: 'DAY',
  WEEK: 'WEEK',
  MONTH: 'MONTH',
  YEAR: 'YEAR',
}

export const CHART_CONFIG = {
  [PairDataTimeWindow.DAY]: 1,
  [PairDataTimeWindow.WEEK]: 7,
  [PairDataTimeWindow.MONTH]: 30,
  [PairDataTimeWindow.YEAR]: 365,
}

export const OHLCV_TIMEFRAME_MAP = {
  [PairDataTimeWindow.DAY]: {
    timeframe: 'minute',
    aggregate: 5,
    limit: 288,
  },
  [PairDataTimeWindow.WEEK]: {
    timeframe: 'hour',
    aggregate: '1',
    limit: 168,
  },
  [PairDataTimeWindow.MONTH]: {
    timeframe: 'hour',
    aggregate: '1',
    limit: 720,
  },
  [PairDataTimeWindow.YEAR]: {
    timeframe: 'day',
    aggregate: '1',
    limit: 365,
  },
}

export const CHAIN_MAP = {
  [ChainId.BSC]: 'binance-smart-chain',
  [ChainId.OPBNB]: 'opbnb',
}

export const OHLCV_CHAIN_MAP = {
  [ChainId.BSC]: 'bsc',
  [ChainId.OPBNB]: 'opbnb',
}
export const TOKEN_MAPPING = {
  // USDD bsc -> USDD ethereum
  '0x45e51bc23d592eb2dba86da3985299f7895d66ba': {
    chain: 'ethereum',
    address: '0x4f8e5de400de08b164e7421b3ee387f461becd1a',
  },
  // arcas bsc -> arcas bsc new
  '0xad0926ecf31719263dc86426024794332d9dd9a3': {
    chain: 'binance-smart-chain',
    address: '0x7ca058309053f90b39bfc58de1eda2a89e9c03a8',
  },
  // arken bsc -> arken tomoscan
  '0x1d4268a58ee7ec2cc2af5d70a2fd2b3a896527a2': {
    chain: 'tomochain',
    address: '0xb55dd628039552a7d93a70fc8932f677499ed479',
  },
  // preon-star bsc -> bnbx Arbitrum One
  '0xc19669a405067927865b40ea045a2baabbbe57f5': {
    chain: 'arbitrum-one',
    address: '0xc19669a405067927865b40ea045a2baabbbe57f5',
  },
}
