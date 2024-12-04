'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { ChainId } from 'thena-sdk-core'

import { SWAP_TYPES } from '@/constant'
import Contracts from '@/constant/contracts'
import { useAssets } from '@/context/assetsContext'
import { LOCAL_STORAGE_TOKENS, useLocalStorage } from '@/hooks/useLocalStorage'
import { useWrap } from '@/hooks/useSwap'
import { useChainSettings } from '@/state/settings/hooks'

import SwapBest from './SwapBest'
import SwapFusion from './SwapFusion'

export default function SwapPage() {
  const [fromAsset, setFromAsset] = useState(null)
  const [toAsset, setToAsset] = useState(null)
  const [fromAddress, setFromAddress] = useState(null)
  const [toAddress, setToAddress] = useState(null)
  const searchParams = useSearchParams()
  const [swapType, setSwapType] = useState(searchParams.get('swapType') || SWAP_TYPES.SWAP)
  const { networkId } = useChainSettings()
  const { push } = useRouter()
  const assets = useAssets()
  const { onWrap, onUnwrap, pending: wrapPending } = useWrap()
  const { getWithExpiry } = useLocalStorage()

  useEffect(() => {
    if (!assets || !assets.length) return
    const temp = getWithExpiry(LOCAL_STORAGE_TOKENS) ?? []
    const assetList = assets.concat(temp.map(tk => ({ ...tk, price: 0, balance: 0 })))

    const inputCurrency = searchParams.get('inputCurrency')
    const outputCurrency = searchParams.get('outputCurrency')

    const from = inputCurrency
      ? assetList.find(asset => asset.address.toLowerCase() === inputCurrency.toLowerCase())
      : null

    const to = outputCurrency
      ? assetList.find(asset => asset.address.toLowerCase() === outputCurrency.toLowerCase())
      : null

    if (from && to) {
      setFromAsset(from)
      setToAsset(to)
      if (!fromAddress) setFromAddress(from.address)
      if (!toAddress) setToAddress(to.address)
    } else if (!from && to) {
      setFromAddress('BNB')
    } else if (from && from.address !== 'BNB' && !to) {
      setToAddress('BNB')
    } else {
      setFromAddress('BNB')
      setToAddress(Contracts.THE[networkId])
    }

    push(`/swap?inputCurrency=${fromAddress}&outputCurrency=${toAddress}&swapType=${swapType}`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assets, searchParams, fromAddress, toAddress, networkId, push, swapType])

  // useEffect(() => {
  // if (!fromAddress || !toAddress) {
  //   if (swapType) {
  //     push(`/swap?swapType=${swapType}`)
  //   }
  //   return
  // }
  //   push(`/swap?inputCurrency=${fromAddress}&outputCurrency=${toAddress}&swapType=${swapType}`)
  // }, [push, fromAddress, toAddress, swapType])

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

  return (
    <div className='flex w-full flex-col items-center gap-6 lg:flex-row lg:items-start 2xl:gap-10'>
      {networkId === ChainId.BSC && (
        <SwapBest
          fromAsset={fromAsset}
          toAsset={toAsset}
          setFromAddress={setFromAddress}
          setToAddress={setToAddress}
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
          setFromAddress={setFromAddress}
          setToAddress={setToAddress}
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
