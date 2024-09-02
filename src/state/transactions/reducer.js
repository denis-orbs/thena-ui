/* eslint-disable no-param-reassign */
import { createReducer } from '@reduxjs/toolkit'

import {
  clearRetryParams,
  closeRetryTransactionModal,
  closeTransaction,
  closeTransactionPopup,
  completeTransaction,
  openRetryTransactionModal,
  openTransaction,
  updateTransaction,
} from './actions'

export const initialState = {
  key: null,
  popup: false,
  title: '',
  transactions: {},
  final: null,
  link: null,
  retryModalIsOpen: false,
  retryParams: null,
  retryResolver: null,
}

export default createReducer(initialState, builder =>
  builder
    .addCase(openTransaction, (state, { payload: { title, transactions, key } }) => ({
      ...state,
      key,
      popup: true,
      title,
      transactions,
      final: null,
      link: null,
    }))
    .addCase(updateTransaction, (state, { payload: { key, uuid, hash = null, status } }) => {
      if (state.key === key) {
        return {
          ...state,
          transactions: {
            ...state.transactions,
            [uuid]: {
              ...state.transactions[uuid],
              hash,
              status,
            },
          },
        }
      }
      return state
    })
    .addCase(completeTransaction, (state, { payload: { final, link, key } }) => {
      if (state.key === key) {
        return {
          ...state,
          final,
          link,
        }
      }
      return state
    })
    .addCase(closeTransaction, state => {
      if (state.retryResolver) {
        state.retryResolver(false)
      }
      return initialState
    })
    .addCase(openRetryTransactionModal, (state, { payload: { params, resolver } }) => ({
      ...state,
      retryModalIsOpen: true,
      retryParams: params,
      retryResolver: resolver,
    }))
    .addCase(closeRetryTransactionModal, state => ({
      ...state,
      retryModalIsOpen: false,
    }))
    .addCase(clearRetryParams, state => {
      if (state.retryResolver) {
        state.retryResolver(false)
      }
      return {
        ...state,
        retryParams: null,
        retryResolver: null,
      }
    })
    .addCase(closeTransactionPopup, state => ({
      ...state,
      popup: false,
    })),
)
