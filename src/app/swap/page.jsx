'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { ChainId } from 'thena-sdk-core'

import Contracts from '@/constant/contracts'
import { useAssets } from '@/context/assetsContext'
import { useWrap } from '@/hooks/useSwap'
import { useChainSettings } from '@/state/settings/hooks'

import SwapBest from './SwapBest'
import SwapFusion from './SwapFusion'

export default function SwapPage() {
  const [fromAsset, setFromAsset] = useState(null)
  const [toAsset, setToAsset] = useState(null)
  const [fromAddress, setFromAddress] = useState(null)
  const [toAddress, setToAddress] = useState(null)
  const { networkId } = useChainSettings()
  const searchParams = useSearchParams()
  const { push } = useRouter()
  const assets = useAssets()
  const { onWrap, onUnwrap, pending: wrapPending } = useWrap()

  useEffect(() => {
    if (!assets || !assets.length) return
    const inputCurrency = searchParams.get('inputCurrency')
    const outputCurrency = searchParams.get('outputCurrency')
    const from = inputCurrency
      ? assets.find(asset => asset.address.toLowerCase() === inputCurrency.toLowerCase())
      : null
    const to = outputCurrency
      ? assets.find(asset => asset.address.toLowerCase() === outputCurrency.toLowerCase())
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
  }, [assets, searchParams, fromAddress, toAddress, networkId])

  useEffect(() => {
    if (!fromAddress || !toAddress) return
    push(`/swap?inputCurrency=${fromAddress}&outputCurrency=${toAddress}`)
  }, [push, fromAddress, toAddress])

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
    <div className='flex w-full flex-col items-center gap-10 lg:flex-row lg:items-start'>
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
