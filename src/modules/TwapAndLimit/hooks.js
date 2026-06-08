/* THENA Dev */
/* eslint-disable simple-import-sort/imports */
import { useCallback, useMemo } from 'react'
import BN from 'bignumber.js'
import { _TypedDataEncoder } from '@ethersproject/hash'
import { Module } from '@orbs-network/spot-react'
import { maxUint256, zeroAddress } from 'viem'
import { toast } from 'react-toastify'
import { useMessages, useTranslations } from 'next-intl'

import { useChainId } from 'wagmi'
import { SWAP_TYPES } from '@/constant'
import { useAssets, useMutateAssets } from '@/context/assetsContext'
import { getERC20Contract, getWBNBContract } from '@/lib/contracts'
import { readCall, signCall, writeCall } from '@/lib/contractActions'

import { parseAsset } from './utils'
import useWallet from '@/hooks/useWallet'
import { useChainSettings } from '@/state/settings/hooks'

export function useTwapTranslation() {
  const t = useTranslations()
  const messages = useMessages()

  return useCallback(
    (key, params) => {
      if (!key) return ''
      const messageKey = key.startsWith('twap_') ? key : `twap_${key}`

      if (!Object.prototype.hasOwnProperty.call(messages, messageKey)) {
        return key
      }

      const translated = t(messageKey, params)
      return translated === messageKey ? key : translated
    },
    [messages, t],
  )
}

export const useGetToken = () => {
  const baseAssets = useAssets()

  return useCallback(
    address => {
      const _address = address?.toLowerCase() === zeroAddress.toLowerCase() ? 'BNB' : address

      const asset = baseAssets.find(it => it.address?.toLowerCase() === _address?.toLowerCase())

      return parseAsset(asset)
    },
    [baseAssets],
  )
}

export function useToken(address) {
  const getToken = useGetToken()
  return useMemo(() => getToken(address), [getToken, address])
}

export function useModule(swapType) {
  return useMemo(() => {
    if (swapType === SWAP_TYPES.STOP_LOSS) {
      return Module.STOP_LOSS
    }
    if (swapType === SWAP_TYPES.LIMIT) {
      return Module.LIMIT
    }
    if (swapType === SWAP_TYPES.TAKE_PROFIT) {
      return Module.TAKE_PROFIT
    }
    return Module.TWAP
  }, [swapType])
}

export const useCallbacks = refetchBalances => {
  const getToken = useGetToken()

  const onOrderCreated = useCallback(() => toast.success('Order created successfully'), [])

  const onSubmitOrderFailed = useCallback(error => toast.error(error?.message || 'Failed to create order'), [])

  const onSubmitOrderRejected = useCallback(() => toast.error('Order rejected'), [])

  const onOrderFilled = useCallback(
    order => {
      const srcToken = getToken(order.srcTokenAddress)
      const dstToken = getToken(order.dstTokenAddress)
      toast.success(`Order filled successfully ${srcToken?.symbol || ''} to ${dstToken?.symbol || ''}`)
    },
    [getToken],
  )

  const onOrdersProgressUpdate = useCallback(() => {
    refetchBalances?.()
  }, [refetchBalances])

  const onCancelOrderFailed = useCallback(error => toast.error(error?.message || 'Failed to cancel order'), [])
  const onCancelOrderSuccess = useCallback(() => toast.success('Order cancelled successfully'), [])

  return {
    onOrderCreated,
    onOrderFilled,
    onOrdersProgressUpdate,
    onSubmitOrderFailed,
    onSubmitOrderRejected,
    onCancelOrderFailed,
    onCancelOrderSuccess,
  }
}

export function useMarketReferencePrice(fromAmount, outAmount, quotePending) {
  return useMemo(
    () => ({
      isLoading: (!BN(fromAmount || '0').isZero() && !outAmount) || quotePending,
      value: outAmount,
      noLiquidity: !quotePending && !BN(fromAmount || '0').isZero() && !outAmount,
    }),
    [outAmount, fromAmount, quotePending],
  )
}

export function useWalletInteractions() {
  const { account } = useWallet()
  const currentChainId = useChainId()
  const t = useTranslations()
  const refetchBalances = useMutateAssets()
  const { networkId } = useChainSettings()

  return useMemo(() => {
    const runDexWrite = async ({ desc, contract, method, params = [], value = '0' }) => {
      const txHash = await writeCall(contract, method, params, value, networkId)
      if (!txHash) {
        throw new Error(`${desc} transaction failed`)
      }

      return txHash
    }

    return {
      wrapNativeToken: async amountWei => {
        const wbnbContract = getWBNBContract(currentChainId)
        if (!wbnbContract) throw new Error('Wrapped native token contract is unavailable')

        const txHash = await runDexWrite({
          desc: t('Wrap'),
          contract: wbnbContract,
          method: 'deposit',
          value: amountWei,
        })
        toast.success('Wrapped successfully')
        refetchBalances?.()
        return txHash
      },
      approveToken: async ({ tokenAddress, spenderAddress }) => {
        if (!spenderAddress) throw new Error('Approval spender is unavailable')

        const tokenContract = getERC20Contract(tokenAddress, currentChainId)
        if (!tokenContract) throw new Error('Token contract is unavailable')

        const txHash = await runDexWrite({
          contract: tokenContract,
          method: 'approve',
          params: [spenderAddress, maxUint256],
        })
        toast.success('Token approved successfully')
        return txHash
      },
      cancelOrder: async ({ contractAddress, args, abi }) => {
        const txHash = await runDexWrite({
          contract: { address: contractAddress, abi },
          method: 'cancel',
          params: args,
        })
        return txHash
      },
      signOrder: async ({ domain, types, primaryType, message, account: signingAccount }) => {
        const signer = signingAccount || account
        if (!signer) throw new Error('Wallet account is unavailable')
        const typedDataMessage = _TypedDataEncoder.getPayload(domain, types, message)

        const signature = await signCall({
          ...typedDataMessage,
          account: signer,
          primaryType: primaryType || typedDataMessage.primaryType,
        })
        return signature
      },
      getAllowance: async ({ tokenAddress, spenderAddress }) => {
        if (!account) return '0'

        const tokenContract = getERC20Contract(tokenAddress, currentChainId)
        if (!tokenContract) throw new Error('Token contract is unavailable')

        const allowance = await readCall(tokenContract, 'allowance', [account, spenderAddress], currentChainId)
        return allowance?.toString?.() || '0'
      },
    }
  }, [account, currentChainId, refetchBalances, t, networkId])
}
