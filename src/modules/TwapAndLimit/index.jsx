'use client'

/* THENA Dev */
/* eslint-disable simple-import-sort/imports */
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import BN from 'bignumber.js'
import { useChainId, useWalletClient } from 'wagmi'
import {
  Components,
  DEFAULT_DURATION_OPTIONS,
  DISCLAIMER_URL,
  Module,
  ORBS_LOGO,
  ORBS_WEBSITE_URL,
  Partners,
  SpotProvider,
  useDisclaimerPanel,
  useDstTokenPanel,
  useDurationPanel,
  useFillDelayPanel,
  useInputErrors,
  useInvertTradePanel,
  useLimitPricePanel,
  useOrderHistoryPanel,
  useSubmitOrderButton,
  useSubmitOrderPanel,
  useTradesPanel,
  useTriggerPricePanel,
} from '@orbs-network/spot-react'
import { zeroAddress } from 'viem'
import { toast } from 'react-toastify'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import useWallet from '@/hooks/useWallet'
import TokenInput from '@/components/input/TokenInput'
import InfoIcon from '@/icons/InfoIcon'
import SwitchVerticalIcon from '~/svgs/switch-vertical.svg'
import SwitchHorizontalV2Icon from '~/svgs/switch-horizontal-01.svg'
import TrashIcon from '~/svgs/trash.svg'
import CheckCircle from '~/svgs/checkCircle.svg'
import ArrowRight from '~/svgs/arrow-right.svg'
import WarningTriangleIcon from '~/svgs/warning-triangle.svg'
import { EmphasisIconButton, TextIconButton } from '@/components/buttons/IconButton'
import './index.css'
import { EmphasisButton, ErrorButton, OutlinedButton, PrimaryButton } from '@/components/buttons/Button'
import { useAssets, useMutateAssets } from '@/context/assetsContext'
import Modal from '@/components/modal'
import Dropdown from '@/components/dropdown'
import CustomTooltip from '@/components/tooltip'
import ConnectButton from '@/components/buttons/ConnectButton'
import Toggle from '@/components/toggle'
import LabelTooltip from '@/components/label/LabelTooltip'
import { SWAP_TYPES } from '@/constant'
import { useSettings } from '@/state/settings/hooks'
import Tabs from '@/components/tabs'
import { formatAmount, toWei } from '@/utils/utils'
import cn from '@/utils/classes'
import Spinner from '@/components/spinner'

const TwapContext = createContext({})

const useTwapContext = () => useContext(TwapContext)

