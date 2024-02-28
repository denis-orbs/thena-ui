'use client'

import { useWeb3Modal } from '@web3modal/wagmi/react'
import { Fragment, useMemo, useState } from 'react'
import { JSBI, Percent, TradeType } from 'thena-sdk-core'

import { Alert } from '@/components/alert'
import Box from '@/components/box'
import { EmphasisButton, PrimaryButton, TextButton } from '@/components/buttons/Button'
import { EmphasisIconButton } from '@/components/buttons/IconButton'
import NextImage from '@/components/image/NextImage'
import TokenInput from '@/components/input/TokenInput'
import Skeleton from '@/components/skeleton'
import Tabs from '@/components/tabs'
import { Paragraph, TextHeading } from '@/components/typography'
import { useCurrency } from '@/hooks/fusion/Tokens'
import { useBestV3TradeExactIn, useBestV3TradeExactOut } from '@/hooks/fusion/useBestV3Trade'
import { useSwapCallback } from '@/hooks/fusion/useSwapCallback'
import { tryParseAmount } from '@/lib/fusion'
import { computeRealizedLPFeePercent } from '@/lib/fusion/computeRealizedLPFeePercent'
import { formatAmount } from '@/lib/utils'
import useWallet from '@/lib/wallets/useWallet'
import TxnSettings from '@/modules/SettingsModal'
import SwapChart from '@/modules/SwapChart'
import { useAssets } from '@/state/assets/hooks'
import { Field } from '@/state/fusion/actions'
import { useSettings } from '@/state/settings/hooks'
import { InfoIcon, RefreshIcon, SwitchVerticalIcon } from '@/svgs'

import WarningModal from './WarningModal'

