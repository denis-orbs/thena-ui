import { ChainId } from 'thena-sdk-core'

export const API_COINGECKO_URL = 'https://api.coingecko.com/api/v3'

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
