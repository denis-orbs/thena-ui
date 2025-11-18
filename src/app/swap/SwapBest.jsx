'use client'

/* eslint-disable simple-import-sort/imports */
import { useCallback, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import BigNumber from 'bignumber.js'
import { useTranslations } from 'next-intl'
import { Alert } from '@/components/alert'
import Box from '@/components/box'
import { EmphasisButton, TextButton } from '@/components/buttons/Button'
import ConnectButton from '@/components/buttons/ConnectButton'
import { EmphasisIconButton } from '@/components/buttons/IconButton'
import NextImage from '@/components/image/NextImage'
import TokenInput from '@/components/input/TokenInput'
import Skeleton from '@/components/skeleton'
import Tabs from '@/components/tabs'
import { Paragraph, TextHeading } from '@/components/typography'
import { useMutateAssets } from '@/context/assetsContext'
import useDebounce from '@/hooks/useDebounce'
import { useOdosQuoteSwap, useOdosSwap, useTaxTokenSwap, useSolidlySwap } from '@/hooks/useSwap'
import cn from '@/utils/classes'
import { formatAmount, fromWei, isInvalidAmount } from '@/utils/utils'
import useWallet from '@/hooks/useWallet'
import { liquidityHub, subtractSlippage } from '@/modules/LiquidityHub'
import TxnSettings from '@/modules/SettingsModal'
import SwapChart from '@/modules/SwapChart'
import { useChainSettings, useSettings } from '@/state/settings/hooks'
import { SWAP_TYPES } from '@/constant'
import Selection from '@/components/selection'
import WarningModal from './WarningModal'
import Spinner from '@/components/spinner'
import { useSolidlyQuote } from '@/hooks/fusion/useSolidlyQuote'
import InfoIcon from '@/icons/InfoIcon'

import RefreshIcon from '~/svgs/refresh.svg'
import SwitchVerticalIcon from '~/svgs/switch-vertical.svg'

const Twap = dynamic(() => import('@/modules/TwapAndLimit').then(it => it.Twap), {
  ssr: false,
  loading: () => <Skeleton className='h-64' />,
})

const TwapOrders = dynamic(() => import('@/modules/TwapAndLimit').then(it => it.Orders), {
  ssr: false,
  loading: () => <Skeleton className='h-64' />,
})

const PoweredByOrbs = dynamic(() => import('@/modules/TwapAndLimit').then(it => it.PoweredByOrbs), {
  ssr: false,
  loading: () => <Skeleton className='h-64' />,
})

const MAX_PRICE_IMPACT = 20
const SWAP_TYPES_ITEMS = [
  { key: SWAP_TYPES.SWAP, label: 'Swap' },
  { key: SWAP_TYPES.TWAP, label: 'TWAP' },
  { key: SWAP_TYPES.LIMIT, label: 'Limit' },
]

export default function SwapBest({
  fromAsset,
  toAsset,
  isWrap,
  isUnwrap,
  onWrap,
  onUnwrap,
  wrapPending,
  setSwapType,
  swapType,
  updateSearchParams,
}) {
  const t = useTranslations()
  const [fromAmount, setFromAmount] = useState('')
  const [isWarning, setIsWarning] = useState(false)
  const [liquidityHubFailed, setLiquidityHubFailed] = useState(false)
  const { account } = useWallet()
  const { slippage, deadline, liquidityHubEnabled } = useSettings()
  const { networkId } = useChainSettings()
  const debouncedAmount = useDebounce(fromAmount)
  const isTwap = swapType === SWAP_TYPES.TWAP || swapType === SWAP_TYPES.LIMIT

  const setFromAddress = useCallback(address => updateSearchParams({ inputCurrency: address }), [updateSearchParams])
  const setToAddress = useCallback(address => updateSearchParams({ outputCurrency: address }), [updateSearchParams])

  const isSolidlySwap = useMemo(() => {
    if (
      ['USDC'].includes(fromAsset?.symbol) &&
      toAsset?.address.toLowerCase() === '0xa44d43648daa980011e1c370b6af88a5cd3c854f' // tmTBILL Token
    ) {
      return true
    }
    if (
      ['USDC'].includes(toAsset?.symbol) &&
      fromAsset?.address.toLowerCase() === '0xa44d43648daa980011e1c370b6af88a5cd3c854f'
    ) {
      return true
    }

    return false
  }, [fromAsset?.address, fromAsset?.symbol, toAsset?.address, toAsset?.symbol])

  const {
    data: bestTrade,
    isLoading: bestTradePending,
    mutate,
  } = useOdosQuoteSwap(account, fromAsset, toAsset, debouncedAmount, slippage, networkId)
  const mutateAssets = useMutateAssets()
  const { onOdosSwap, swapPending } = useOdosSwap()
  const { handleTaxTokenSwap, pending: taxTokenSwapPending } = useTaxTokenSwap()
  const { handleSolidlySwap, pending: solidlySwapPending } = useSolidlySwap()

  const isEnabledTradeLH = useMemo(() => {
    if (isTwap) return false
    if (!liquidityHubEnabled) return false
    if (!fromAmount) return false
    if (!bestTrade && !bestTradePending) return true
    if (bestTrade && Math.abs(bestTrade.priceImpact) > MAX_PRICE_IMPACT) return true
    return false
  }, [bestTrade, bestTradePending, fromAmount, liquidityHubEnabled, isTwap])

  const {
    data: tradeLH,
    isLoading: quotePendingLH,
    refetch: refetchTradeLH,
  } = liquidityHub.useTrade(fromAsset, toAsset, debouncedAmount, isEnabledTradeLH)

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

  const { data: solidlyQuoteData, isLoading: solidlyQuotePending } = useSolidlyQuote(
    fromAsset,
    toAsset,
    fromAmount,
    networkId,
    isSolidlySwap,
  )

  const quotePending = useMemo(
    () =>
      isSolidlySwap
        ? solidlyQuotePending
        : isFallbackLH
          ? quotePendingLH
          : isEnabledTradeLH
            ? quotePendingLH || bestTradePending
            : bestTradePending,
    [isFallbackLH, quotePendingLH, isEnabledTradeLH, bestTradePending, isSolidlySwap, solidlyQuotePending],
  )

  const onRefreshQuotes = useCallback(() => {
    if (isFallbackLH) {
      refetchTradeLH()
    } else {
      mutate()
    }
  }, [refetchTradeLH, mutate, isFallbackLH])

  // NOTE: For the above function, please check if the token pool is CL or Classic

  const outAmount = useMemo(() => {
    if (isSolidlySwap) {
      const outAmountThenaQuote = solidlyQuoteData ? Number(solidlyQuoteData[0]) : ''
      return outAmountThenaQuote
    }

    return isFallbackLH ? tradeLH?.outAmount : bestTrade?.outAmounts[0] || ''
  }, [isSolidlySwap, tradeLH?.outAmount, bestTrade?.outAmounts, solidlyQuoteData, isFallbackLH])

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
    let fromInUsd = 0
    let toInUsd = 0
    if (fromAsset && toAsset && fromAmount && toAmount) {
      fromInUsd = new BigNumber(fromAmount).times(fromAsset.price)
      toInUsd = new BigNumber(toAmount).times(toAsset.price)
    }
    if (!isFallbackLH && bestTrade) {
      const inDiff = Math.abs((fromInUsd - bestTrade.inValues) / bestTrade.inValues) * 100
      const outDiff = Math.abs((toInUsd - bestTrade.outValues) / bestTrade.outValues) * 100
      if (inDiff < 5 && outDiff < 5) {
        return Math.abs(bestTrade.percentDiff)
      }
    }
    if (fromAsset && toAsset && fromAmount && toAmount) {
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

    if (isSolidlySwap) {
      return handleSolidlySwap(fromAsset, toAsset, fromAmount, outAmount, slippage, deadline, () => {
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
    isSolidlySwap,
    outAmount,
    handleSolidlySwap,
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

  const title = useMemo(() => {
    switch (swapType) {
      case SWAP_TYPES.TWAP:
        return t('TWAP')
      case SWAP_TYPES.LIMIT:
        return t('Limit')
      default:
        return t('Swap')
    }
  }, [swapType, t])

  const swapTypeSelections = useMemo(
    () =>
      SWAP_TYPES_ITEMS.map(ele => ({
        label: ele.label,
        active: swapType === ele.key,
        onClickHandler: () => {
          setSwapType(ele.key)
        },
      })),
    [swapType, setSwapType],
  )
  return (
    <>
      <div className='w-full min-w-0 md:w-[448px] 2xl:w-[480px]'>
        <Selection className='mb-5 w-full' isFull data={swapTypeSelections} />
        <Box className='md:p-4'>
          <div className='mb-3 flex items-center justify-between'>
            <h2>{title}</h2>
            <div className='flex items-center gap-2'>
              <TxnSettings />
            </div>
          </div>

          {isTwap ? (
            <Twap
              setFromAmount={setFromAmount}
              fromAsset={fromAsset}
              toAsset={toAsset}
              setFromAddress={setFromAddress}
              setToAddress={setToAddress}
              updateSearchParams={updateSearchParams}
              outAmount={bestTrade?.outAmounts[0]}
              fromAmount={fromAmount}
              limit={swapType === SWAP_TYPES.LIMIT}
            />
          ) : (
            <>
              <div className='my-3 flex flex-col items-end gap-2'>
                <Tabs data={percents} />
                <div className='relative flex w-full flex-col gap-2'>
                  <TokenInput
                    asset={fromAsset}
                    setAsset={asset => setFromAddress(asset.address)}
                    otherAsset={toAsset}
                    setOtherAsset={asset => setToAddress(asset.address)}
                    amount={fromAmount}
                    setAmount={setFromAmount}
                    autoFocus
                  />
                  <TokenInput
                    asset={toAsset}
                    setAsset={asset => setToAddress(asset.address)}
                    otherAsset={fromAsset}
                    setOtherAsset={asset => setFromAddress(asset.address)}
                    amount={toAmount}
                    disabled
                  />
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
                      <InfoIcon className='stroke-error-600' />
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
                    solidlySwapPending ||
                    swapLoadingLH ||
                    comparingTrade ||
                    wrapPending ||
                    // solidlySwapPending ||
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
            </>
          )}
        </Box>
        {isTwap && <TwapOrders />}
        {isTwap && <PoweredByOrbs />}
      </div>
      <div className='flex max-w-[920px] min-w-0 flex-1 flex-col gap-4'>
        <SwapChart asset0={toAsset} asset1={fromAsset} />

        <Box className='flex flex-col gap-4'>
          <div className='flex justify-between'>
            <TextHeading className='text-xl'>{t('Order Routing')}</TextHeading>
            <TextButton
              className='text-xs'
              iconClassName={cn('lg:h-4 lg:w-4', quotePending && 'animate-spin')}
              onClick={onRefreshQuotes}
              LeadingIcon={RefreshIcon}
            >
              {t('Refresh Quote')}
            </TextButton>
          </div>
          {quotePending ? (
            <Skeleton className='h-[100px] w-full' />
          ) : (
            <div>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <NextImage src={fromAsset?.logoURI} alt='' className='h-5 w-5' />
                  <Paragraph>
                    {formatAmount(fromAmount)} {fromAsset?.symbol}
                  </Paragraph>
                </div>
                <div className='flex items-center gap-2'>
                  <Paragraph>
                    {formatAmount(toAmount)} {toAsset?.symbol}
                  </Paragraph>
                  <NextImage src={toAsset?.logoURI} alt='' className='h-5 w-5' />
                </div>
              </div>
              {!isFallbackLH && (
                <div className={cn('-mx-4 lg:-mx-6', bestTrade && '-mb-[100px]')}>
                  {bestTrade && <NextImage className='w-full' src={bestTrade.pathVizImage} alt='best route' />}
                </div>
              )}
              {isFallbackLH && tradeLH && Number(tradeLH.outAmount) > 0 && <LiquidityHubRouting />}
            </div>
          )}
        </Box>
      </div>
      <WarningModal popup={isWarning} setPopup={setIsWarning} priceImpact={priceImpact} handleSwap={handleSwap} />
    </>
  )
}

export function LiquidityHubRouting() {
  return (
    <div className='mt-5 flex justify-center gap-[5px]'>
      Via LiquidityHub powered by{' '}
      <a
        style={{ display: 'flex', alignItems: 'center', gap: 5 }}
        href='https://www.orbs.com/'
        target='_blank'
        rel='noreferrer'
      >
        Orbs{' '}
        <NextImage
          className='inline h-5 w-5 object-contain'
          alt='Orbs logo'
          src='https://www.orbs.com/assets/img/common/logo.svg'
        />
      </a>
    </div>
  )
}
