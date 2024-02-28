/* eslint-disable no-param-reassign */
import { createReducer } from '@reduxjs/toolkit'
import { ChainId } from 'thena-sdk-core'

import { updateAssets } from './actions'

const initialState = {
  data: {
    [ChainId.BSC]: [],
    [ChainId.OPBNB]: [],
  },
}

export default createReducer(initialState, builder =>
  builder.addCase(updateAssets, (state, { payload }) => {
    const { assets, networkId } = payload
    return {
      ...state,
      data: {
        ...state.data,
        [networkId]: assets,
      },
    }
  }),
)
