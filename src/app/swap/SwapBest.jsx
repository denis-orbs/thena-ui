'use client'

import { useWeb3Modal } from '@web3modal/wagmi/react'
import BigNumber from 'bignumber.js'
import { Fragment, useCallback, useMemo, useState } from 'react'

import { Alert } from '@/components/alert'
import Box from '@/components/box'
import { EmphasisButton, PrimaryButton, TextButton } from '@/components/buttons/Button'
import { EmphasisIconButton } from '@/components/buttons/IconButton'
import NextImage from '@/components/image/NextImage'
import TokenInput from '@/components/input/TokenInput'
import Skeleton from '@/components/skeleton'
import Tabs from '@/components/tabs'
import { Paragraph, TextHeading } from '@/components/typography'
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
  const [fromAmount, setFromAmount] = useState('')
  const [isWarning, setIsWarning] = useState(false)
  const { open } = useWeb3Modal()
  const { account } = useWallet()
  const { slippage } = useSettings()
  const { networkId } = useChainSettings()
  const debouncedAmount = useDebounce(fromAmount)
  const {
    data: bestTrade,
    isLoading: bestTradePending,
    mutate,
  } = useOdosQuoteSwap(account, fromAsset, toAsset, debouncedAmount, slippage, networkId)
  const { onOdosSwap, swapPending } = useOdosSwap()
  const { mutate: onLHSwap, isLoading: LHSwapPending } = liquidityHub.useSwap()
  const {
    data: lhQuote,
    error: lhQuoteError,
    isLoading: lhQuotePending,
  } = liquidityHub.useQuoteQuery(fromAsset, toAsset, debouncedAmount, bestTrade?.outAmounts[0])
  const isDexTrade = liquidityHub.useIsDexTrade(bestTrade?.outAmounts[0], lhQuote?.outAmount, lhQuoteError)
  const quotePending = bestTradePending || lhQuotePending
  const outAmount = quotePending ? '' : isDexTrade ? bestTrade?.outAmounts[0] : lhQuote?.outAmount || ''
  const toAmount = useMemo(() => {
    if (outAmount && toAsset) {
      return fromWei(outAmount, toAsset.decimals).toString(10)
    }
    return ''
  }, [toAsset, outAmount])

  const minimumReceived = useMemo(() => {
    if (!toAsset || !outAmount) return ''
    if (isDexTrade) {
      return `${formatAmount(
        fromWei(outAmount, toAsset.decimals)
          .times(100 - slippage)
          .div(100),
      )} ${toAsset.symbol}`
    }
    return `${formatAmount(fromWei(outAmount, toAsset.decimals))} ${toAsset.symbol}`
  }, [outAmount, toAsset, slippage, isDexTrade])

  const priceImpact = useMemo(() => {
    if (quotePending) return 0
    if (isDexTrade) {
      return !bestTrade ? 0 : Math.abs(bestTrade.priceImpact)
    }
    if (fromAsset && toAsset && fromAmount && toAmount) {
      const fromInUsd = new BigNumber(fromAmount).times(fromAsset.price)
      const toInUsd = new BigNumber(toAmount).times(toAsset.price)
      return new BigNumber(((fromInUsd - toInUsd) / fromInUsd) * 100).toNumber()
    }
    return 0
  }, [isDexTrade, bestTrade, fromAsset, toAsset, fromAmount, toAmount, quotePending])

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

  // const getTokenFromAddress = useCallback(
  //   address => {
  //     if (
  //       ['0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c'].includes(
  //         address.toLowerCase(),
  //       )
  //     ) {
  //       return assets.find(asset => asset.address === 'BNB')
  //     }
  //     const found = assets.find(asset => asset.address.toLowerCase() === address.toLowerCase())
  //     return found
  //   },
  //   [assets],
  // )

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
      onOdosSwap(fromAsset, toAsset, fromAmount, toAmount, bestTrade, () => setFromAmount(''))
    } else {
      onLHSwap({ fromAsset, toAsset, fromAmount, setFromAddress, quote: lhQuote, callback: () => setFromAmount('') })
    }
  }, [
    fromAsset,
    toAsset,
    fromAmount,
    toAmount,
    bestTrade,
    onOdosSwap,
    onLHSwap,
    setFromAddress,
    isDexTrade,
    lhQuote,
    slippage,
  ])

  const btnMsg = useMemo(() => {
    if (!fromAsset || !toAsset) {
      return {
        isError: true,
        label: 'Select a Token',
      }
    }

    if (isInvalidAmount(fromAmount)) {
      return {
        isError: true,
        label: 'Enter an amount',
      }
    }

    if (fromAsset.balance && fromAsset.balance.lt(fromAmount)) {
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

    if (!toAmount) {
      return {
        isError: true,
        label: 'Insufficient liquidity for this trade',
      }
    }

    return {
      isError: false,
      label: 'Swap',
    }
  }, [fromAsset, toAsset, fromAmount, toAmount, isWrap, isUnwrap])

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
              <TextHeading>Rate</TextHeading>
              <Paragraph>
                {`${formatAmount(new BigNumber(toAmount).div(fromAmount))} ${toAsset.symbol} per ${fromAsset.symbol}`}
              </Paragraph>
            </div>
            <div className='flex items-center justify-between'>
              <TextHeading>Minimum Received</TextHeading>
              <Paragraph>{minimumReceived}</Paragraph>
            </div>
            <div className='flex items-center justify-between'>
              <TextHeading>Price Impact</TextHeading>
              <Paragraph>{formatAmount(priceImpact)}%</Paragraph>
            </div>
            {priceImpact > 5 && (
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
          <PrimaryButton className='mt-3 w-full' onClick={() => open()}>
            Connect Wallet
          </PrimaryButton>
        )}
      </Box>
      <div className='flex w-full max-w-[920px] flex-col gap-4'>
        <SwapChart asset0={toAsset} asset1={fromAsset} />
        <Box className='flex flex-col gap-4'>
          <div className='flex justify-between'>
            <TextHeading className='text-xl'>Order Routing</TextHeading>
            <TextButton
              className='text-xs'
              iconClassName='lg:h-4 lg:w-4'
              onClick={() => mutate()}
              LeadingIcon={RefreshIcon}
            >
              Refresh Quote
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
              {!!lhQuote?.outAmount && !isDexTrade && <LiquidityHubRouting />}
            </div>
          )}
        </Box>
      </div>
      <WarningModal popup={isWarning} setPopup={setIsWarning} priceImpact={priceImpact} handleSwap={handleSwap} />
    </>
  )
}
