import { createReducer } from '@reduxjs/toolkit'

import { createVeTHEAutomationContract, setSelectedVeTHE } from './action'

export const initialState = {
  veTHESelected: undefined,
  createData: {
    veTHEId: undefined,
    contractName: '',
    settings: {
      isClaimEveryWeek: true,
      isRelockEveryWeek: true,
      executionTime: new Date().getTime(),
    },
    votes: {
      isAutoVote: true,
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
