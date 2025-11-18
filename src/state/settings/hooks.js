import { useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { ChainId } from 'thena-sdk-core'
import { useAccount, useSwitchChain } from 'wagmi'

import { LOCALES, ThenaLiquidityHubEnabledKey } from '@/constant'

import {
  closeWallet,
  openWallet,
  switchNetwork,
  updateDeadline,
  updateLiquidityHubEnabled,
  updateLocale,
  updatePriceProtection,
  updateSlippage,
} from './actions'

export const useWalletModal = () => {
  const { isWalletOpen } = useSelector(state => state.settings)
  const dispatch = useDispatch()

  const closeWalletModal = useCallback(() => {
    dispatch(closeWallet())
  }, [dispatch])

  const openWalletModal = useCallback(() => {
    dispatch(openWallet())
  }, [dispatch])

  return { isWalletOpen, openWalletModal, closeWalletModal }
}

const getFromLocalStorage = (key, defaultValue = true) => {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') return defaultValue

  try {
    const value = window.localStorage.getItem(key)
    if (value === null) return defaultValue
    return value === 'true'
  } catch (err) {
    console.error('Cannot access localStorage:', err)
    return defaultValue
  }
}

export const useSettings = () => {
  const { slippage, deadline, liquidityHubEnabled, priceProtection } = useSelector(state => state.settings)
  const dispatch = useDispatch()

  // Load liquidityHubEnabled from localStorage on initial render
  useEffect(() => {
    const storedBool = getFromLocalStorage(ThenaLiquidityHubEnabledKey, liquidityHubEnabled)
    if (storedBool !== liquidityHubEnabled) {
      dispatch(updateLiquidityHubEnabled(storedBool))
    }
  }, [dispatch, liquidityHubEnabled])

  const _updateSlippage = useCallback(
    val => {
      dispatch(updateSlippage(val))
    },
    [dispatch],
  )

  const _updateDeadline = useCallback(
    val => {
      dispatch(updateDeadline(val))
    },
    [dispatch],
  )

  const _updateLiquidityHubEnabled = useCallback(() => {
    const newValue = !liquidityHubEnabled
    dispatch(updateLiquidityHubEnabled())
    if (typeof window !== 'undefined') {
      localStorage.setItem(ThenaLiquidityHubEnabledKey, newValue.toString())
    }
  }, [dispatch, liquidityHubEnabled])

  const _updatePriceProtection = useCallback(
    val => {
      dispatch(updatePriceProtection(val))
    },
    [dispatch],
  )

  return {
    slippage,
    deadline,
    liquidityHubEnabled,
    priceProtection,
    updateSlippage: _updateSlippage,
    updateDeadline: _updateDeadline,
    updateLiquidityHubEnabled: _updateLiquidityHubEnabled,
    updatePriceProtection: _updatePriceProtection,
  }
}

export const useChainSettings = () => {
  const { networkId } = useSelector(state => state.settings)
  const dispatch = useDispatch()
  const { address, chainId } = useAccount()
  const { switchChain } = useSwitchChain()

  const updateNetwork = useCallback(
    val => {
      if (address && val !== chainId) {
        switchChain({ chainId: val })
      }
      dispatch(switchNetwork(val))
    },
    [address, chainId, dispatch, switchChain],
  )

  return { networkId: networkId || ChainId.BSC, updateNetwork }
}

export const useLocaleSettings = () => {
  const dispatch = useDispatch()

  const { locale } = useSelector(state => state.settings)

  useEffect(() => {
    const lcLocale = localStorage.getItem('thena-locale') || LOCALES.en
    dispatch(updateLocale(lcLocale))
  }, [dispatch])

  const updateLanguage = useCallback(
    val => {
      dispatch(updateLocale(val))
      if (typeof window !== 'undefined') {
        localStorage.setItem('thena-locale', val)
      }
    },
    [dispatch],
  )

  return { locale, updateLanguage }
}
