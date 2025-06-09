'use client'

import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'
import { JSBI, Percent, TradeType } from 'thena-sdk-core'

import WarningModal from '@/app/swap/WarningModal'
import { Alert } from '@/components/alert'
import Box from '@/components/box'
import { EmphasisButton } from '@/components/buttons/Button'
import ConnectButton from '@/components/buttons/ConnectButton'
import { EmphasisIconButton } from '@/components/buttons/IconButton'
import TokenInput from '@/components/input/TokenInput'
import Tabs from '@/components/tabs'
import { Paragraph, TextHeading } from '@/components/typography'
import { useMutateAssets } from '@/context/assetsContext'
import { useCurrency } from '@/hooks/fusion/Tokens'
import { useBestV3TradeExactIn, useBestV3TradeExactOut } from '@/hooks/fusion/useBestV3Trade'
import { useSwapCallback } from '@/hooks/fusion/useSwapCallback'
import useWallet from '@/hooks/useWallet'
import { tryParseAmount } from '@/lib/fusion'
import { computeRealizedLPFeePercent } from '@/lib/fusion/computeRealizedLPFeePercent'
import { formatAmount } from '@/lib/utils'
import TxnSettings from '@/modules/SettingsModal'
import { Field } from '@/state/fusion/actions'
import { useSettings } from '@/state/settings/hooks'
import { InfoIcon, SwitchVerticalIcon } from '@/svgs'