function TwapContextProvider({ props, module, children }) {
  const value = useMemo(() => ({ ...props, module }), [props, module])
  return <TwapContext.Provider value={value}>{children}</TwapContext.Provider>
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

function Portal({ children, container }) {
  if (typeof document === 'undefined') return null // SSR safe

  const el = typeof container === 'function' ? container() : container
  return createPortal(children, el ?? document.body)
}

function SelectMenu({ items, selected, onSelect }) {
  return (
    <Dropdown
      className='twap-select-menu'
      listClassNames='twap-select-menu-portal'
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

function Tooltip({ tooltipText, children }) {
  return (
    <>
      {children ? (
        <div data-tooltip-id={tooltipText}>{children}</div>
      ) : (
        <InfoIcon className='h-4 w-4 stroke-neutral-400' data-tooltip-id={tooltipText} />
      )}
      <CustomTooltip id={tooltipText} place='top' className='z-50 max-w-[320px]'>
        <p className='break-words'>{tooltipText}</p>
      </CustomTooltip>
    </>
  )
}

function InputContainer({ children, error, className }) {
  return (
    <div
      className={cn(
        'twap-input-container flex items-center justify-between gap-2 rounded-lg border border-transparent bg-neutral-600 px-3 py-2',
        error && 'border-error-600',
        className,
      )}
    >
      {children}
    </div>
  )
}

function TokenPanel({ isSrcToken }) {
  const { value: dstAmount } = useDstTokenPanel()
  const { toAsset, fromAsset, setToAddress, setFromAddress, setFromAmount, fromAmount } = useTwapContext()

  return (
    <TokenInput
      asset={isSrcToken ? fromAsset : toAsset}
      setAsset={asset => (isSrcToken ? setFromAddress(asset.address) : setToAddress(asset.address))}
      setOtherAsset={asset => (isSrcToken ? setToAddress(asset.address) : setFromAddress(asset.address))}
      otherAsset={isSrcToken ? toAsset : fromAsset}
      amount={isSrcToken ? fromAmount : dstAmount || ''}
      readOnly={!isSrcToken}
      setAmount={it => {
        setFromAmount(typeof it === 'string' ? it : it.toString())
      }}
      autoFocus
      disabled={!isSrcToken}
      showExtendedTokens
    />
  )
}

function PricePanel() {
  const { isWrap, isUnwrap } = useTwapContext()
  const { fromToken, onInvert, isInverted } = useInvertTradePanel()

  if (isWrap || isUnwrap) return null

  return (
    <>
      <div className='twap-section flex flex-col gap-1'>
        <div className='flex flex-row items-center justify-between gap-2'>
          <p className='text-[14px] font-medium'>
            {isInverted ? 'Buy' : 'Sell'} {fromToken?.symbol} at rate
          </p>
          <TextIconButton onClick={onInvert} Icon={SwitchHorizontalV2Icon} />
        </div>
        <div className='flex flex-col gap-4'>
          <TriggerPrice />
          <LimitPrice />
        </div>
      </div>
    </>
  )
}

function PriceContainer({ error, symbol, onChange, price, usd, className }) {
  return (
    <InputContainer error={Boolean(error)} className={cn('flex-1', className)}>
      <p className='text-[16px] font-bold'>{symbol}</p>
      <div className='flex flex-1 flex-col items-end gap-0'>
        <Input onChange={onChange} value={price} className='w-full text-right text-[19px]' error={Boolean(error)} />
        <p className='text-[11px] opacity-50'>${formatAmount(usd)}</p>
      </div>
    </InputContainer>
  )
}

function PercentageContainer({ error, onChange, value, className }) {
  return (
    <InputContainer error={Boolean(error)} className={cn('w-[100px] gap-0', className)}>
      <PercentageInput onChange={onChange} value={value} className='flex-1 text-center' />
      <p className='text-[18px]'>%</p>
    </InputContainer>
  )
}

function LimitPrice() {
  const {
    price,
    onChange,
    toToken,
    onPercentageChange,
    percentage,
    usd,
    toggleLimitPrice,
    isLimitPrice,
    error,
    warning,
    tooltip,
    label,
    onReset,
  } = useLimitPricePanel()

  const { module } = useTwapContext()

  if (module === Module.TAKE_PROFIT) return null

  return (
    <div className='flex flex-col gap-2'>
      <div className='flex items-center justify-between gap-2'>
        <div className='flex flex-1 flex-row items-center justify-between gap-1'>
          <div className='flex items-center gap-1'>
            {module !== Module.LIMIT && <Toggle checked={isLimitPrice} onChange={toggleLimitPrice} />}
            <Label tooltip={tooltip} text={label} />
          </div>
          {isLimitPrice && <DefaultButton onClick={onReset} />}
        </div>
      </div>
      {isLimitPrice ? (
        <div className='flex w-full flex-row items-stretch justify-between gap-3'>
          <PriceContainer
            error={Boolean(error)}
            symbol={toToken?.symbol}
            onChange={onChange}
            price={price}
            usd={usd}
            className='flex-1'
          />
          <PercentageContainer
            error={Boolean(error)}
            onChange={onPercentageChange}
            value={percentage}
            className='w-[100px] gap-0'
          />
        </div>
      ) : warning ? (
        <div className='flex items-start gap-2 rounded-lg bg-neutral-800 p-2'>
          <InfoIcon className='h-4 w-4 stroke-neutral-300' />
          <p className='flex-1 text-[12px] font-medium text-neutral-300'>
            {warning.text}{' '}
            <a href={warning.url} target='_blank' rel='noopener noreferrer' className='text-primary-600'>
              Learn more
            </a>
          </p>
        </div>
      ) : null}
    </div>
  )
}

function Label({ tooltip, text }) {
  return (
    <LabelTooltip
      tooltip={tooltip}
      label={text}
      id={text}
      showInfoIcon
      className='text-[14px] font-medium'
      translate={false}
    />
  )
}

function Disclaimer() {
  const disclaimer = useDisclaimerPanel()
  const { isWrap, isUnwrap } = useTwapContext()

  if (!disclaimer || isWrap || isUnwrap) return null

  return (
    <div className='twap-section mt-3 text-sm text-neutral-300'>
      <div className='flex flex-row items-start gap-2'>
        <InfoIcon className='relative top-1 h-4 w-4 stroke-neutral-400' />
        <p className='flex-1 text-sm text-neutral-300'>
          {disclaimer.text}
          <a href={disclaimer.url} target='_blank' rel='noopener noreferrer' className='ml-1 underline'>
            Link.
          </a>
        </p>
      </div>
    </div>
  )
}

function TradesPanel() {
  const { onChange, totalTrades, error, label, tooltip, fromToken, amountPerTrade } = useTradesPanel()

  return (
    <div className='flex w-full flex-col'>
      <div className='flex items-center justify-between gap-2'>
        <Label tooltip={tooltip} text={label} />
        <p className='text-right text-[13px] text-neutral-300'>
          {amountPerTrade} {fromToken?.symbol} per trade
        </p>
      </div>
      <InputContainer error={Boolean(error)} className='flex-1'>
        <Input
          placeholder='0'
          onChange={it => onChange(Number(it))}
          value={totalTrades}
          className='flex-1 text-left text-[17px]'
          error={Boolean(error)}
        />
        <p className='text-[13px] text-neutral-300'>Trades</p>
      </InputContainer>
    </div>
  )
}

function FillDelayPanel() {
  const { onInputChange, onUnitSelect, fillDelay, error, label, tooltip } = useFillDelayPanel()

  return (
    <div className='flex w-full flex-col'>
      <Label tooltip={tooltip} text={label} />
      <InputContainer error={Boolean(error)} className='flex-1'>
        <Input
          onChange={it => onInputChange(Number(it))}
          value={fillDelay.value}
          className='w-full text-left text-[17px]'
          error={Boolean(error)}
          placeholder='0'
        />
        <SelectMenu
          items={DEFAULT_DURATION_OPTIONS}
          selected={DEFAULT_DURATION_OPTIONS.find(it => it.value === fillDelay.unit)}
          onSelect={it => {
            onUnitSelect(it.value)
          }}
        />
      </InputContainer>
    </div>
  )
}

function DurationPanel() {
  const { onInputChange, onUnitSelect, duration, error, label, tooltip } = useDurationPanel()
  return (
    <div className='flex w-full flex-col'>
      <Label tooltip={tooltip} text={label} />
      <InputContainer error={Boolean(error)} className='flex-1'>
        <Input
          onChange={it => onInputChange(Number(it))}
          value={duration.value}
          className='w-full text-left text-[17px]'
          error={Boolean(error)}
          placeholder='0'
        />
        <SelectMenu
          items={DEFAULT_DURATION_OPTIONS}
          selected={DEFAULT_DURATION_OPTIONS.find(it => it.value === duration.unit)}
          onSelect={it => {
            onUnitSelect(it.value)
          }}
        />
      </InputContainer>
    </div>
  )
}
function CustomInputs() {
  const { module, isWrap, isUnwrap } = useTwapContext()

  if (isWrap || isUnwrap) return null

  if (module === Module.TWAP) {
    return (
      <div className='twap-section gap-5'>
        <TradesPanel />
        <FillDelayPanel />
      </div>
    )
  }

  return (
    <div className='twap-section'>
      <DurationPanel />
    </div>
  )
}

function DefaultButton({ onClick, className }) {
  const t = useTranslations()
  return (
    <div className={cn('text-primary-600 ml-auto w-fit cursor-pointer text-sm', className)} onClick={onClick}>
      {t('setToDefault')}
    </div>
  )
}

function TriggerPrice() {
  const { price, onChange, toToken, onPercentageChange, percentage, usd, error, onSetDefault, label, tooltip } =
    useTriggerPricePanel()

  const { module } = useTwapContext()

  if (module !== Module.STOP_LOSS && module !== Module.TAKE_PROFIT) return null

  return (
    <>
      <div className='twap-limit-panel'>
        <div className='flex items-center justify-between gap-2'>
          <Label tooltip={tooltip} text={label} />
          <DefaultButton onClick={onSetDefault} className='mb-2' />
        </div>

        <div className='flex w-full flex-row items-stretch justify-between gap-3'>
          <PriceContainer
            error={Boolean(error)}
            symbol={toToken?.symbol}
            onChange={onChange}
            price={price}
            usd={usd}
            className='flex-1'
          />

          <PercentageContainer
            error={Boolean(error)}
            onChange={onPercentageChange}
            value={percentage}
            className='w-[100px] gap-0'
          />
        </div>
      </div>
    </>
  )
}

function Input({ onChange, value, max = 100, placeholder = '0.0', className }) {
  return (
    <input
      type='number'
      className={cn(
        'w-full border-1 border-transparent bg-transparent p-0 text-lg text-neutral-50 placeholder-neutral-400',
        className,
      )}
      placeholder={placeholder}
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      max={max}
      min={0}
      inputMode='decimal'
    />
  )
}

function PercentageInput({ onChange, value, className }) {
  return <Input value={value} onChange={onChange} max={100} className={`${className} text-[20px]`} />
}

function Button({ children, onClick, disabled, loading }) {
  return (
    <EmphasisButton className='mt-3 w-full' onClick={onClick} disabled={disabled} isLoading={loading}>
      {children}
    </EmphasisButton>
  )
}

const useGetToken = () => {
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

function useToken(address) {
  const getToken = useGetToken()
  return useMemo(() => getToken(address), [getToken, address])
}

function OrderHistoryCancelOrdersButtons() {
  const { cancelOrdersMode, onToggleCancelOrdersMode, ordersToCancel, onCancelOrders, isCancelOrdersLoading, orders } =
    useOrderHistoryPanel()

  const onCancel = useCallback(
    async selectedOrders => {
      try {
        await onCancelOrders(selectedOrders)
        toast.success(`${selectedOrders.length} orders cancelled successfully`)
        onToggleCancelOrdersMode(false)
      } catch (error) {
        toast.error('Failed to cancel orders')
      }
    },
    [onCancelOrders, onToggleCancelOrdersMode],
  )

  if (!orders?.open?.length) return null

  if (cancelOrdersMode) {
    return (
      <div
        className='flex items-stretch gap-2'
        style={{ opacity: isCancelOrdersLoading ? 0.5 : 1, pointerEvents: isCancelOrdersLoading ? 'none' : 'auto' }}
      >
        <PrimaryButton className='p-2' onClick={() => onToggleCancelOrdersMode(!cancelOrdersMode)}>
          <CheckCircle className='h-4 w-4 stroke-white' />
          <p className='text-[12px] text-white'>Close</p>
        </PrimaryButton>
        {ordersToCancel.length ? (
          <ErrorButton className='p-2' onClick={() => onCancel(ordersToCancel)}>
            <TrashIcon className='h-4 w-4 stroke-white' />
            <p className='text-[12px] text-white'>Cancel ({ordersToCancel.length})</p>
          </ErrorButton>
        ) : (
          <ErrorButton className='p-2' onClick={() => onCancel(orders.open)}>
            <TrashIcon className='h-4 w-4 stroke-white' />
            <p className='text-[12px] text-white'>Cancel All</p>
          </ErrorButton>
        )}
      </div>
    )
  }

  return (
    <div>
      <OutlinedButton className='p-2' onClick={() => onToggleCancelOrdersMode(!cancelOrdersMode)}>
        <CheckCircle className='h-4 w-4 stroke-white' />
        <p className='text-sm text-white'>Select</p>
      </OutlinedButton>
    </div>
  )
}

function OrdersModal() {
  const { onHideSelectedOrder, selectedOrder, statuses, selectedStatus, onSelectStatus } = useOrderHistoryPanel()
  const [isOpen, setIsOpen] = useState(false)
  const onOpenModal = useCallback(() => {
    setIsOpen(true)
  }, [])
  const onCloseModal = useCallback(() => {
    setIsOpen(false)
  }, [])

  const onSelect = useCallback(item => onSelectStatus(item?.value), [onSelectStatus])

  return (
    <>
      <Modal
        onClickHandler={onHideSelectedOrder}
        isBack={Boolean(selectedOrder)}
        isOpen={Boolean(isOpen)}
        closeModal={onCloseModal}
        width={520}
        isIntl
        title={selectedOrder ? selectedOrder.title : 'Orders'}
        fontSizeTitle='text-xl lg:text-2xl'
      >
        <div className='twap-orders-modal mb-3 inline-flex w-full flex-col gap-4 px-6 py-3'>
          {!selectedOrder && (
            <div className='flex items-center justify-between'>
              <SelectMenu
                items={statuses}
                selected={statuses.find(it => it.value === selectedStatus)}
                onSelect={onSelect}
              />
              <OrderHistoryCancelOrdersButtons />
            </div>
          )}
          <Components.Orders />
        </div>
      </Modal>
      <OutlinedButton onClick={onOpenModal} className='mt-3 w-full'>
        <div className='flex w-full items-center justify-between gap-2'>
          <p className='text-sm text-white'>View Orders</p>
          <ArrowRight className='h-4 w-4 text-white' />
        </div>
      </OutlinedButton>
    </>
  )
}

function getWeiBalanceFromAsset(asset) {
  if (!asset || !asset?.balance?.toString()) return null
  return toWei(asset.balance, asset.decimals).toString()
}

function ShowConfirmationButton({ onClick }) {
  const { text, disabled: _disabled } = useSubmitOrderButton()
  const { account } = useWallet()
  const { quotePending, isWrap, isUnwrap, wrapPending, onWrap, onUnwrap, fromAmount } = useTwapContext()

  const button = useMemo(() => {
    if (isWrap) {
      return {
        text: 'Wrap',
        onClick: () => onWrap(fromAmount),
      }
    }
    if (isUnwrap) {
      return {
        text: 'Unwrap',
        onClick: () => onUnwrap(fromAmount),
      }
    }
    return {
      text: quotePending ? 'Fetching quotes' : text,
      onClick: () => onClick(),
    }
  }, [isWrap, isUnwrap, quotePending, text, onWrap, fromAmount, onUnwrap, onClick])

  if (!account) {
    return <ConnectButton className='mt-3 w-full' />
  }

  const disabled = quotePending || _disabled || wrapPending

  return (
    <PrimaryButton
      className={`mt-3 w-full ${disabled ? 'opacity-50' : ''}`}
      onClick={disabled ? undefined : button.onClick}
    >
      {button.text}
    </PrimaryButton>
  )
}

function SubmitOrderPanel() {
  const { onCloseModal, onOpenModal, onSubmit, status, allowanceLoading } = useSubmitOrderPanel()

  const [disclaimerAccepted, setDisclaimerAccepted] = useState(true)
  const [isOpen, setIsOpen] = useState(false)

  const onOpen = useCallback(() => {
    onOpenModal()
    setIsOpen(true)
  }, [onOpenModal])

  const onClose = useCallback(() => {
    onCloseModal()
    setIsOpen(false)
  }, [onCloseModal])

  return (
    <>
      <Modal isOpen={isOpen} closeModal={onClose} width={480} title={status ? '' : 'Create Order'}>
        <div className='mb-3 inline-flex w-full flex-col gap-4 px-6 py-3'>
          <Components.SubmitOrderPanel
            reviewDetails={
              <div className='mt-3 flex flex-col gap-0'>
                <div className='flex items-center justify-between gap-2 rounded-lg bg-neutral-800 p-2'>
                  <p className='text-sm font-medium text-neutral-300'>
                    Accept{' '}
                    <a href={DISCLAIMER_URL} target='_blank' rel='noopener noreferrer' className='text-primary-600'>
                      Disclaimer
                    </a>
                  </p>
                  <Toggle checked={disclaimerAccepted} onChange={() => setDisclaimerAccepted(!disclaimerAccepted)} />
                </div>
                <PrimaryButton
                  disabled={!disclaimerAccepted || allowanceLoading}
                  className={`mt-3 w-full ${!disclaimerAccepted ? 'opacity-50' : ''}`}
                  onClick={onSubmit}
                >
                  {allowanceLoading ? <Spinner /> : 'Confirm Order'}
                </PrimaryButton>
              </div>
            }
          />
        </div>
      </Modal>
      <ShowConfirmationButton onClick={onOpen} />
    </>
  )
}

function PoweredByOrbs() {
  return (
    <a
      href={ORBS_WEBSITE_URL}
      target='_blank'
      rel='noopener noreferrer'
      className='flex items-center justify-center gap-2'
    >
      <p className='text-[14px] font-medium text-white'>Powered by Orbs</p>
      <Image src={ORBS_LOGO} alt='Orbs' width={22} height={22} />
    </a>
  )
}

function ErrorPanel() {
  const { isWrap, isUnwrap } = useTwapContext()
  const error = useInputErrors()
  if (!error || isWrap || isUnwrap) return null
  return (
    <div className='text-error-600 flex items-center gap-2 text-sm'>
      <WarningTriangleIcon className='stroke-error-600 h-4 w-4' />
      <p className='text-error-600 text-sm'>{error.message}</p>
    </div>
  )
}

function useModule(swapType) {
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

const useCallbacks = () => {
  const getToken = useGetToken()
  const onCancelOrderSuccess = useCallback(orders => {
    toast.success(`${orders.length} orders cancelled successfully`)
  }, [])

  const onOrderFilled = useCallback(
    order => {
      const srcToken = getToken(order.srcTokenAddress)
      const dstToken = getToken(order.dstTokenAddress)
      toast.success(`Order filled successfully ${srcToken.symbol} to ${dstToken.symbol}`)
    },
    [getToken],
  )

  const onCopy = useCallback(() => {
    toast.success('Copied to clipboard')
  }, [])

  return {
    onCancelOrderSuccess,
    onOrderFilled,
    onCopy,
  }
}

const useGetTranslation = () => {
  const t = useTranslations()
  return useCallback(
    (key, params) => {
      const res = t(`twap_${key}`, params)
      if (res === `twap_${key}`) {
        return undefined
      }
      return res
    },
    [t],
  )
}

function useMarketReferencePrice(fromAmount, outAmount, quotePending) {
  return useMemo(
    () => ({
      isLoading: (!BN(fromAmount || '0').isZero() && !outAmount) || quotePending,
      value: outAmount,
      noLiquidity: !quotePending && !BN(fromAmount || '0').isZero() && !outAmount,
    }),
    [outAmount, fromAmount, quotePending],
  )
}

function PercentTabs() {
  const { fromAsset, setFromAmount } = useTwapContext()

  const percents = useMemo(
    () => [
      {
        label: '10%',
        onClickHandler: () => setFromAmount(fromAsset?.balance.times(0.1).toString(10) || '0'),
      },
      {
        label: '25%',
        onClickHandler: () => setFromAmount(fromAsset?.balance.times(0.25).toString(10) || '0'),
      },
      {
        label: '50%',
        onClickHandler: () => setFromAmount(fromAsset?.balance.times(0.5).toString(10) || '0'),
      },
      {
        label: 'Max',
        onClickHandler: () => setFromAmount(fromAsset?.balance.toString(10) || '0'),
      },
    ],
    [fromAsset, setFromAmount],
  )

  return <Tabs data={percents} className='w-full justify-end' />
}

export function Twap(props) {
  const { account } = useWallet()
  const chainId = useChainId()
  const { fromAsset, toAsset, swapType, fromAmount, outAmount, quotePending, setFromAmount } = props
  const { data: walletClient } = useWalletClient()
  const moduleType = useModule(swapType)
  const { priceProtection } = useSettings()
  const callbacks = useCallbacks()
  const marketReferencePrice = useMarketReferencePrice(fromAmount, outAmount, quotePending)
  const refetchBalances = useMutateAssets()
  const getTranslation = useGetTranslation()
  const resetTypedInputAmount = useCallback(() => setFromAmount(''), [setFromAmount])

  return (
    <TwapContextProvider props={props} module={moduleType}>
      <SpotProvider
        partner={Partners.Thena}
        provider={walletClient?.transport}
        chainId={chainId}
        account={account}
        srcUsd1Token={fromAsset?.price}
        dstUsd1Token={toAsset?.price}
        srcBalance={useMemo(() => getWeiBalanceFromAsset(fromAsset), [fromAsset])}
        dstBalance={useMemo(() => getWeiBalanceFromAsset(toAsset), [toAsset])}
        srcToken={useMemo(() => parseAsset(fromAsset), [fromAsset])}
        dstToken={useMemo(() => parseAsset(toAsset), [toAsset])}
        marketReferencePrice={marketReferencePrice}
        module={moduleType}
        getTranslation={getTranslation}
        fees={0.25}
        priceProtection={priceProtection}
        refetchBalances={refetchBalances}
        callbacks={callbacks}
        useToken={useToken}
        resetTypedInputAmount={resetTypedInputAmount}
        typedInputAmount={fromAmount}
        components={{
          Tooltip,
          Button,
        }}
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

function SwitchTokens() {
  const { fromAsset, toAsset, updateSearchParams } = useTwapContext()

  return (
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
  )
}
