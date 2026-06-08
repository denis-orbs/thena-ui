/* THENA Dev */
/* eslint-disable simple-import-sort/imports */
import { useCallback, useMemo, useState } from 'react'
import {
  DISCLAIMER_URL,
  ORBS_TWAP_FAQ_URL,
  Steps,
  SwapStatus,
  isNativeAddress,
  useExplorerLink,
  useNetwork,
  useSpot,
} from '@orbs-network/spot-react'
import { SwapFlow } from '@orbs-network/swap-ui'

import ConnectButton from '@/components/buttons/ConnectButton'
import { PrimaryButton } from '@/components/buttons/Button'
import Modal from '@/components/modal'
import Toggle from '@/components/toggle'
import Spinner from '@/components/spinner'
import CustomTooltip from '@/components/tooltip'
import useWallet from '@/hooks/useWallet'
import InfoIcon from '@/icons/InfoIcon'
import { sliceAddress } from '@/utils/utils'

import { useTwapContext } from '../context'
import { useTwapTranslation } from '../hooks'
import { formatDecimals, formatDuration, formatPriceQuote, formatTimestamp, getOrderTitle } from '../utils'

function formatUsd(value) {
  return value ? `$${formatDecimals(value, 2)}` : ''
}

function formatTokenAmount(value, symbol) {
  const amount = value ? formatDecimals(value) : ''
  return amount ? `${amount}${symbol ? ` ${symbol}` : ''}` : ''
}

function formatTokenAmountWithUsd(value, symbol, usd) {
  const amount = formatTokenAmount(value, symbol)
  const usdAmount = formatUsd(usd)

  if (!amount) return usdAmount
  return (
    <>
      <span>{amount}</span>
      {usdAmount ? <span className='text-xs font-normal text-neutral-400 opacity-70'> ({usdAmount})</span> : null}
    </>
  )
}

function isPositiveAmount(value) {
  return Number(value || 0) > 0
}

function ShowConfirmationButton({ onClick }) {
  const { disabled: spotDisabled, loading } = useSpot().submitOrderButton
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
      text: quotePending || loading ? 'Fetching quotes' : 'Place order',
      onClick: () => onClick(),
    }
  }, [isWrap, isUnwrap, quotePending, loading, onWrap, fromAmount, onUnwrap, onClick])

  if (!account) {
    return <ConnectButton className='mt-3 w-full' />
  }

  const disabled = quotePending || spotDisabled || wrapPending || loading

  return (
    <PrimaryButton
      className={`mt-3 w-full ${disabled ? 'opacity-50' : ''}`}
      onClick={disabled ? undefined : button.onClick}
    >
      {loading ? <Spinner /> : button.text}
    </PrimaryButton>
  )
}

function ReviewRow({ label, value, hidden, tooltip, tooltipId }) {
  if (hidden || value === undefined || value === null || value === '') return null

  return (
    <div className='flex items-center justify-between gap-3 border-b border-neutral-700/60 last:border-b-0'>
      <div className='flex min-w-0 items-center gap-2 text-sm text-neutral-400'>
        <span>{label}</span>
        {tooltip ? (
          <>
            <InfoIcon className='h-4 w-4 flex-none stroke-neutral-400' data-tooltip-id={tooltipId} />
            <CustomTooltip id={tooltipId} place='top' className='z-50 max-w-[260px]'>
              <p>{tooltip}</p>
            </CustomTooltip>
          </>
        ) : null}
      </div>
      <div className='text-right text-[13px] font-medium text-neutral-100'>{value}</div>
    </div>
  )
}

function WrapMsg({ srcToken }) {
  const t = useTwapTranslation()
  const network = useNetwork()
  const { wrapTxHash } = useSpot().orderExecutionPanel

  if (!wrapTxHash) return null

  return (
    <p className='text-center text-sm text-neutral-300'>
      {t('wrapMsg', {
        symbol: srcToken?.symbol || '',
        wSymbol: network?.wToken?.symbol || '',
      })}
    </p>
  )
}

function TxError({ error, srcToken }) {
  return (
    <div className='flex flex-col items-center gap-2 text-center'>
      <p className='text-lg font-semibold text-white'>Transaction failed</p>
      {error?.code ? <p className='text-sm text-neutral-300'>Error code: {error.code}</p> : null}
      {error?.message ? <p className='text-error-600 max-h-[160px] overflow-y-auto text-sm'>{error.message}</p> : null}
      <WrapMsg srcToken={srcToken} />
    </div>
  )
}

function FailedContent({ error, srcToken }) {
  return (
    <SwapFlow.Failed
      error={<TxError error={error} srcToken={srcToken} />}
      footerLink={ORBS_TWAP_FAQ_URL}
      footerText='Learn more'
    />
  )
}

