import { createReducer } from '@reduxjs/toolkit'

import { createVeTHEAutomationContract, setSelectedVeTHE } from './action'

const HOUR = 3600 * 1000
const DAY = 86400 * 1000

export const getDefaultExecutionTime = () => {
  const tomorrow = new Date(Date.now() + HOUR + DAY)
  tomorrow.setHours(0, 0, 0, 0)
  return tomorrow.getTime()
}

export const initialState = {
  veTHESelected: undefined,
  createData: {
    veTHEId: undefined,
    contractName: '',
    settings: {
      isClaimEveryWeek: true,
      isRelockEveryWeek: true,
      executionTime: getDefaultExecutionTime(),
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
      createData: {
        ...createData,
        settings: {
          ...createData.settings,
          executionTime: createData.settings?.executionTime || getDefaultExecutionTime(),
        },
      },
    })),
)
