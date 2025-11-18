import dayjs from 'dayjs'

import { ZERO_ADDRESS } from '.'

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

export const TC_PARTICIPANTS = {
  MIN: 2,
  MAX: 1000,
}

export const TC_STEPS = ['DETAILS', 'TIME SETTINGS', 'TYPE AND TOKENS', 'FEES AND PRIZES']

export const TC_TIMESTAMP = {
  MIN_REG: 3600 * 1000,
  MAX_REG: 3600 * 24 * 7 * 1000,
  MIN_TS: 3600 * 1000,
  MAX_TS: 3600 * 24 * 7 * 1000 * 4,
}

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

export const ARENA_INIT_VALUES = {
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
