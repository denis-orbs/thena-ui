'use client'

/* THENA Dev */
/* eslint-disable simple-import-sort/imports */
import React, { createContext, useContext, useEffect, useMemo } from 'react'
import BN from 'bignumber.js'
import { useChainId, useWalletClient } from 'wagmi'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { Configs, Widget } from '@orbs-network/twap-ui'
import { zeroAddress } from 'viem'
import useWallet from '@/hooks/useWallet'
import TokenInput from '@/components/input/TokenInput'
import { EmphasisIconButton, TextIconButton } from '@/components/buttons/IconButton'
import Toggle from '@/components/toggle'
import './index.css'
import { EmphasisButton } from '@/components/buttons/Button'
import { useAssets } from '@/context/assetsContext'
import ConnectButton from '@/components/buttons/ConnectButton'
import Modal from '@/components/modal'
import Dropdown from '@/components/dropdown'
import CustomTooltip from '@/components/tooltip'
import CircleImage from '@/components/image/CircleImage'
import { toWei } from '@/utils/utils'

import SwitchHorizontalV2Icon from '~/svgs/switch-horizontal-01.svg'
import SwitchVerticalIcon from '~/svgs/switch-vertical.svg'
import InfoIcon from '@/icons/InfoIcon'

function OrderConfirmationModal({ isOpen, onClose, children }) {
  return (
    <Modal isOpen={isOpen} closeModal={onClose} width={480} title='Create Order'>
      <div className='mb-3 inline-flex w-full flex-col gap-4 px-6 py-3'>{children}</div>
    </Modal>
  )
}

function OrdersModal({ isOpen, onClose, children }) {
  return (
    <Modal isOpen={isOpen} closeModal={onClose} width={520} title='Orders'>
      <div className='mb-3 inline-flex w-full flex-col gap-4 px-6 py-3'>{children}</div>
    </Modal>
  )
}

function SelectMenu({ items, selected, onSelect }) {
  return (
    <Dropdown
      className='twap-select-menu'
      data={items.map(item => ({
        label: item.text,
        value: item.value,
        text: item.text,
      }))}
      selected={selected.text}
      setSelected={onSelect}
      placeHolder=''
    />
  )
}

function Tooltip({ tooltipText }) {
  return (
    <>
      <InfoIcon data-tooltip-id={tooltipText} />
      <CustomTooltip id={tooltipText} place='top' className='z-50 max-w-[320px]'>
        {tooltipText}
      </CustomTooltip>
    </>
  )
}

function useHiddenAssets() {
  const baseAssets = useAssets()
  return useMemo(() => baseAssets.filter(it => it.extended).map(it => it.address), [baseAssets])
}
const TwapContext = createContext({})

const useTwapContext = () => useContext(TwapContext)

function TokenPanel({ isSrcToken }) {
  const { input } = Widget.TokenPanel.usePanel({ isSrcToken })
  const { toAsset, fromAsset, setToAddress, setFromAddress } = useTwapContext()
  const hiddenAssets = useHiddenAssets()

  return (
    <TokenInput
      asset={isSrcToken ? fromAsset : toAsset}
      setAsset={asset => (isSrcToken ? setFromAddress(asset.address) : setToAddress(asset.address))}
      setOtherAsset={asset => (isSrcToken ? setToAddress(asset.address) : setFromAddress(asset.address))}
      otherAsset={isSrcToken ? toAsset : fromAsset}
      amount={input.value}
      setAmount={it => {
        input.onChange(typeof it === 'string' ? it : it.toString())
      }}
      autoFocus
      disabled={!isSrcToken}
      hiddenAssets={hiddenAssets}
    />
  )
}

function LimitPrice() {
  const { onInvert, isInverted, input, tokens, isLimitOrder } = Widget.LimitPrice.usePanel()
  const { fromAsset, toAsset, setFromAddress, setToAddress } = useTwapContext()
  const hiddenAssets = useHiddenAssets()

  if (!isLimitOrder) return null

  return (
    <div className='twap-limit-panel'>
      <div className='twap-limit-panel-header'>
        <div className='twap-limit-panel-header-left'>
          <p>When 1</p>
          <CircleImage src={tokens.topToken?.logoUrl} alt='token logo' width={24} height={24} />
          <p> {tokens.topToken?.symbol} is worth</p>
        </div>
        <TextIconButton onClick={onInvert} className='twap-limit-panel-invert-button' Icon={SwitchHorizontalV2Icon} />
      </div>

      <div className='twap-limit-panel-input-container'>
        <TokenInput
          className='twap-limit-panel-input'
          asset={isInverted ? fromAsset : toAsset}
          setAsset={asset => (isInverted ? setFromAddress(asset.address) : setToAddress(asset.address))}
          setOtherAsset={asset => (isInverted ? setToAddress(asset.address) : setFromAddress(asset.address))}
          otherAsset={isInverted ? toAsset : fromAsset}
          amount={input.value}
          setAmount={input.onChange}
          hiddenAssets={hiddenAssets}
          autoFocus
        />
        <Widget.LimitPrice.PercentSelector />
      </div>
    </div>
  )
}

