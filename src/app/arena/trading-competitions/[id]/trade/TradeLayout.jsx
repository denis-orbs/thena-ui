'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'
import { ChainId } from 'thena-sdk-core'

import SwapBest from '@/app/swap/SwapBest'
import SwapFusion from '@/app/swap/SwapFusion'
import Tabs from '@/components/tabs'
import Contracts from '@/constant/contracts'
import { SizeTypes } from '@/constant/type'
import { useAssets } from '@/context/assetsContext'
import { useWrap } from '@/hooks/useSwap'
import { useChainSettings } from '@/state/settings/hooks'

import TopBar from './TopBar'

function TradeLayout({ children, params }) {
  const t = useTranslations()

  const [fromAsset, setFromAsset] = useState(null)
  const [toAsset, setToAsset] = useState(null)
  const [fromAddress, setFromAddress] = useState(null)
  const [toAddress, setToAddress] = useState(null)
  const { networkId } = useChainSettings()
  const searchParams = useSearchParams()
  const { push } = useRouter()
  const assets = useAssets()
  const { onWrap, onUnwrap, pending: wrapPending } = useWrap()
  const [selectedTab, setSelectedTab] = useState('leaderboard')

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
    push(`/arena/trading-competitions/${params.id}/trade?inputCurrency=${fromAddress}&outputCurrency=${toAddress}`)
  }, [push, fromAddress, toAddress, params.id])

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

  const subTabs = useMemo(
    () => [
      {
        label: t('Leaderboard'),
        active: selectedTab === 'leaderboard',
        onClickHandler: () => {
          setSelectedTab('leaderboard')
        },
      },
      {
        label: t('Trade history'),
        active: selectedTab === 'history',
        onClickHandler: () => {
          setSelectedTab('history')
        },
      },
    ],
    [selectedTab, t],
  )

  return (
    <div>
      <TopBar />
      <div>
        <div className='flex w-full flex-col items-center gap-10 lg:flex-row-reverse lg:items-start'>
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
      </div>
      <div className='mt-10 flex w-full flex-col gap-4'>
        <Tabs data={subTabs} size={SizeTypes.Small} itemClassName='text-sm' className='justify-start overflow-x-auto' />
        {children}
      </div>
    </div>
  )
}

export default TradeLayout
