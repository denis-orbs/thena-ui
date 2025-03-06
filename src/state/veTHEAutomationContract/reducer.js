import { createReducer } from '@reduxjs/toolkit'

import { createVeTHEAutomationContract, setSelectedVeTHE } from './action'

const SECONDS_IN_DAY = 86400 * 1000
const SECONDS_IN_TEN_MINUTES = 600 * 1000
export const initialState = {
  veTHESelected: undefined,
  createData: {
    veTHEId: undefined,
    contractName: '',
    settings: {
      isClaimEveryWeek: true,
      isRelockEveryWeek: true,
      executionTime: Date.now() + SECONDS_IN_TEN_MINUTES + SECONDS_IN_DAY,
    },
    votes: {
      isAutoVote: false,
      pairs: [
        {
          lock: false,
          weight: 100,
          pair: undefined,
        },
      ],
    },
    registration: {
      chainlink: undefined,
      chainlinkAmount: undefined,
    },
  },
}

export default createReducer(initialState, builder =>
  builder
    .addCase(setSelectedVeTHE, (state, { payload: { veTHESelected } }) => ({
      ...state,
      veTHESelected,
    }))
    .addCase(createVeTHEAutomationContract, (state, { payload: { createData } }) => ({
      ...state,
      createData,
    })),
)
