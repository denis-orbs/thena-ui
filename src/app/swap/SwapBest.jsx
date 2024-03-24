'use client'

import BigNumber from 'bignumber.js'
import { useTranslations } from 'next-intl'
import { useCallback, useMemo, useState } from 'react'

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
import { useOdosQuoteSwap, useOdosSwap } from '@/hooks/useSwap'
import { cn, formatAmount, fromWei, isInvalidAmount } from '@/lib/utils'
import useWallet from '@/lib/wallets/useWallet'
import { liquidityHub } from '@/modules/LiquidityHub'
import { LiquidityHubRouting } from '@/modules/LiquidityHub/components'
import TxnSettings from '@/modules/SettingsModal'
import SwapChart from '@/modules/SwapChart'
import { useChainSettings, useSettings } from '@/state/settings/hooks'
import { InfoIcon, RefreshIcon, SwitchVerticalIcon } from '@/svgs'

import WarningModal from './WarningModal'

export default function SwapBest({
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
  const t = useTranslations()
  const [fromAmount, setFromAmount] = useState('')
  const [isWarning, setIsWarning] = useState(false)
  const { account } = useWallet()
  const { slippage } = useSettings()
  const { networkId } = useChainSettings()
  const debouncedAmount = useDebounce(fromAmount)
  const {
    data: bestTrade,
    isLoading: bestTradePending,
    mutate,
  } = useOdosQuoteSwap(account, fromAsset, toAsset, debouncedAmount, slippage, networkId)
  const mutateAssets = useMutateAssets()
  const { onOdosSwap, swapPending } = useOdosSwap()
  const { mutate: onLHSwap, isLoading: LHSwapPending } = liquidityHub.useSwap()
  const {
    data: lhQuote,
    error: lhQuoteError,
    isLoading: lhQuotePending,
  } = liquidityHub.useQuoteQuery(fromAsset, toAsset, debouncedAmount, bestTrade?.outAmounts[0])
  const isDexTrade = liquidityHub.useIsDexTrade(bestTrade?.outAmounts[0], lhQuote?.outAmount, lhQuoteError)
  const quotePending = bestTradePending || lhQuotePending
  const isLHToken = fromAsset?.extended || toAsset?.extended
  const outAmount = useMemo(
    () => (quotePending ? '' : isLHToken || !bestTrade ? lhQuote?.outAmount : bestTrade?.outAmounts[0] || ''),
    [quotePending, isLHToken, lhQuote, bestTrade],
  )

  const toAmount = useMemo(() => {
    if (outAmount && Number(outAmount) > 0 && toAsset) {
      return fromWei(outAmount, toAsset.decimals).toString(10)
    }
    return ''
  }, [toAsset, outAmount])

  const minimumReceived = useMemo(() => {
    if (!toAsset || !outAmount) return ''
    if (isLHToken) {
      return `${formatAmount(fromWei(outAmount, toAsset.decimals))} ${toAsset.symbol}`
    }
    return `${formatAmount(fromWei(outAmount, toAsset.decimals))} ${toAsset.symbol}`
  }, [outAmount, toAsset, isLHToken])

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

  // const selections = useMemo(
  //   () => [
  //     {
  //       label: 'Market',
  //       active: pathname.includes('/swap'),
  //       onClickHandler: () => {
  //         push('/swap')
  //       },
  //     },
  //     {
  //       label: 'Limit',
  //       active: pathname === '/pools',
  //       onClickHandler: () => {
  //         push('/swap')
  //       },
  //     },
  //     {
  //       label: 'TWAP',
  //       active: pathname === '/dashboard',
  //       onClickHandler: () => {
  //         push('/swap')
  //       },
  //     },
  //   ],
  //   [pathname, push],
  // )

  const percents = useMemo(
    () => [
      {
        label: t('10%'),
        onClickHandler: () => setFromAmount(fromAsset.balance.times(0.1).toString(10)),
      },
      {
        label: t('25%'),
        onClickHandler: () => setFromAmount(fromAsset.balance.times(0.25).toString(10)),
      },
      {
        label: t('50%'),
        onClickHandler: () => setFromAmount(fromAsset.balance.times(0.5).toString(10)),
      },
      {
        label: t('Max'),
        onClickHandler: () => setFromAmount(fromAsset.balance.toString(10)),
      },
    ],
    [fromAsset, setFromAmount, t],
  )

  const handleSwap = useCallback(() => {
    const dexOutAmount = bestTrade?.outAmounts[0]
    liquidityHub.analytics.initSwap({
      fromAsset,
      toAsset,
      fromAmount,
      toAmount,
      slippage,
      lhQuote,
      dexOutAmount,
      isDexTrade,
    })
    if (isDexTrade) {
      onOdosSwap(fromAsset, toAsset, fromAmount, toAmount, bestTrade, () => {
        setFromAmount('')
        mutateAssets()
      })
    } else {
      onLHSwap({
        fromAsset,
        toAsset,
        fromAmount,
        setFromAddress,
        outAmount,
        quote: lhQuote,
        callback: () => {
          setFromAmount('')
          mutateAssets()
        },
      })
    }
  }, [
    fromAsset,
    toAsset,
    fromAmount,
    toAmount,
    bestTrade,
    onOdosSwap,
    onLHSwap,
    outAmount,
    setFromAddress,
    isDexTrade,
    slippage,
    mutateAssets,
    lhQuote,
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
      <Box className='w-full max-w-[480px]'>
        <div className='mb-3 flex items-center justify-between'>
          <h2>{t('Swap')}</h2>
          <div className='flex items-center gap-2'>
            {/* <Selection data={selections} /> */}
            <TxnSettings />
          </div>
        </div>
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
                setFromAddress(toAsset.address)
                setToAddress(fromAsset.address)
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
            disabled={!fromAmount || quotePending || swapPending || LHSwapPending || wrapPending || btnMsg.isError}
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
      <div className='flex w-full max-w-[920px] flex-col gap-4'>
        <SwapChart asset0={toAsset} asset1={fromAsset} />
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
              {isDexTrade && (
                <div className={cn('-mx-4 lg:-mx-6', bestTrade && '-mb-[100px]')}>
                  {bestTrade && <NextImage className='w-full' src={bestTrade.pathVizImage} alt='best route' />}
                </div>
              )}
              {!!lhQuote?.outAmount && Number(lhQuote?.outAmount) > 0 && !isDexTrade && <LiquidityHubRouting />}
            </div>
          )}
        </Box>
      </div>
      <WarningModal popup={isWarning} setPopup={setIsWarning} priceImpact={priceImpact} handleSwap={handleSwap} />
    </>
  )
}