function SuccessContent({ orderTitle, srcToken }) {
  const t = useTwapTranslation()

  return (
    <>
      <SwapFlow.Success title={t('createOrderActionSuccess', { name: orderTitle })} />
      <WrapMsg srcToken={srcToken} />
    </>
  )
}

function useSubmitFlowStep(orderTitle, srcToken) {
  const t = useTwapTranslation()
  const network = useNetwork()
  const { step, status, wrapTxHash, approveTxHash } = useSpot().orderExecutionPanel
  const wrapExplorerUrl = useExplorerLink(wrapTxHash)
  const approveExplorerUrl = useExplorerLink(approveTxHash)

  const symbol = isNativeAddress(srcToken?.address || '')
    ? network?.native?.symbol || srcToken?.symbol || ''
    : srcToken?.symbol || ''
  const createTitle =
    status === SwapStatus.SUCCESS
      ? t('createOrderActionSuccess', { name: orderTitle })
      : t('createOrderAction', { name: orderTitle })

  return useMemo(() => {
    if (!status && !step) return undefined

    if (step === Steps.WRAP) {
      return {
        title: t('wrapAction', { symbol }),
        footerLink: wrapExplorerUrl,
        footerText: wrapExplorerUrl ? t('viewOnExplorer') : t('proceedInWallet'),
      }
    }

    if (step === Steps.APPROVE) {
      return {
        title: t('approveAction', { symbol }),
        footerLink: approveExplorerUrl,
        footerText: approveExplorerUrl ? t('viewOnExplorer') : t('proceedInWallet'),
      }
    }

    return {
      title: createTitle,
      footerText: status === SwapStatus.LOADING ? t('proceedInWallet') : undefined,
    }
  }, [approveExplorerUrl, createTitle, status, step, symbol, t, wrapExplorerUrl])
}

function SubmitFlowMain({ disclaimerAccepted, onToggleDisclaimer, onSubmit, loading }) {
  const t = useTwapTranslation()
  const form = useSpot().derivedFormData
  const network = useNetwork()
  const { status } = useSpot().orderExecutionPanel
  const isSubmitted = Boolean(status)
  const totalTrades = Number(form.totalTrades || 0)
  const hasMinDestAmount = isPositiveAmount(form.minDestAmountPerTrade || form.minDestAmountPerTradeUI)
  const triggerPrice = formatPriceQuote(form.triggerPriceUI, form.triggerPriceUsd, form.srcToken, form.dstToken)
  const limitPrice = formatPriceQuote(form.limitPriceUI, form.limitPriceUsd, form.srcToken, form.dstToken)
  const { recipient } = form
  const recipientValue = useMemo(() => {
    if (!recipient) return ''
    if (!network?.explorer) return sliceAddress(recipient)

    return (
      <a href={`${network.explorer}/address/${recipient}`} target='_blank' rel='noopener noreferrer'>
        {sliceAddress(recipient)}
      </a>
    )
  }, [network?.explorer, recipient])

  return (
    <>
      <SwapFlow.Main
        fromTitle={t('from')}
        toTitle={t('to')}
        inUsd={formatUsd(form.srcAmountUsd)}
        outUsd={formatUsd(form.dstAmountUsd)}
      />
      {!isSubmitted && (
        <div className='mt-4 flex w-full flex-col gap-4'>
          <div className='flex flex-col gap-2 rounded-lg bg-neutral-800 p-3'>
            <ReviewRow
              label={t('triggerPrice')}
              value={triggerPrice}
              hidden={!triggerPrice}
              tooltip={t('triggerPriceTooltip')}
              tooltipId='twap-submit-trigger-price'
            />
            <ReviewRow
              label={t('limitPrice')}
              value={limitPrice}
              hidden={!limitPrice}
              tooltip={t('limitPriceTooltip')}
              tooltipId='twap-submit-limit-price'
            />
            <ReviewRow
              label={t('numberOfTrades')}
              value={form.totalTrades}
              hidden={!form.totalTrades || totalTrades <= 1}
            />
            <ReviewRow
              label={t('individualTradeSize')}
              value={formatTokenAmountWithUsd(form.sizePerTradeUI, form.srcToken?.symbol, form.sizePerTradeUsd)}
              hidden={!form.sizePerTradeUI || totalTrades <= 1}
            />
            <ReviewRow
              label={t(form.totalTrades > 1 ? 'minReceivedPerTrade' : 'minReceived')}
              value={formatTokenAmountWithUsd(
                form.minDestAmountPerTradeUI,
                form.dstToken?.symbol,
                form.minDestAmountPerTradeUsd,
              )}
              hidden={!hasMinDestAmount}
              tooltip={t('minDstAmountTooltip')}
              tooltipId='twap-submit-min-received'
            />
            <ReviewRow
              label={t('tradeIntervalLabel')}
              value={formatDuration(form.tradeInterval)}
              hidden={!form.tradeInterval || totalTrades <= 1}
            />
            <ReviewRow
              label={t('expirationLabel')}
              value={formatTimestamp(form.deadline)}
              tooltip={t('expirationTooltip')}
              tooltipId='twap-submit-expiration'
            />
            <ReviewRow label={t('recipient')} value={recipientValue} hidden={!recipient} />

            <ReviewRow
              label={t('fees', { value: `${form.feesPercentage}%` })}
              value={formatUsd(form.feesUsd)}
              hidden={!form.feesAmount}
            />
          </div>

          <div className='flex items-center justify-between gap-2 rounded-lg bg-neutral-800 p-2'>
            <p className='text-sm font-medium text-neutral-300'>
              Accept{' '}
              <a href={DISCLAIMER_URL} target='_blank' rel='noopener noreferrer' className='text-primary-600'>
                Disclaimer
              </a>
            </p>
            <Toggle checked={disclaimerAccepted} onChange={onToggleDisclaimer} />
          </div>

          <PrimaryButton disabled={!disclaimerAccepted || loading} className='w-full' onClick={onSubmit}>
            {loading ? <Spinner /> : 'Confirm Order'}
          </PrimaryButton>
        </div>
      )}
    </>
  )
}

