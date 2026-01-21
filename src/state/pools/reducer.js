/* eslint-disable no-param-reassign */
import { createReducer } from '@reduxjs/toolkit'

import { CHAIN_ID } from '@/constant/contracts'

import { updatePools, updatePoolsLoading, updatePoolsMigration } from './actions'

export const initialState = {
  data: {
    [CHAIN_ID.BSC]: [],
    [CHAIN_ID.OPBNB]: [],
    [CHAIN_ID.TEST_BSC]: [],
  },
  autoPoolsMigration: {
    ichi: [],
    gamma: [],
  },
  isLoading: false,
}

export default createReducer(initialState, builder =>
  builder
    .addCase(updatePools, (state, { payload }) => {
      const { pools, networkId } = payload
      return {
        ...state,
        data: {
          ...state.data,
          [networkId]: pools,
        },
      }
    })
    .addCase(updatePoolsMigration, (state, { payload }) => ({
      ...state,
      autoPoolsMigration: payload,
    }))
    .addCase(updatePoolsLoading, (state, { payload }) => ({
      ...state,
      isLoading: payload,
    })),
)
