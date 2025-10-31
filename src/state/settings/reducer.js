/* eslint-disable no-param-reassign */
import { createReducer } from '@reduxjs/toolkit'
import { ChainId } from 'thena-sdk-core'

import { LOCALES } from '@/constant'

import { switchNetwork, updateDeadline, updateLiquidityHubEnabled, updateLocale, updateSlippage } from './actions'

export const initialState = {
  networkId: ChainId.BSC,
  isWalletOpen: false,
  slippage: 0.5,
  deadline: 20,
  locale: LOCALES.en,
  liquidityHubEnabled: true,
}

export default createReducer(initialState, builder =>
  builder
    .addCase(switchNetwork, (state, { payload }) => ({
      ...state,
      networkId: payload,
    }))
    .addCase(updateSlippage, (state, { payload }) => ({
      ...state,
      slippage: payload,
    }))
    .addCase(updateDeadline, (state, { payload }) => ({
      ...state,
      deadline: payload,
    }))
    .addCase(updateLocale, (state, { payload }) => ({
      ...state,
      locale: payload,
    }))
    .addCase(updateLiquidityHubEnabled, (state, { payload }) => ({
      ...state,
      liquidityHubEnabled: typeof payload === 'boolean' ? payload : !state.liquidityHubEnabled,
    })),
)