function SubmitFlow({ disclaimerAccepted, onToggleDisclaimer, onSubmit, loading }) {
  const t = useTwapTranslation()
  const panel = useSpot().orderExecutionPanel
  const form = useSpot().derivedFormData
  const srcToken = panel.srcToken || form.srcToken
  const dstToken = panel.dstToken || form.dstToken
  const orderTitle = getOrderTitle(form.orderType, t)
  const currentStep = useSubmitFlowStep(orderTitle, srcToken)

  const inToken = useMemo(
    () => ({
      symbol: srcToken?.symbol,
      logoUrl: srcToken?.logoUrl,
    }),
    [srcToken],
  )
  const outToken = useMemo(
    () => ({
      symbol: dstToken?.symbol,
      logoUrl: dstToken?.logoUrl,
    }),
    [dstToken],
  )

  return (
    <SwapFlow
      inAmount={formatDecimals(form.srcAmountUI)}
      outAmount={formatDecimals(form.dstAmountUI)}
      inToken={inToken}
      outToken={outToken}
      swapStatus={panel.parsedError ? SwapStatus.FAILED : panel.status}
      totalSteps={panel.totalSteps}
      currentStep={currentStep}
      currentStepIndex={panel.stepIndex}
      translation={{
        proceedInWallet: t('proceedInWallet'),
        viewOnExplorer: t('viewOnExplorer'),
      }}
      components={{
        Failed: <FailedContent error={panel.parsedError} srcToken={srcToken} />,
        Loader: <Spinner className='h-10 w-10' />,
        Main: (
          <SubmitFlowMain
            disclaimerAccepted={disclaimerAccepted}
            onToggleDisclaimer={onToggleDisclaimer}
            onSubmit={onSubmit}
            loading={loading}
          />
        ),
        Success: <SuccessContent orderTitle={orderTitle} srcToken={srcToken} />,
      }}
    />
  )
}

export function SubmitOrderPanel() {
  const { onSubmit, status, isSuccess, resetCurrentSwap, resetState, parsedError, confirmButtonLoading } =
    useSpot().orderExecutionPanel
  const { orderType } = useSpot().derivedFormData
  const { setFromAmount } = useTwapContext()
  const t = useTwapTranslation()
  const orderTitle = getOrderTitle(orderType, t)
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(true)
  const [isOpen, setIsOpen] = useState(false)

  const onOpen = useCallback(() => {
    setIsOpen(true)
  }, [])

  const onClose = useCallback(() => {
    setIsOpen(false)
    setTimeout(() => {
      resetState()
    }, 500)
    if (isSuccess) {
      setFromAmount('')
    }
    if (status) {
      setTimeout(() => {
        resetCurrentSwap()
      }, 500)
    }
  }, [isSuccess, resetCurrentSwap, resetState, setFromAmount, status])

  const onToggleDisclaimer = useCallback(() => setDisclaimerAccepted(value => !value), [])

  return (
    <>
      <Modal
        isOpen={isOpen}
        closeModal={onClose}
        width={480}
        isIntl
        title={parsedError ? 'Create Order Failed' : status ? '' : `${orderTitle} order`}
        fontSizeTitle='text-xl'
      >
        <div className='mb-3 inline-flex w-full flex-col gap-4 px-6 py-3'>
          <SubmitFlow
            disclaimerAccepted={disclaimerAccepted}
            onToggleDisclaimer={onToggleDisclaimer}
            onSubmit={onSubmit}
            loading={Boolean(confirmButtonLoading)}
          />
        </div>
      </Modal>
      <ShowConfirmationButton onClick={onOpen} />
    </>
  )
}
