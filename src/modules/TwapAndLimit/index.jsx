'use client'

/* THENA Dev */
/* eslint-disable simple-import-sort/imports */
import { useMemo } from 'react'
import { useChainId } from 'wagmi'
import { Partners, SpotProvider } from '@orbs-network/spot-react'

import useWallet from '@/hooks/useWallet'
import { useMutateAssets } from '@/context/assetsContext'
import { useSettings } from '@/state/settings/hooks'

import './index.css'
import { Portal } from './Portal'
import { TwapContextProvider } from './context'
import { OrdersModal } from './components/OrdersModal'
import { PoweredByOrbs } from './components/PoweredByOrbs'
import { SubmitOrderPanel } from './components/SubmitOrderPanel'
import { CustomInputs, Disclaimer, ErrorPanel, PricePanel } from './components/TradePanels'
import { PercentTabs, SwitchTokens, TokenPanel } from './components/TokenPanels'
import { useCallbacks, useMarketReferencePrice, useModule, useWalletInteractions } from './hooks'
import { getWeiBalanceFromAsset, parseAsset } from './utils'

export function Twap(props) {
  const { account } = useWallet()
  const chainId = useChainId()
  const { fromAsset, toAsset, swapType, fromAmount, outAmount, quotePending } = props
  const moduleType = useModule(swapType)
  const { priceProtection } = useSettings()
  const refetchBalances = useMutateAssets()
  const callbacks = useCallbacks(refetchBalances)
  const walletInteractions = useWalletInteractions()
  const marketReferencePrice = useMarketReferencePrice(fromAmount, outAmount, quotePending)

  const srcBalance = useMemo(() => getWeiBalanceFromAsset(fromAsset), [fromAsset])
  const dstBalance = useMemo(() => getWeiBalanceFromAsset(toAsset), [toAsset])
  const srcToken = useMemo(() => parseAsset(fromAsset), [fromAsset])
  const dstToken = useMemo(() => parseAsset(toAsset), [toAsset])

  return (
    <TwapContextProvider props={props} module={moduleType}>
      <SpotProvider
        partner={Partners.Thena}
        chainId={chainId}
        account={account || undefined}
        srcUsd1Token={fromAsset?.price?.toString?.()}
        dstUsd1Token={toAsset?.price?.toString?.()}
        srcBalance={srcBalance}
        dstBalance={dstBalance}
        srcToken={srcToken}
        dstToken={dstToken}
        marketReferencePrice={marketReferencePrice}
        module={moduleType}
        fees={0.25}
        priceProtection={priceProtection}
        minChunkSizeUsd={10}
        callbacks={callbacks}
        walletInteractions={walletInteractions}
        typedInputAmount={fromAmount}
      >
        <div className='flex w-full flex-col gap-2'>
          <PercentTabs />
          <div className='relative flex w-full flex-col gap-2'>
            <TokenPanel isSrcToken />
            <SwitchTokens />
            <TokenPanel isSrcToken={false} />
          </div>
          <PricePanel />
          <CustomInputs />
          <ErrorPanel />
        </div>
        <SubmitOrderPanel />
        <Disclaimer />
        <Portal container={() => document.getElementById('twap-orders') ?? undefined}>
          <div className='flex flex-col gap-8'>
            <OrdersModal />
            <PoweredByOrbs />
          </div>
        </Portal>
      </SpotProvider>
    </TwapContextProvider>
  )
}
