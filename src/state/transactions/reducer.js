/* eslint-disable no-param-reassign */
import { createReducer } from '@reduxjs/toolkit'

import { closeTransaction, completeTransaction, openTransaction, updateTransaction } from './actions'

export const initialState = {
  key: null,
  popup: false,
  title: '',
  transactions: {},
  final: null,
  link: null,
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
    .addCase(closeTransaction, () => initialState),
)
