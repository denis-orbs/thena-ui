'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { ChainId } from 'thena-sdk-core'
import { useBalance } from 'wagmi'

import { SWAP_TYPES } from '@/constant'
import Contracts from '@/constant/contracts'
import { useAssets } from '@/context/assetsContext'
import { LOCAL_STORAGE_TOKENS, useLocalStorage } from '@/hooks/useLocalStorage'
import { useWrap } from '@/hooks/useSwap'
import useWallet from '@/hooks/useWallet'
import { fromWei } from '@/lib/utils'
import { useChainSettings } from '@/state/settings/hooks'

import SwapBest from './SwapBest'
import SwapFusion from './SwapFusion'

export default function SwapPage() {
  const [fromAsset, setFromAsset] = useState(null)
  const [toAsset, setToAsset] = useState(null)

  const searchParams = useSearchParams()
  const inputCurrency = searchParams.get('inputCurrency')
  const outputCurrency = searchParams.get('outputCurrency')

  const [swapType, setSwapType] = useState(searchParams.get('swapType') || SWAP_TYPES.SWAP)
  const { networkId } = useChainSettings()
  const { push, replace } = useRouter()
  const assets = useAssets()
  const { onWrap, onUnwrap, pending: wrapPending } = useWrap()
  const { getWithExpiry } = useLocalStorage()
  const { account, chainId } = useWallet()

  const { data: tokenFromBalance } = useBalance({
    token: fromAsset?.address ?? '',
    address: account,
    chainId,
    query: {
      enabled: Boolean(fromAsset?.isFromStorage && account),
    },
  })

  const { data: tokenToBalance } = useBalance({
    token: toAsset?.address ?? '',
    chainId,
    address: account,
    query: {
      enabled: Boolean(toAsset?.isFromStorage && account),
    },
  })

  const { from, to } = useMemo(() => {
    if (!assets || !assets.length) return { from: null, to: null }

    const temp = getWithExpiry(LOCAL_STORAGE_TOKENS) ?? []
    const assetList = assets.concat(temp.map(tk => ({ ...tk, price: 0, balance: 0 })))

    const fromCurrency = inputCurrency
      ? assetList.find(asset => asset.address.toLowerCase() === inputCurrency.toLowerCase())
      : null

    const toCurrency = outputCurrency
      ? assetList.find(asset => asset.address.toLowerCase() === outputCurrency.toLowerCase())
      : null

    return {
      from: fromCurrency,
      to: toCurrency,
    }
  }, [assets, getWithExpiry, inputCurrency, outputCurrency])

  useEffect(() => {
    let fromAddress = 'BNB'
    let toAddress = 'BNB'

    if (inputCurrency && outputCurrency) {
      fromAddress = inputCurrency
      toAddress = outputCurrency
    } else if (inputCurrency && !outputCurrency) {
      fromAddress = inputCurrency
    } else if (!inputCurrency && outputCurrency) {
      toAddress = outputCurrency
    } else {
      fromAddress = 'BNB'
      toAddress = Contracts.THE[networkId]
    }

    push(`/swap?inputCurrency=${fromAddress}&outputCurrency=${toAddress}&swapType=${swapType}`)
  }, [inputCurrency, networkId, outputCurrency, push, swapType])

  useEffect(() => {
    const fromBalance = tokenFromBalance?.value
    if (from) {
      setFromAsset({
        ...from,
        balance: fromBalance ? fromWei(fromBalance, from.decimals) : from.balance,
      })
    }
  }, [from, tokenFromBalance?.value])

  useEffect(() => {
    const toBalance = tokenToBalance?.value

    if (to) {
      setToAsset({
        ...to,
        balance: toBalance ? fromWei(toBalance, to.decimals) : to.balance,
      })
    }
  }, [to, tokenToBalance?.value])

  const isWrap = useMemo(() => {
    if (
      fromAsset &&
      toAsset &&
      fromAsset.address === 'BNB' &&
      toAsset.address.toLowerCase() === Contracts.WBNB[fromAsset.chainId].toLowerCase()
    ) {
      return true
    }
    return false
  }, [fromAsset, toAsset])

  const isUnwrap = useMemo(() => {
    if (
      fromAsset &&
      toAsset &&
      toAsset.address === 'BNB' &&
      fromAsset.address.toLowerCase() === Contracts.WBNB[fromAsset.chainId].toLowerCase()
    ) {
      return true
    }
    return false
  }, [fromAsset, toAsset])

  const updateSearchParams = updates => {
    const params = new URLSearchParams(searchParams.toString())

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null) {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    })

    const newPathname = `${window.location.pathname}?${params.toString()}`
    replace(newPathname)
  }
  return (
    <div className='flex w-full flex-col items-center gap-6 lg:flex-row lg:items-start 2xl:gap-10'>
      {networkId === ChainId.BSC && (
        <SwapBest
          fromAsset={fromAsset}
          toAsset={toAsset}
          updateSearchParams={updateSearchParams}
          isWrap={isWrap}
          isUnwrap={isUnwrap}
          onWrap={onWrap}
          onUnwrap={onUnwrap}
          wrapPending={wrapPending}
          setSwapType={setSwapType}
          swapType={swapType}
        />
      )}
      {networkId === ChainId.OPBNB && (
        <SwapFusion
          fromAsset={fromAsset}
          toAsset={toAsset}
          updateSearchParams={updateSearchParams}
          isWrap={isWrap}
          isUnwrap={isUnwrap}
          onWrap={onWrap}
          onUnwrap={onUnwrap}
          wrapPending={wrapPending}
        />
      )}
    </div>
  )
}
