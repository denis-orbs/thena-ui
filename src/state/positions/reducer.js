/* eslint-disable no-param-reassign */
import { createReducer } from '@reduxjs/toolkit'

import { updateHideWarningBanner, updatePositions } from './actions'

export const initialState = {
  positions: [],
  removedClaimablePositions: [],
  hideWarningBanner: true,
}

export default createReducer(initialState, builder =>
  builder
    .addCase(updatePositions, (state, { payload: { positions, removedClaimablePositions } }) => ({
      ...state,
      positions,
      removedClaimablePositions,
    }))
    .addCase(updateHideWarningBanner, (state, { payload }) => ({
      ...state,
      hideWarningBanner: payload,
    })),
)
