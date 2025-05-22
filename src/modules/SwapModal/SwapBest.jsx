'use client'

/* eslint-disable simple-import-sort/imports */
import { useCallback, useMemo, useState } from 'react'
import BigNumber from 'bignumber.js'
import { useTranslations } from 'next-intl'
import { Alert } from '@/components/alert'
import Box from '@/components/box'
import { EmphasisButton } from '@/components/buttons/Button'
import ConnectButton from '@/components/buttons/ConnectButton'
import { EmphasisIconButton } from '@/components/buttons/IconButton'
import TokenInput from '@/components/input/TokenInput'
import Tabs from '@/components/tabs'
import { Paragraph, TextHeading } from '@/components/typography'
import { useMutateAssets } from '@/context/assetsContext'
import useDebounce from '@/hooks/useDebounce'
import { useOdosQuoteSwap, useOdosSwap, useTaxTokenSwap } from '@/hooks/useSwap'
import { formatAmount, fromWei, isInvalidAmount } from '@/lib/utils'
import useWallet from '@/hooks/useWallet'
import { liquidityHub, subtractSlippage } from '@/modules/LiquidityHub'
import TxnSettings from '@/modules/SettingsModal'
import { useChainSettings, useSettings } from '@/state/settings/hooks'
import { InfoIcon, SwitchVerticalIcon } from '@/svgs'
import Spinner from '@/components/spinner'
import WarningModal from '@/app/swap/WarningModal'

