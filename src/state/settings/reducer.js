/* eslint-disable no-param-reassign */
import { createReducer } from '@reduxjs/toolkit'
import { ChainId } from 'thena-sdk-core'

import { LOCALES } from '@/constant'

import { closeWallet, openWallet, switchNetwork, updateDeadline, updateLocale, updateSlippage } from './actions'

export const initialState = {
  networkId: ChainId.BSC,
  isWalletOpen: false,
  slippage: 0.5,
  deadline: 20,
  locale: LOCALES.en,
}

export default createReducer(initialState, builder =>
  builder
    .addCase(switchNetwork, (state, { payload }) => ({
      ...state,
      networkId: payload,
    }))
    .addCase(openWallet, state => ({
      ...state,
      isWalletOpen: true,
    }))
    .addCase(closeWallet, state => ({
      ...state,
      isWalletOpen: false,
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
    })),
)
