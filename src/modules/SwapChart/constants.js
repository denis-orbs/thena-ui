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

export const CHAIN_MAP = {
  [ChainId.BSC]: 'binance-smart-chain',
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
}