const MAX_PRICE_IMPACT = 20
export default function SwapBest({
  fromAsset,
  toAsset,
  isWrap,
  isUnwrap,
  onWrap,
  onUnwrap,
  wrapPending,
  setInputCurrency,
  setOutputCurrency,
  disabledChangeOutputCurrency = false,
}) {
  const t = useTranslations()
  const [fromAmount, setFromAmount] = useState('')
  const [isWarning, setIsWarning] = useState(false)
  const [liquidityHubFailed, setLiquidityHubFailed] = useState(false)
  const { account } = useWallet()
  const { slippage, deadline, liquidityHubEnabled } = useSettings()
  const { networkId } = useChainSettings()
  const debouncedAmount = useDebounce(fromAmount)

  const { data: bestTrade, isLoading: bestTradePending } = useOdosQuoteSwap(
    account,
    fromAsset,
    toAsset,
    debouncedAmount,
    slippage,
    networkId,
  )
  const mutateAssets = useMutateAssets()
  const { onOdosSwap, swapPending } = useOdosSwap()
  const { handleTaxTokenSwap, pending: taxTokenSwapPending } = useTaxTokenSwap()
  // const { handleThenaFusionSwap, pending: thenaSwapPending } = useThenaFusionSwap()

  const isEnabledTradeLH = useMemo(() => {
    if (!liquidityHubEnabled) return false
    if (!fromAmount) return false
    if (!bestTrade && !bestTradePending) return true
    if (bestTrade && Math.abs(bestTrade.priceImpact) > MAX_PRICE_IMPACT) return true
    return false
  }, [bestTrade, bestTradePending, fromAmount, liquidityHubEnabled])

  const { data: tradeLH, isLoading: quotePendingLH } = liquidityHub.useTrade(
    fromAsset,
    toAsset,
    debouncedAmount,
    isEnabledTradeLH,
  )

  const isFallbackLH = useMemo(() => {
    if (!tradeLH) return false
    const dexMinAmountOut = subtractSlippage(slippage, bestTrade?.outAmounts[0]) || '0'
    return new BigNumber(tradeLH.minAmountOut || 0).gt(dexMinAmountOut)
  }, [tradeLH, slippage, bestTrade])

  const { mutateAsync: onSwapLH, isLoading: swapLoadingLH } = liquidityHub.useSwap(
    fromAsset,
    toAsset,
    fromAmount,
    bestTrade,
    isFallbackLH,
  )

  const { isLoading: comparingTrade, callback: compareWithLHCallback } = liquidityHub.useCompareTrade(
    fromAsset,
    toAsset,
    fromAmount,
    bestTrade,
    liquidityHubFailed,
  )
  const quotePending = isFallbackLH
    ? quotePendingLH
    : isEnabledTradeLH
      ? quotePendingLH || bestTradePending
      : bestTradePending

  const outAmount = useMemo(
    () => (isFallbackLH ? tradeLH?.outAmount : bestTrade?.outAmounts[0] || ''),
    [tradeLH?.outAmount, bestTrade?.outAmounts, isFallbackLH],
  )

  const toAmount = useMemo(() => {
    if (outAmount && Number(outAmount) > 0 && toAsset) {
      return fromWei(outAmount, toAsset.decimals).toString(10)
    }
    return ''
  }, [toAsset, outAmount])

  const minimumReceived = useMemo(() => {
    if (!toAsset || !outAmount) return ''
    if (isFallbackLH && tradeLH?.minAmountOut) {
      return `${formatAmount(fromWei(tradeLH.minAmountOut, toAsset.decimals))} ${toAsset.symbol}`
    }
    if (slippage && Boolean(Number(slippage))) {
      return `${formatAmount(fromWei(outAmount * (1 - slippage / 100), toAsset.decimals))} ${toAsset.symbol}`
    }
    return `${formatAmount(fromWei(outAmount, toAsset.decimals))} ${toAsset.symbol}`
  }, [toAsset, outAmount, slippage, tradeLH?.minAmountOut, isFallbackLH])

  const priceImpact = useMemo(() => {
    if (quotePending) return 0
    if (!isFallbackLH && bestTrade) {
      return Math.abs(bestTrade.priceImpact)
    }
    if (fromAsset && toAsset && fromAmount && toAmount) {
      const fromInUsd = new BigNumber(fromAmount).times(fromAsset.price)
      const toInUsd = new BigNumber(toAmount).times(toAsset.price)
      return new BigNumber(((fromInUsd - toInUsd) / fromInUsd) * 100).toNumber()
    }
    return 0
  }, [bestTrade, fromAsset, toAsset, fromAmount, toAmount, quotePending, isFallbackLH])

  const percents = useMemo(
    () => [
      {
        label: '10%',
        onClickHandler: () => setFromAmount(fromAsset.balance.times(0.1).toString(10)),
      },
      {
        label: '25%',
        onClickHandler: () => setFromAmount(fromAsset.balance.times(0.25).toString(10)),
      },
      {
        label: '50%',
        onClickHandler: () => setFromAmount(fromAsset.balance.times(0.5).toString(10)),
      },
      {
        label: 'Max',
        onClickHandler: () => setFromAmount(fromAsset.balance.toString(10)),
      },
    ],
    [fromAsset, setFromAmount],
  )

  const onTradeSuccess = liquidityHub.useOnTradeSuccess(fromAsset, toAsset, isFallbackLH)

  const handleSwap = useCallback(async () => {
    if (
      (fromAsset.symbol === 'fBOMB' && ['WBNB', 'BNB'].includes(toAsset.symbol)) ||
      (toAsset.symbol === 'fBOMB' && ['WBNB', 'BNB'].includes(fromAsset.symbol))
    ) {
      return handleTaxTokenSwap(fromAsset, toAsset, fromAmount, slippage, deadline, () => {
        setFromAmount('')
        mutateAssets()
      })
    }
    const onSuccess = (quote, isTradeLH) => {
      onTradeSuccess({ quote, bestTrade, isTradeLH, fromAmount })
      setFromAmount('')
      mutateAssets()
    }

    const swapWithLH = async quote =>
      onSwapLH({
        quote,
        onSuccess: () => onSuccess(quote, true),
        onError: () => {
          setLiquidityHubFailed(true)
        },
      })

    if (isFallbackLH && tradeLH?.quote) {
      swapWithLH(tradeLH.quote)
      return
    }

    const result = await compareWithLHCallback()
    if (isFallbackLH && result?.isLH) {
      await swapWithLH(result?.quote)
    } else {
      await onOdosSwap(fromAsset, toAsset, fromAmount, toAmount, bestTrade, () => onSuccess(result?.quote, false))
    }
  }, [
    fromAsset,
    toAsset,
    bestTrade,
    handleTaxTokenSwap,
    fromAmount,
    slippage,
    deadline,
    mutateAssets,
    onOdosSwap,
    toAmount,
    compareWithLHCallback,
    onSwapLH,
    isFallbackLH,
    tradeLH,
    onTradeSuccess,
  ])

  const btnMsg = useMemo(() => {
    if (comparingTrade) {
      return {
        isError: false,
        label: t('Fetching best price'),
      }
    }
    if (!fromAsset || !toAsset) {
      return {
        isError: true,
        label: t('Select a Token'),
      }
    }

    if (isInvalidAmount(fromAmount)) {
      return {
        isError: true,
        label: t('Enter an amount'),
      }
    }

    if (quotePending) {
      return {
        isError: false,
        label: t('Fetching Quotes'),
      }
    }

    if (fromAsset.balance && fromAsset.balance.lt(fromAmount)) {
      return {
        isError: true,
        label: t('Insufficient Balance'),
      }
    }

    if (isWrap) {
      return {
        isError: false,
        label: t('Wrap'),
      }
    }

    if (isUnwrap) {
      return {
        isError: false,
        label: t('Unwrap'),
      }
    }

    if (!toAmount) {
      return {
        isError: true,
        label: t('Insufficient liquidity for this trade'),
      }
    }

    return {
      isError: false,
      label: t('Swap'),
    }
  }, [fromAsset, toAsset, fromAmount, toAmount, isWrap, isUnwrap, quotePending, t, comparingTrade])

  return (
    <>
      <Box className='w-full !pt-0 lg:px-6'>
        <div className='mb-3 flex items-center justify-between'>
          <div />
          <div className='flex items-center gap-2'>
            <TxnSettings />
          </div>
        </div>

        <div className='my-3 flex flex-col items-end gap-2'>
          <Tabs data={percents} />
          <div className='relative flex w-full flex-col gap-2'>
            <TokenInput
              asset={fromAsset}
              setAsset={asset => setInputCurrency(asset.address)}
              otherAsset={toAsset}
              setOtherAsset={asset => setOutputCurrency(asset.address)}
              amount={fromAmount}
              setAmount={setFromAmount}
              autoFocus
            />
            <TokenInput
              asset={toAsset}
              setAsset={asset => setOutputCurrency(asset.address)}
              otherAsset={fromAsset}
              setOtherAsset={asset => setInputCurrency(asset.address)}
              amount={toAmount}
              disabledSelect={disabledChangeOutputCurrency}
            />
            <EmphasisIconButton
              className='absolute bottom-0 left-0 right-0 top-0 z-10 m-auto'
              Icon={SwitchVerticalIcon}
              onClick={() => {
                setInputCurrency(toAsset.address)
                setOutputCurrency(fromAsset.address)
              }}
            />
          </div>
        </div>
        {toAmount && (
          <div className='flex flex-col gap-2 py-3'>
            <div className='flex items-center justify-between'>
              <TextHeading>{t('Rate')}</TextHeading>
              <Paragraph>
                {`${formatAmount(new BigNumber(toAmount).div(fromAmount))} ${t('[symbolA] per [symbolB]', {
                  symbolA: toAsset.symbol,
                  symbolB: fromAsset.symbol,
                })}`}
              </Paragraph>
            </div>
            <div className='flex items-center justify-between'>
              <TextHeading>{t('Minimum Received')}</TextHeading>
              <Paragraph>{minimumReceived}</Paragraph>
            </div>
            <div className='flex items-center justify-between'>
              <TextHeading>{t('Price Impact')}</TextHeading>
              <Paragraph>{formatAmount(priceImpact)}%</Paragraph>
            </div>
            {priceImpact > 5 && (
              <Alert>
                <InfoIcon className='h-4 w-4 stroke-error-600' />
                <p>{t('Price impact too high')}</p>
              </Alert>
            )}
          </div>
        )}
        {account ? (
          <EmphasisButton
            className='mt-3 w-full'
            disabled={
              !fromAmount ||
              quotePending ||
              swapPending ||
              taxTokenSwapPending ||
              swapLoadingLH ||
              comparingTrade ||
              wrapPending ||
              // thenaSwapPending ||
              // isLoadingThenaQuote ||
              btnMsg.isError
            }
            onClick={() => {
              if (priceImpact > 5) {
                setIsWarning(true)
              } else if (isWrap) {
                onWrap(fromAmount)
              } else if (isUnwrap) {
                onUnwrap(fromAmount)
              } else {
                handleSwap()
              }
            }}
          >
            {btnMsg.label} {comparingTrade && <Spinner />}
          </EmphasisButton>
        ) : (
          <ConnectButton className='mt-3 w-full' />
        )}
      </Box>
      <WarningModal popup={isWarning} setPopup={setIsWarning} priceImpact={priceImpact} handleSwap={handleSwap} />
    </>
  )
}
