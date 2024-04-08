'use client'

import { redirect, useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'

import Tabs, { TabPanel } from '@/components/tabs'
import Contracts from '@/constant/contracts'
import { SizeTypes } from '@/constant/type'
import { useAssets } from '@/context/assetsContext'
import { useWrap } from '@/hooks/useSwap'
import { useTradingCompetitionLeaderBoard } from '@/hooks/useTradingCompetitionLeaderboard'
import useWallet from '@/lib/wallets/useWallet'
import { LeaderBoard } from '@/modules/TradingCompetition/LeaderBoard'
import { TradeHistory } from '@/modules/TradingCompetition/TradeHistory'
import { useChainSettings } from '@/state/settings/hooks'

import { SideBar } from './SideBar'
import TopBar from './TopBar'

function TradePage({ params }) {
  const t = useTranslations()
  const { account } = useWallet()

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

  const { competition } = useTradingCompetitionLeaderBoard(params.id)

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
        label: t('Trade History'),
        active: selectedTab === 'history',
        onClickHandler: () => {
          setSelectedTab('history')
        },
      },
    ],
    [selectedTab, t],
  )

  useEffect(() => {
    if (!account) {
      return redirect('/')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!account) {
    return null
  }

  return (
    <div>
      <TopBar />

      <SideBar
        fromAsset={fromAsset}
        toAsset={toAsset}
        setFromAddress={setFromAddress}
        setToAddress={setToAddress}
        isWrap={isWrap}
        isUnwrap={isUnwrap}
        onWrap={onWrap}
        onUnwrap={onUnwrap}
        wrapPending={wrapPending}
      >
        <div className='mt-10 flex w-full flex-col gap-4'>
          <Tabs
            data={subTabs}
            size={SizeTypes.Small}
            itemClassName='text-sm'
            className='justify-start overflow-x-auto'
          />
          <TabPanel value='leaderboard' select={selectedTab}>
            <LeaderBoard competition={competition} />
          </TabPanel>
          <TabPanel value='history' select={selectedTab}>
            <TradeHistory />
          </TabPanel>
        </div>
      </SideBar>
    </div>
  )
}

export default TradePage
