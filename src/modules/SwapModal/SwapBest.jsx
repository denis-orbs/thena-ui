'use client'

/* eslint-disable simple-import-sort/imports */
import BigNumber from 'bignumber.js'
import { useTranslations } from 'next-intl'
import { useCallback, useMemo, useState } from 'react'
import { Alert } from '@/components/alert'
import Box from '@/components/box'
import { EmphasisButton } from '@/components/buttons/Button'
import ConnectButton from '@/components/buttons/ConnectButton'
import { EmphasisIconButton } from '@/components/buttons/IconButton'
import TokenInput from '@/components/input/TokenInput'
import Tabs from '@/components/tabs'
import { Paragraph, TextHeading } from '@/components/typography'
import { useMutateAssets } from '@/context/assetsContext'
import { useThenaQuote } from '@/hooks/fusion/useThenaQuote'
import useDebounce from '@/hooks/useDebounce'
import { useOdosQuoteSwap, useOdosSwap, useTaxTokenSwap } from '@/hooks/useSwap'
import useWallet from '@/hooks/useWallet'
import { formatAmount, fromWei, isInvalidAmount } from '@/lib/utils'
import { liquidityHub } from '@/modules/LiquidityHub'
import TxnSettings from '@/modules/SettingsModal'
import { useChainSettings, useSettings } from '@/state/settings/hooks'
import { InfoIcon, SwitchVerticalIcon } from '@/svgs'
import WarningModal from '@/app/swap/WarningModal'

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
  const [skipLiquidityHub, setSkipLiquidityHub] = useState(false)
  const { account } = useWallet()
  const { slippage, deadline } = useSettings()
  const { networkId } = useChainSettings()
  const debouncedAmount = useDebounce(fromAmount)

  const isThenaQuoteAndSwap = false

  const { data: bestTrade, isLoading: bestTradePending } = useOdosQuoteSwap(
    account,
    fromAsset,
    toAsset,
    debouncedAmount,
    slippage,
    networkId,
  )

  const isLHToken = fromAsset?.extended || toAsset?.extended

  const mutateAssets = useMutateAssets()
  const { onOdosSwap, swapPending } = useOdosSwap()
  const { handleTaxTokenSwap, pending: taxTokenSwapPending } = useTaxTokenSwap()
  // const { handleThenaFusionSwap, pending: thenaSwapPending } = useThenaFusionSwap()
  const { mutate: onLHSwap, isLoading: LHSwapPending } = liquidityHub.useSwap()
  const {
    data: lhQuote,
    isLoading: lhQuotePending,
    refetch: refetchLHQuote,
  } = liquidityHub.useQuoteQuery({ fromAsset, toAsset, fromAmount, bestTrade })
  const getBetterPrice = liquidityHub.useGetBetterPrice(refetchLHQuote)
  const quotePending = isLHToken ? lhQuotePending : bestTradePending

  // const { data: thenaQuoteData, isLoading: isLoadingThenaQuote } = useThenaQuote(
  const { data: thenaQuoteData } = useThenaQuote(fromAsset, toAsset, fromAmount, networkId, isThenaQuoteAndSwap)
  // NOTE: For the above function, please check if the token pool is CL or Classic

  const outAmount = useMemo(() => {
    if (isThenaQuoteAndSwap) {
      const outAmountThenaQuote = thenaQuoteData ? Number(thenaQuoteData?.result[0]) : ''
      return outAmountThenaQuote
    }

    return isLHToken ? lhQuote?.referencePrice : bestTrade?.outAmounts[0] || ''
  }, [isThenaQuoteAndSwap, isLHToken, lhQuote?.referencePrice, bestTrade?.outAmounts, thenaQuoteData])

  const toAmount = useMemo(() => {
    if (outAmount && Number(outAmount) > 0 && toAsset) {
      return fromWei(outAmount, toAsset.decimals).toString(10)
    }
    return ''
  }, [toAsset, outAmount])

  const minimumReceived = useMemo(() => {
    if (!toAsset || !outAmount) return ''
    if (isLHToken) {
      return `${formatAmount(fromWei(lhQuote?.minAmountOut || '', toAsset.decimals))} ${toAsset.symbol}`
    }
    if (slippage && Boolean(Number(slippage))) {
      return `${formatAmount(fromWei(outAmount * (1 - slippage / 100), toAsset.decimals))} ${toAsset.symbol}`
    }
    return `${formatAmount(fromWei(outAmount, toAsset.decimals))} ${toAsset.symbol}`
  }, [toAsset, outAmount, isLHToken, slippage, lhQuote?.minAmountOut])

  const priceImpact = useMemo(() => {
    if (quotePending) return 0
    if (!isLHToken && bestTrade) {
      return Math.abs(bestTrade.priceImpact)
    }
    if (fromAsset && toAsset && fromAmount && toAmount) {
      const fromInUsd = new BigNumber(fromAmount).times(fromAsset.price)
      const toInUsd = new BigNumber(toAmount).times(toAsset.price)
      return new BigNumber(((fromInUsd - toInUsd) / fromInUsd) * 100).toNumber()
    }
    return 0
  }, [isLHToken, bestTrade, fromAsset, toAsset, fromAmount, toAmount, quotePending])

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

    // if (isThenaQuoteAndSwap) {
    //   return handleThenaFusionSwap(fromAsset, toAsset, fromAmount, outAmount, slippage, deadline, () => {
    //     setFromAmount('')
    //     mutateAssets()
    //   })
    // }

    const swapWithLh = quote => {
      onLHSwap({
        getBestTrade: () => bestTrade,
        fromAsset,
        toAsset,
        quote,
        fromAmount,
        refetchLHQuote,
        onFailure: () => {
          if (!isLHToken) {
            setSkipLiquidityHub(true)
          }
        },
        onSuccess: () => {
          setFromAmount('')
          mutateAssets()
        },
      })
    }
    // if one of the tokens is extended (lh token), skip the check and go directly via liquidity hub
    if (isLHToken) {
      swapWithLh(lhQuote)
      return
    }
    const quote = await getBetterPrice(bestTrade?.outAmounts[0], skipLiquidityHub)
    if (quote) {
      swapWithLh(quote)
    } else {
      onOdosSwap(fromAsset, toAsset, fromAmount, toAmount, bestTrade, () => {
        setFromAmount('')
        mutateAssets()
      })
    }
  }, [
    fromAsset,
    toAsset,
    isLHToken,
    getBetterPrice,
    bestTrade,
    skipLiquidityHub,
    handleTaxTokenSwap,
    fromAmount,
    slippage,
    deadline,
    mutateAssets,
    onLHSwap,
    refetchLHQuote,
    lhQuote,
    onOdosSwap,
    toAmount,
  ])

  const btnMsg = useMemo(() => {
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
  }, [fromAsset, toAsset, fromAmount, toAmount, isWrap, isUnwrap, quotePending, t])

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
              LHSwapPending ||
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
            {btnMsg.label}
          </EmphasisButton>
        ) : (
          <ConnectButton className='mt-3 w-full' />
        )}
      </Box>
      <WarningModal popup={isWarning} setPopup={setIsWarning} priceImpact={priceImpact} handleSwap={handleSwap} />
    </>
  )
}