export default function SwapFusion({
  fromAsset,
  toAsset,
  setFromAddress,
  setToAddress,
  isWrap,
  isUnwrap,
  onWrap,
  onUnwrap,
  wrapPending,
}) {
  const [independentField, setIndependentField] = useState(Field.CURRENCY_A)
  const [isWarning, setIsWarning] = useState(false)
  const [typedValue, setTypedValue] = useState('')
  const { slippage, deadline } = useSettings()
  const { account } = useWallet()
  const { open } = useWeb3Modal()
  const inCurrency = useCurrency(fromAsset ? fromAsset.address : undefined)
  const outCurrency = useCurrency(toAsset ? toAsset.address : undefined)
  const assets = useAssets()

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
    if (!account) {
      return {
        isError: true,
        label: 'Connect Wallet',
      }
    }

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
  }, [account, fromAsset, toAsset, parsedAmount, parsedAmounts, bestTrade, isWrap, isUnwrap])

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
      <Box className='w-full max-w-[480px]'>
        <div className='mb-3 flex items-center justify-between'>
          <h2>Swap</h2>
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
              setAsset={asset => setFromAddress(asset.address)}
              otherAsset={toAsset}
              setOtherAsset={asset => setToAddress(asset.address)}
              amount={formattedAmounts[Field.CURRENCY_A]}
              setAmount={val => {
                onInputFieldChange(val)
              }}
              autoFocus
            />
            <TokenInput
              asset={toAsset}
              setAsset={asset => setToAddress(asset.address)}
              otherAsset={fromAsset}
              setOtherAsset={asset => setFromAddress(asset.address)}
              amount={formattedAmounts[Field.CURRENCY_B]}
              setAmount={val => {
                onOutputFieldChange(val)
              }}
            />
            <EmphasisIconButton
              className='absolute bottom-0 left-0 right-0 top-0 z-10 m-auto'
              Icon={SwitchVerticalIcon}
              onClick={() => {
                setFromAddress(toAsset.address)
                setToAddress(fromAsset.address)
              }}
            />
          </div>
        </div>
        {bestTrade && !showWrap && (
          <div className='flex flex-col gap-2 py-3'>
            <div className='flex items-center justify-between'>
              <TextHeading>Rate</TextHeading>
              <Paragraph>
                {`${
                  Number(bestTrade.executionPrice.toSignificant()) === 0
                    ? 0
                    : bestTrade.executionPrice.invert().toSignificant(4)
                } ${fromAsset.symbol} per ${toAsset.symbol}`}
              </Paragraph>
            </div>
            <div className='flex items-center justify-between'>
              <TextHeading>
                {bestTrade.tradeType === TradeType.EXACT_INPUT ? 'Minimum received' : 'Maximum Sold'}
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
              <TextHeading>Liquidity Provider Fee</TextHeading>
              <Paragraph>
                {realizedLPFee ? `${realizedLPFee.toSignificant(4)} ${realizedLPFee.currency.symbol}` : '-'}
              </Paragraph>
            </div>
            <div className='flex items-center justify-between'>
              <TextHeading>Price Impact</TextHeading>
              <Paragraph>{formatAmount(priceImpactInNumber)}%</Paragraph>
            </div>
            {priceImpactInNumber > 5 && (
              <Alert>
                <InfoIcon className='h-4 w-4 stroke-error-600' />
                <p>Price impact too high!</p>
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
                swapCallback()
              }
            }}
          >
            {btnMsg.label}
          </EmphasisButton>
        ) : (
          <PrimaryButton className='mt-3 w-full' onClick={() => open()}>
            Connect Wallet
          </PrimaryButton>
        )}
      </Box>
      <div className='flex w-full max-w-[920px] flex-col gap-4'>
        <SwapChart asset0={fromAsset} asset1={toAsset} />
        <Box className='flex flex-col gap-4'>
          <div className='flex justify-between'>
            <TextHeading className='text-xl'>Order Routing</TextHeading>
            <TextButton className='text-xs' iconClassName='lg:h-4 lg:w-4' LeadingIcon={RefreshIcon}>
              Refresh quote
            </TextButton>
          </div>
          {bestV3TradeExactIn.isLoading ? (
            <Skeleton className='h-[100px] w-full' />
          ) : (
            <div>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <NextImage src={fromAsset?.logoURI} alt='' className='h-5 w-5' />
                  <Paragraph>
                    {formatAmount(formattedAmounts[Field.CURRENCY_A])} {fromAsset?.symbol}
                  </Paragraph>
                </div>
                <div className='flex items-center gap-2'>
                  <Paragraph>
                    {formatAmount(formattedAmounts[Field.CURRENCY_B])} {toAsset?.symbol}
                  </Paragraph>
                  <NextImage src={toAsset?.logoURI} alt='' className='h-5 w-5' />
                </div>
              </div>
              <div className='px-2.5'>
                {bestTrade && !showWrap && (
                  <div
                    // eslint-disable-next-line max-len
                    className='relative flex px-4 py-4 before:absolute before:left-0 before:top-0 before:h-[48px] before:w-full before:border-x before:border-b before:border-neutral-700 after:w-[60px]'
                  >
                    <div className='relative flex grow px-3'>
                      <div className='flex w-full justify-between space-x-4 overflow-hidden before:content-[""] after:content-[""]'>
                        {bestTrade.route.tokenPath.slice(1).map((token, idx) => {
                          const found = assets.find(ele => ele.address === token.address.toLowerCase())
                          return (
                            <div
                              className='h-fit w-fit space-y-1 rounded bg-neutral-600 px-2 py-2'
                              key={`subroute-${idx}`}
                            >
                              <div className='flex items-center space-x-1 py-1'>
                                <NextImage src={found?.logoURI} alt='' className='h-4 w-4' />
                                <span className='text-xs text-neutral-200'>{found?.symbol}</span>
                              </div>
                              <div className='flex w-full justify-between space-x-1 pl-1 text-xs'>
                                <Paragraph className='text-xs'>FUSION</Paragraph>
                                <TextHeading className='text-xs'>100%</TextHeading>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </Box>
      </div>
      <WarningModal
        popup={isWarning}
        setPopup={setIsWarning}
        priceImpact={priceImpactInNumber}
        handleSwap={swapCallback}
      />
    </>
  )
}
