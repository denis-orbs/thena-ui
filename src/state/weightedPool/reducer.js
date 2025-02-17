import { createReducer } from '@reduxjs/toolkit'

import { tokensSelected } from './action'

const initialState = {
  tokensSelected: [],
}

export default createReducer(initialState, builder =>
  builder.addCase(tokensSelected, (state, { payload: { tokens } }) => ({
    ...state,
    tokens,
  })),
)
