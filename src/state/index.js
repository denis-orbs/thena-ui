import { combineReducers, configureStore } from '@reduxjs/toolkit'
import { FLUSH, PAUSE, PERSIST, persistReducer, PURGE, REGISTER, REHYDRATE } from 'redux-persist'
import createWebStorage from 'redux-persist/lib/storage/createWebStorage'

import assetsReducer from './assets/reducer'
import fusionReducer from './fusion/reducer'
import poolsReducer from './pools/reducer'
import settingsReducer from './settings/reducer'
import transactionsReducer from './transactions/reducer'

const createNoopStorage = () => ({
  getItem(_key) {
    return Promise.resolve(null)
  },
  setItem(_key, value) {
    return Promise.resolve(value)
  },
  removeItem(_key) {
    return Promise.resolve()
  },
})

const storage = typeof window !== 'undefined' ? createWebStorage('local') : createNoopStorage()
const PERSISTED_KEYS = ['transactions', 'settings', 'assets', 'pools']

const persistConfig = {
  key: 'primary',
  whitelist: PERSISTED_KEYS,
  blacklist: [],
  storage,
  version: 1,
}

const persistedReducer = persistReducer(
  persistConfig,
  combineReducers({
    settings: settingsReducer,
    assets: assetsReducer,
    pools: poolsReducer,
    transactions: transactionsReducer,
    fusion: fusionReducer,
  }),
)

// eslint-disable-next-line import/no-mutable-exports
let store

export function makeStore() {
  return configureStore({
    reducer: persistedReducer,
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({
        thunk: true,
        serializableCheck: {
          ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        },
      }),
    devTools: process.env.NODE_ENV === 'development',
  })
}

export const initializeStore = () => {
  let _store = store ?? makeStore()

  // After navigating to a page with an initial Redux state, merge that state
  // with the current state in the store, and create a new store
  if (store) {
    _store = makeStore()
    // Reset the current store
    store = undefined
  }

  // For SSG and SSR always create a new store
  if (typeof window === 'undefined') return _store

  // Create the store once in the client
  if (!store) {
    store = _store
  }

  return _store
}

store = initializeStore()

export default store
