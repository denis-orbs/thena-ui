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
import { useOdosQuoteSwap, useOdosSwap, useTaxTokenSwap } from '@/hooks/useSwap'
import { cn, formatAmount, fromWei, isInvalidAmount } from '@/lib/utils'
import useWallet from '@/hooks/useWallet'
import { liquidityHub } from '@/modules/LiquidityHub'
import { LiquidityHubRouting } from '@/modules/LiquidityHub/components'
import TxnSettings from '@/modules/SettingsModal'
import SwapChart from '@/modules/SwapChart'
import { useChainSettings, useSettings } from '@/state/settings/hooks'
import { InfoIcon, RefreshIcon, SwitchVerticalIcon } from '@/svgs'
import { SWAP_TYPES } from '@/constant'
import Selection from '@/components/selection'
import WarningModal from './WarningModal'

const Twap = dynamic(() => import('@/modules/TwapAndLimit').then(it => it.Twap), {
  ssr: false,
  loading: () => <Skeleton className='h-64' />,
})

const Orders = dynamic(() => import('@/modules/TwapAndLimit').then(it => it.Orders), {
  ssr: false,
  loading: () => <Skeleton className='h-64' />,
})

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
  const [isLhTrade, setIsLhTrade] = useState(false)
  const [skipLiquidityHub, setSkipLiquidityHub] = useState(false)
  const { account } = useWallet()
  const { slippage, deadline } = useSettings()
  const { networkId } = useChainSettings()
  const debouncedAmount = useDebounce(fromAmount)

  const setFromAddress = useCallback(address => updateSearchParams({ inputCurrency: address }), [updateSearchParams])
  const setToAddress = useCallback(address => updateSearchParams({ outputCurrency: address }), [updateSearchParams])

  // const isThenaQuoteAndSwap = useMemo(() => false, [])

  const {
    data: bestTrade,
    isLoading: bestTradePending,
    mutate,
  } = useOdosQuoteSwap(account, fromAsset, toAsset, debouncedAmount, slippage, networkId)

  const isLHToken = fromAsset?.extended || toAsset?.extended
  const showLhAmounts = isLHToken && !bestTrade && !bestTradePending

  const mutateAssets = useMutateAssets()
  const { onOdosSwap, swapPending } = useOdosSwap()
  const { handleTaxTokenSwap, pending: taxTokenSwapPending } = useTaxTokenSwap()
  // const { handleThenaFusionSwap, pending: thenaSwapPending } = useThenaFusionSwap()
  const { mutate: onLHSwap, isLoading: LHSwapPending } = liquidityHub.useSwap()
  const {
    data: lhQuote,
    isLoading: lhQuotePending,
    refetch: refetchLHQuote,
    getLatestQuote: getLatestLhQuote,
  } = liquidityHub.useQuoteQuery({ fromAsset, toAsset, fromAmount, bestTrade })
  const getBetterPrice = liquidityHub.useGetBetterPrice(refetchLHQuote)
  const quotePending = isLHToken ? bestTradePending || lhQuotePending : bestTradePending
  // const { data: thenaQuoteData, isLoading: isLoadingThenaQuote } = useThenaQuote(
  //   fromAsset,
  //   toAsset,
  //   fromAmount,
  //   networkId,
  //   isThenaQuoteAndSwap,
  // )

  const outAmount = useMemo(
    () =>
      // if (isThenaQuoteAndSwap) {
      //   const outAmountThenaQuote = thenaQuoteData ? Number(thenaQuoteData?.result[0]) : ''
      //   return outAmountThenaQuote
      // }

      showLhAmounts ? lhQuote?.outAmount : bestTrade?.outAmounts[0] || '',
    [bestTrade?.outAmounts, lhQuote?.outAmount, showLhAmounts],
  )

  const toAmount = useMemo(() => {
    if (outAmount && Number(outAmount) > 0 && toAsset) {
      return fromWei(outAmount, toAsset.decimals).toString(10)
    }
    return ''
  }, [toAsset, outAmount])

  const minimumReceived = useMemo(() => {
    if (!toAsset || !outAmount) return ''
    if (showLhAmounts) {
      return `${formatAmount(fromWei(outAmount, toAsset.decimals))} ${toAsset.symbol}`
    }
    if (slippage && Boolean(Number(slippage))) {
      return `${formatAmount(fromWei(outAmount * (1 - slippage / 100), toAsset.decimals))} ${toAsset.symbol}`
    }
    return `${formatAmount(fromWei(outAmount, toAsset.decimals))} ${toAsset.symbol}`
  }, [toAsset, outAmount, showLhAmounts, slippage])

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

    // if liquidity hub failes to swap and its not extended tokens, we skip this check and go directly via dex swap
    const quote = await getBetterPrice(bestTrade?.outAmounts[0], skipLiquidityHub)
    setIsLhTrade(!!quote)
    if (quote) {
      onLHSwap({
        bestTrade,
        fromAsset,
        toAsset,
        fromAmount,
        getLatestLhQuote,
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
    } else {
      onOdosSwap(fromAsset, toAsset, fromAmount, toAmount, bestTrade, () => {
        setFromAmount('')
        mutateAssets()
      })
    }
  }, [
    bestTrade,
    deadline,
    fromAmount,
    fromAsset,
    getBetterPrice,
    getLatestLhQuote,
    handleTaxTokenSwap,
    isLHToken,
    mutateAssets,
    onLHSwap,
    onOdosSwap,
    skipLiquidityHub,
    slippage,
    toAmount,
    toAsset,
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
  const isTwap = swapType === SWAP_TYPES.TWAP || swapType === SWAP_TYPES.LIMIT
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
              outAmount={bestTrade?.outAmounts[0] || lhQuote?.outAmount}
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
                    className='absolute bottom-0 left-0 right-0 top-0 z-10 m-auto'
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
            </>
          )}
        </Box>
      </div>
      <div className='flex min-w-0 max-w-[920px] flex-1 flex-col gap-4'>
        <SwapChart asset0={toAsset} asset1={fromAsset} />
        {isTwap ? (
          <Box className='flex flex-col gap-4'>
            <Orders />
          </Box>
        ) : (
          <Box className='flex flex-col gap-4'>
            <div className='flex justify-between'>
              <TextHeading className='text-xl'>{t('Order Routing')}</TextHeading>
              <TextButton
                className='text-xs'
                iconClassName='lg:h-4 lg:w-4'
                onClick={() => mutate()}
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
                {!isLhTrade && (
                  <div className={cn('-mx-4 lg:-mx-6', bestTrade && '-mb-[100px]')}>
                    {bestTrade && <NextImage className='w-full' src={bestTrade.pathVizImage} alt='best route' />}
                  </div>
                )}
                {!!lhQuote?.outAmount && Number(lhQuote?.outAmount) > 0 && isLhTrade && <LiquidityHubRouting />}
              </div>
            )}
          </Box>
        )}
      </div>
      <WarningModal popup={isWarning} setPopup={setIsWarning} priceImpact={priceImpact} handleSwap={handleSwap} />
    </>
  )
}