function CustomToggle({ checked, onChange }) {
  return <Toggle checked={checked} onChange={onChange} label='' />
}

function Button({ children, onClick, disabled, isLoading }) {
  return (
    <EmphasisButton className='mt-3 w-full' onClick={onClick} disabled={disabled} isLoading={isLoading}>
      {children}
    </EmphasisButton>
  )
}

function useFilteredBaseAssets() {
  const baseAssets = useAssets()
  const hiddenAssets = useHiddenAssets()
  return useMemo(() => baseAssets.filter(it => !hiddenAssets.includes(it.address)), [baseAssets, hiddenAssets])
}

function parseAsset(asset) {
  if (!asset) return null

  return {
    address: asset.address === 'BNB' ? zeroAddress : asset.address,
    decimals: asset.decimals,
    symbol: asset.symbol,
    logoUrl: asset.logoURI,
  }
}

function getWeiBalanceFromAsset(asset) {
  if (!asset || !asset?.balance?.toString()) return null
  return toWei(asset.balance, asset.decimals).toString()
}
function useToken(address) {
  const baseAssets = useAssets()
  return useMemo(() => {
    const _address = address === zeroAddress ? 'BNB' : address
    const asset = baseAssets.find(it => it.address === _address)
    return parseAsset(asset)
  }, [baseAssets, address])
}

export function Twap({
  fromAsset,
  toAsset,
  setFromAddress,
  setToAddress,
  outAmount,
  setFromAmount,
  fromAmount,
  limit,
  updateSearchParams,
}) {
  const { account } = useWallet()
  const chainId = useChainId()
  const { data: walletClient } = useWalletClient()
  const { openConnectModal } = useConnectModal()
  const filteredBaseAssets = useFilteredBaseAssets()

  useEffect(() => {
    setFromAmount('1')
  }, [setFromAmount])

  const marketReferencePrice = useMemo(
    () => ({
      isLoading: !BN(fromAmount || '0').isZero() && !outAmount,
      value: outAmount,
    }),
    [fromAmount, outAmount],
  )

  useEffect(() => {
    if (fromAsset?.extended) {
      setFromAddress(filteredBaseAssets[0].address)
    }
    if (toAsset?.extended) {
      setToAddress(filteredBaseAssets[1].address)
    }
  }, [setFromAddress, filteredBaseAssets, setToAddress, toAsset?.extended, fromAsset?.extended])

  const srcToken = useMemo(() => parseAsset(fromAsset), [fromAsset])
  const dstToken = useMemo(() => parseAsset(toAsset), [toAsset])

  const contextValue = useMemo(
    () => ({
      toAsset,
      fromAsset,
      setToAddress,
      setFromAddress,
    }),
    [toAsset, fromAsset, setToAddress, setFromAddress],
  )

  return (
    <TwapContext.Provider value={contextValue}>
      <Widget
        config={Configs.Thena}
        provider={walletClient?.transport}
        chainId={chainId}
        callbacks={{
          onConnect: openConnectModal,
        }}
        account={account}
        useToken={useToken}
        srcUsd1Token={fromAsset?.price}
        dstUsd1Token={toAsset?.price}
        srcBalance={getWeiBalanceFromAsset(fromAsset)}
        dstBalance={getWeiBalanceFromAsset(toAsset)}
        srcToken={srcToken}
        dstToken={dstToken}
        marketReferencePrice={marketReferencePrice}
        isLimitPanel={limit}
        fee={0.25}
        components={{
          OrderConfirmationModal,
          Toggle: CustomToggle,
          Button,
          SelectMenu,
          Tooltip,
          OrdersModal,
        }}
      >
        <div className='relative flex w-full flex-col gap-2'>
          <Widget.PriceMode />
          <LimitPrice />
          <div className='relative flex w-full flex-col gap-2'>
            <TokenPanel isSrcToken />
            <EmphasisIconButton
              className='absolute top-0 right-0 bottom-0 left-0 z-10 m-auto'
              Icon={SwitchVerticalIcon}
              onClick={() => {
                updateSearchParams({
                  inputCurrency: toAsset.address,
                  outputCurrency: fromAsset.address,
                })
              }}
            />
            <TokenPanel isSrcToken={false} />
          </div>
          {limit ? (
            <Widget.Duration />
          ) : (
            <div className='twap-inputs'>
              <Widget.TradesAmount />
              <Widget.FillDelayPanel />
            </div>
          )}
          <Widget.TradeAmountMessage />
        </div>

        {!account ? <ConnectButton className='mt-3 w-full' /> : <Widget.ShowConfirmationButton />}
        <Widget.WarningMessage />
      </Widget>
    </TwapContext.Provider>
  )
}

export function Orders() {
  return <Widget.Orders />
}

export function PoweredByOrbs() {
  return <Widget.PoweredByOrbs />
}
