/* THENA Dev */
/* eslint-disable simple-import-sort/imports */
import { Module, ORBS_TWAP_FAQ_URL, useSpot } from '@orbs-network/spot-react'

import InfoIcon from '@/icons/InfoIcon'
import { TextIconButton } from '@/components/buttons/IconButton'
import Toggle from '@/components/toggle'
import SwitchHorizontalV2Icon from '~/svgs/switch-horizontal-01.svg'
import WarningTriangleIcon from '~/svgs/warning-triangle.svg'

import { DURATION_OPTIONS } from '../constants'
import { useTwapContext } from '../context'
import { useTwapTranslation } from '../hooks'
import { formatDecimals, formatDuration } from '../utils'
import { DefaultButton, Input, InputContainer, Label, PercentageContainer, PriceContainer, SelectMenu } from './shared'

export function PricePanel() {
  const { isWrap, isUnwrap } = useTwapContext()
  const { fromToken, onInvert, isInverted, isMarketPrice } = useSpot().pricePanel

  if (isWrap || isUnwrap) return null

  return (
    <div className='twap-section flex flex-col gap-1'>
      <div className='mb-2 flex flex-row items-center justify-between gap-2'>
        <p className='text-[14px] font-medium'>
          {isInverted ? 'Buy' : 'Sell'} {fromToken?.symbol} {isMarketPrice ? 'at best rate' : 'at rate'}
        </p>
        <TextIconButton onClick={onInvert} Icon={SwitchHorizontalV2Icon} />
      </div>
      <div className='flex flex-col gap-4'>
        <TriggerPrice />
        <LimitPrice />
      </div>
    </div>
  )
}

function LimitPrice() {
  const {
    priceUI,
    onInputChange,
    invertedDstToken,
    onPercentageChange,
    percentage,
    usd,
    toggleLimitPrice,
    isLimitPrice,
    error,
    isTypedValue,
    onReset,
  } = useSpot().limitPricePanel

  const { module } = useTwapContext()
  const t = useTwapTranslation()

  return (
    <div className='flex flex-col gap-2'>
      <div className='flex items-center justify-between gap-2'>
        <div className='flex flex-1 flex-row items-center justify-between gap-1'>
          <div className='flex items-center gap-1'>
            {module !== Module.LIMIT && <Toggle checked={isLimitPrice} onChange={toggleLimitPrice} />}
            <Label tooltip={t('limitPriceTooltip')} text={t('limitPrice')} />
          </div>
          {isLimitPrice && <DefaultButton onClick={onReset} />}
        </div>
      </div>
      {isLimitPrice && (
        <div className='flex w-full flex-row items-stretch justify-between gap-3'>
          <PriceContainer
            error={Boolean(error)}
            symbol={invertedDstToken?.symbol}
            onChange={onInputChange}
            price={isTypedValue ? priceUI : formatDecimals(priceUI, 6)}
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
      )}
    </div>
  )
}

export function Disclaimer() {
  const disclaimer = useSpot().disclaimerPanel
  const { isWrap, isUnwrap } = useTwapContext()
  const t = useTwapTranslation()

  if (!disclaimer || isWrap || isUnwrap) return null

  return (
    <div className='twap-section mt-3 text-sm text-neutral-300'>
      <div className='flex flex-row items-start gap-2'>
        <InfoIcon className='relative top-1 h-4 w-4 stroke-neutral-400' />
        <p className='flex-1 text-sm text-neutral-300'>
          {t(disclaimer)}{' '}
          <a href={ORBS_TWAP_FAQ_URL} target='_blank' rel='noopener noreferrer' className='ml-1 underline'>
            Learn more
          </a>
        </p>
      </div>
    </div>
  )
}