export default function SwapFusion({
  fromAsset,
  toAsset,
  isWrap,
  isUnwrap,
  onWrap,
  onUnwrap,
  wrapPending,
  setInputCurrency,
  setOutputCurrency,
  disabledChangeOutputCurrency,
  onSwapSuccess = () => {},
}) {
  const [independentField, setIndependentField] = useState(Field.CURRENCY_A)
  const [isWarning, setIsWarning] = useState(false)
  const [typedValue, setTypedValue] = useState('')
  const { slippage, deadline } = useSettings()
  const { account } = useWallet()
  const inCurrency = useCurrency(fromAsset ? fromAsset.address : undefined)
  const outCurrency = useCurrency(toAsset ? toAsset.address : undefined)
  const mutateAssets = useMutateAssets()
  const t = useTranslations()

  const showWrap = useMemo(() => isWrap || isUnwrap, [isWrap, isUnwrap])

  const isExactIn = independentField === Field.CURRENCY_A
  const parsedAmount = tryParseAmount(typedValue, (isExactIn ? inCurrency : outCurrency) ?? undefined)
  const bestV3TradeExactIn = useBestV3TradeExactIn(isExactIn ? parsedAmount : undefined, outCurrency ?? undefined)
  const bestV3TradeExactOut = useBestV3TradeExactOut(inCurrency ?? undefined, !isExactIn ? parsedAmount : undefined)
  const v3Trade = (isExactIn ? bestV3TradeExactIn : bestV3TradeExactOut) ?? undefined
  const bestTrade = v3Trade.trade ?? undefined

  const allowedSlippage = new Percent(JSBI.BigInt(slippage * 100), JSBI.BigInt(10000))

  const { callback: swapCallback, pending: swapPending } = useSwapCallback(bestTrade, allowedSlippage, deadline)

  const { realizedLPFee, priceImpact } = useMemo(() => {
    if (!bestTrade) return { realizedLPFee: undefined, priceImpact: undefined }

    const realizedLpFeePercent = computeRealizedLPFeePercent(bestTrade)
    const realizedLPFeeVal = bestTrade.inputAmount.multiply(realizedLpFeePercent)
    const priceImpactVal = bestTrade.priceImpact.subtract(realizedLpFeePercent)
    return { priceImpact: priceImpactVal, realizedLPFee: realizedLPFeeVal }
  }, [bestTrade])

  const priceImpactInNumber = useMemo(() => (priceImpact ? Number(priceImpact.toSignificant()) : 0), [priceImpact])

  const parsedAmounts = useMemo(
    () =>
      showWrap
        ? {
            [Field.CURRENCY_A]: parsedAmount,
            [Field.CURRENCY_B]: parsedAmount,
          }
        : {
            [Field.CURRENCY_A]: independentField === Field.CURRENCY_A ? parsedAmount : bestTrade?.inputAmount,
            [Field.CURRENCY_B]: independentField === Field.CURRENCY_B ? parsedAmount : bestTrade?.outputAmount,
          },
    [independentField, parsedAmount, showWrap, bestTrade],
  )

  const formattedAmounts = useMemo(() => {
    const dependentField = isExactIn ? Field.CURRENCY_B : Field.CURRENCY_A
    return {
      [independentField]: typedValue,
      [dependentField]: showWrap
        ? parsedAmounts[independentField]?.toExact() ?? ''
        : parsedAmounts[dependentField]?.toExact() ?? '',
    }
  }, [isExactIn, showWrap, parsedAmounts, independentField, typedValue])

  const btnMsg = useMemo(() => {
    if (!fromAsset || !toAsset) {
      return {
        isError: true,
        label: 'Select a token',
      }
    }

    if (!parsedAmount) {
      return {
        isError: true,
        label: 'Enter an amount',
      }
    }

    if (fromAsset.balance && fromAsset.balance.lt(parsedAmounts[Field.CURRENCY_A]?.toExact())) {
      return {
        isError: true,
        label: `Insufficient ${fromAsset.symbol} balance`,
      }
    }

    if (isWrap) {
      return {
        isError: false,
        label: 'Wrap',
      }
    }

    if (isUnwrap) {
      return {
        isError: false,
        label: 'Unwrap',
      }
    }

    if (!bestTrade) {
      return {
        isError: true,
        label: 'Insufficient liquidity for this trade',
      }
    }

    return {
      isError: false,
      label: 'Swap',
    }
  }, [fromAsset, toAsset, parsedAmount, parsedAmounts, bestTrade, isWrap, isUnwrap])

  const onInputFieldChange = val => {
    setIndependentField(Field.CURRENCY_A)
    setTypedValue(val)
  }

  const onOutputFieldChange = val => {
    setIndependentField(Field.CURRENCY_B)
    setTypedValue(val)
  }

  const inputPercents = useMemo(
    () => [
      {
        label: '10%',
        onClickHandler: () =>
          onInputFieldChange(fromAsset?.balance?.times(0.1).dp(fromAsset.decimals).toString(10) || ''),
      },
      {
        label: '25%',
        onClickHandler: () =>
          onInputFieldChange(fromAsset?.balance?.times(0.25).dp(fromAsset.decimals).toString(10) || ''),
      },
      {
        label: '50%',
        onClickHandler: () =>
          onInputFieldChange(fromAsset?.balance?.times(0.5).dp(fromAsset.decimals).toString(10) || ''),
      },
      {
        label: 'Max',
        onClickHandler: () => onInputFieldChange(fromAsset?.balance?.toString(10) || ''),
      },
    ],
    [fromAsset],
  )

  return (
    <>
      <Box className='w-full pt-0! lg:px-6'>
        <div className='mb-3 flex items-center justify-between'>
          <div />
          <div className='flex items-center gap-2'>
            {/* <Selection data={selections} /> */}
            <TxnSettings />
          </div>
        </div>
        <div className='my-3 flex flex-col items-end gap-2'>
          <Tabs data={inputPercents} />
          <div className='relative flex w-full flex-col items-end gap-2'>
            <TokenInput
              asset={fromAsset}
              setAsset={asset => setInputCurrency(asset.address)}
              otherAsset={toAsset}
              setOtherAsset={asset => setOutputCurrency(asset.address)}
              amount={formattedAmounts[Field.CURRENCY_A]}
              setAmount={val => {
                onInputFieldChange(val)
              }}
              autoFocus
            />
            <TokenInput
              asset={toAsset}
              setAsset={asset => setOutputCurrency(asset.address)}
              otherAsset={fromAsset}
              setOtherAsset={asset => setInputCurrency(asset.address)}
              amount={formattedAmounts[Field.CURRENCY_B]}
              setAmount={val => {
                onOutputFieldChange(val)
              }}
              disabledSelect={disabledChangeOutputCurrency}
            />
            <EmphasisIconButton
              className='absolute top-0 right-0 bottom-0 left-0 z-10 m-auto'
              disabled={disabledChangeOutputCurrency}
              Icon={SwitchVerticalIcon}
              onClick={() => {
                setInputCurrency(toAsset.address)
                setOutputCurrency(fromAsset.address)
              }}
            />
          </div>
        </div>
        {bestTrade && !showWrap && (
          <div className='flex flex-col gap-2 py-3'>
            <div className='flex items-center justify-between'>
              <TextHeading>{t('Rate')}</TextHeading>
              <Paragraph>
                {`${
                  Number(bestTrade.executionPrice.toSignificant()) === 0
                    ? 0
                    : bestTrade.executionPrice.invert().toSignificant(4)
                } ${t('[symbolA] per [symbolB]', {
                  symbolA: fromAsset.symbol,
                  symbolB: toAsset.symbol,
                })}`}
              </Paragraph>
            </div>
            <div className='flex items-center justify-between'>
              <TextHeading>
                {bestTrade.tradeType === TradeType.EXACT_INPUT ? 'Minimum Received' : 'Maximum Sold'}
              </TextHeading>
              <Paragraph>
                {bestTrade.tradeType === TradeType.EXACT_INPUT
                  ? `${bestTrade.minimumAmountOut(allowedSlippage).toSignificant(6)} ${
                      bestTrade.outputAmount.currency.symbol
                    }`
                  : `${bestTrade.maximumAmountIn(allowedSlippage).toSignificant(6)} ${
                      bestTrade.inputAmount.currency.symbol
                    }`}
              </Paragraph>
            </div>
            <div className='flex items-center justify-between'>
              <TextHeading>{t('Liquidity Provider Fee')}</TextHeading>
              <Paragraph>
                {realizedLPFee ? `${realizedLPFee.toSignificant(4)} ${realizedLPFee.currency.symbol}` : '-'}
              </Paragraph>
            </div>
            <div className='flex items-center justify-between'>
              <TextHeading>{t('Price Impact')}</TextHeading>
              <Paragraph>{formatAmount(priceImpactInNumber)}%</Paragraph>
            </div>
            {priceImpactInNumber > 5 && (
              <Alert>
                <InfoIcon className='stroke-error-600 h-4 w-4' />
                <p>{t('Price impact too high')}</p>
              </Alert>
            )}
          </div>
        )}
        {account ? (
          <EmphasisButton
            className='mt-3 w-full'
            disabled={btnMsg.isError || wrapPending || swapPending}
            onClick={() => {
              if (priceImpactInNumber > 5) {
                setIsWarning(true)
              } else if (isWrap) {
                onWrap(parsedAmount?.toExact())
              } else if (isUnwrap) {
                onUnwrap(parsedAmount?.toExact())
              } else {
                swapCallback(() => {
                  mutateAssets()
                  onSwapSuccess()
                })
              }
            }}
          >
            {btnMsg.label}
          </EmphasisButton>
        ) : (
          <ConnectButton className='mt-3 w-full' />
        )}
      </Box>
      <WarningModal
        popup={isWarning}
        setPopup={setIsWarning}
        priceImpact={priceImpactInNumber}
        handleSwap={swapCallback}
      />
    </>
  )
}
