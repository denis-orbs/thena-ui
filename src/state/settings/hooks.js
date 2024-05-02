import { useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { ChainId } from 'thena-sdk-core'
import { useAccount, useSwitchChain } from 'wagmi'

import { LOCALES } from '@/constant'

import { closeWallet, openWallet, switchNetwork, updateDeadline, updateLocale, updateSlippage } from './actions'

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

export const useSettings = () => {
  const { slippage, deadline } = useSelector(state => state.settings)
  const dispatch = useDispatch()

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

  return { slippage, deadline, updateSlippage: _updateSlippage, updateDeadline: _updateDeadline }
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
    [dispatch, address, chainId, switchChain],
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
