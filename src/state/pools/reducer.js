/* eslint-disable no-param-reassign */
import { createReducer } from '@reduxjs/toolkit'
import { ChainId } from 'thena-sdk-core'

import { updatePools } from './actions'

export const initialState = {
  data: {
    [ChainId.BSC]: [],
    [ChainId.OPBNB]: [],
  },
}

export default createReducer(initialState, builder =>
  builder.addCase(updatePools, (state, { payload }) => {
    const { pools, networkId } = payload
    return {
      ...state,
      data: {
        ...state.data,
        [networkId]: pools,
      },
    }
  }),
)