function TradesPanel() {
  const { onChange, totalTrades, error, fromToken, amountPerTradeUI, amountPerTradeUsd } = useSpot().tradesAmountPanel
  const t = useTwapTranslation()

  return (
    <div className='flex w-full flex-col'>
      <div className='flex items-center justify-between gap-2'>
        <Label tooltip={t('totalTradesTooltip')} text={t('tradesAmountTitle')} />
        {totalTrades > 1 && (
          <p className='text-right text-[13px] text-neutral-300'>
            {formatDecimals(amountPerTradeUI)} {fromToken?.symbol} per trade
            {amountPerTradeUsd ? ` ($${formatDecimals(amountPerTradeUsd, 2)})` : ''}
          </p>
        )}
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
  const { onInputChange, onUnitSelect, fillDelay, error } = useSpot().fillDelayPanel
  const t = useTwapTranslation()

  return (
    <div className='flex w-full flex-col'>
      <Label tooltip={t('tradeIntervalTootlip')} text={t('tradeIntervalTitle')} />
      <InputContainer error={Boolean(error)} className='flex-1'>
        <Input
          onChange={onInputChange}
          value={fillDelay.value || ''}
          className='w-full text-left text-[17px]'
          error={Boolean(error)}
          placeholder='0'
        />
        <SelectMenu
          items={DURATION_OPTIONS}
          selected={DURATION_OPTIONS.find(it => it.value === fillDelay.unit)}
          onSelect={it => {
            onUnitSelect(it.value)
          }}
        />
      </InputContainer>
    </div>
  )
}

function DurationPanel() {
  const { onInputChange, onUnitSelect, duration, error } = useSpot().durationPanel
  const t = useTwapTranslation()

  return (
    <div className='flex w-full flex-col'>
      <Label tooltip={t('maxDurationTooltip')} text={t('expiry')} />
      <InputContainer error={Boolean(error)} className='flex-1'>
        <Input
          onChange={onInputChange}
          value={duration.value || ''}
          className='w-full text-left text-[17px]'
          error={Boolean(error)}
          placeholder='0'
        />
        <SelectMenu
          items={DURATION_OPTIONS}
          selected={DURATION_OPTIONS.find(it => it.value === duration.unit)}
          onSelect={it => {
            onUnitSelect(it.value)
          }}
        />
      </InputContainer>
    </div>
  )
}

export function CustomInputs() {
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

function TriggerPrice() {
  const {
    priceUI,
    onInputChange,
    invertedDstToken,
    onPercentageChange,
    percentage,
    usd,
    error,
    onReset,
    isTypedValue,
  } = useSpot().triggerPricePanel

  const { module } = useTwapContext()
  const t = useTwapTranslation()

  if (module !== Module.STOP_LOSS && module !== Module.TAKE_PROFIT) return null

  return (
    <div className='twap-limit-panel'>
      <div className='flex items-center justify-between gap-2'>
        <Label
          tooltip={t(module === Module.STOP_LOSS ? 'stopLossTooltip' : 'takeProfitTooltip')}
          text={t('stopLossLabel')}
        />
        <DefaultButton onClick={onReset} className='mb-2' />
      </div>

      <div className='flex w-full flex-row items-stretch justify-between gap-3'>
        <PriceContainer
          error={Boolean(error)}
          symbol={invertedDstToken?.symbol}
          onChange={onInputChange}
          price={isTypedValue ? priceUI : priceUI}
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
  )
}

const INPUT_ERROR_VALUE_ARG_KEYS = {
  maxChunksError: 'maxChunks',
  minChunksError: 'minChunks',
  minTradeSizeError: 'minTradeSize',
  minFillDelayError: 'fillDelay',
  maxFillDelayError: 'fillDelay',
  minDurationError: 'duration',
  maxDurationError: 'duration',
  maxOrderSizeError: 'maxOrderSize',
}

function getInputErrorArgs(error) {
  if (error?.args) return error.args
  if (error?.value === undefined || error?.value === null) return undefined

  if (error.type === 'minFillDelayError' || error.type === 'maxFillDelayError') {
    return { fillDelay: formatDuration(error.value) }
  }

  const argKey = INPUT_ERROR_VALUE_ARG_KEYS[error.type]
  return argKey ? { [argKey]: error.value } : undefined
}

export function ErrorPanel() {
  const { isWrap, isUnwrap } = useTwapContext()
  const error = useSpot().inputError
  const t = useTwapTranslation()

  if (!error || isWrap || isUnwrap) return null

  return (
    <div className='text-error-600 flex items-center gap-2 text-sm'>
      <WarningTriangleIcon className='stroke-error-600 h-4 w-4' />
      <p className='text-error-600 text-sm'>{t(error.type, getInputErrorArgs(error))}</p>
    </div>
  )
}
