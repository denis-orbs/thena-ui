'use client'

import BigNumber from 'bignumber.js'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useMemo, useState } from 'react'

import WarningModal from '@/app/swap/WarningModal'
import { Alert } from '@/components/alert'
import Box from '@/components/box'
import { EmphasisButton } from '@/components/buttons/Button'
import ConnectButton from '@/components/buttons/ConnectButton'
import { EmphasisIconButton } from '@/components/buttons/IconButton'
import NextImage from '@/components/image/NextImage'
import CustomTokenInput from '@/components/input/CustomTokenInput'
import Skeleton from '@/components/skeleton'
import Tabs from '@/components/tabs'
import { Paragraph, TextHeading } from '@/components/typography'
import { useCurrency } from '@/hooks/fusion/Tokens'
import { useBestV3TradeExactIn } from '@/hooks/fusion/useBestV3Trade'
import useDebounce from '@/hooks/useDebounce'
import { useGet1InchSwapData, useGetOOESwapData, useTCSpotAlgebraSwap, useTCSpotOOESwap } from '@/hooks/useSwap'
import { tryParseAmount } from '@/lib/fusion'
import { formatAmount, fromWei, isInvalidAmount, toWei } from '@/lib/utils'
import useWallet from '@/lib/wallets/useWallet'
import SwapChart from '@/modules/SwapChart'
import { useChainSettings, useSettings } from '@/state/settings/hooks'
import { InfoIcon, SwitchVerticalIcon } from '@/svgs'

import SettingSideBar, { serviceList } from './SettingSideBar'

export function SideBar({
  fromAsset,
  toAsset,
  setFromAsset,
  setToAsset,
  isWrap,
  isUnwrap,
  onWrap,
  onUnwrap,
  wrapPending,
  assets,
  tcSpot,
  children,
}) {
  const t = useTranslations()
  const [fromAddress, setFromAddress] = useState(fromAsset?.address)
  const [isWarning, setIsWarning] = useState(false)
  const { account } = useWallet()
  const { slippage, deadline } = useSettings()
  const { networkId } = useChainSettings()
  const [fromTokenAmount, setFromTokenAmount] = useState('')
  const [toTokenAmount, setToTokenAmount] = useState('')
  const [minimumReceived, setMinimumReceived] = useState(0)
  const [ooeData, setOoeData] = useState('')
  const [service, setService] = useState(serviceList[0])
  // const [realizedLPFee, setRealizedLPFee] = useState(0)
  // const [priceImpactAlg, setPriceImpactAlg] = useState(0)

  const inCurrency = useCurrency(fromAsset ? fromAsset.address : undefined)
  const outCurrency = useCurrency(toAsset ? toAsset.address : undefined)
  const parsedAmount = tryParseAmount(fromTokenAmount, inCurrency ?? undefined)
  const bestV3TradeExactIn = useBestV3TradeExactIn(parsedAmount, outCurrency ?? undefined)

  const v3Trade = bestV3TradeExactIn ?? undefined
  const bestTrade = v3Trade.trade ?? undefined

  useEffect(() => {
    if (service === 'Algebra') {
      if (bestTrade) {
        const outputAmount = bestTrade.outputAmount?.toExact()
        if (outputAmount) {
          setToTokenAmount(outputAmount)
          setMinimumReceived(outputAmount * ((100 - slippage) / 100))
          // TODO
          // const realizedLpFeePercent = computeRealizedLPFeePercent(bestTrade)
          // const realizedLPFeeVal = bestTrade.inputAmount.multiply(realizedLpFeePercent)
          // const priceImpactVal = bestTrade.priceImpact.subtract(realizedLpFeePercent)
          // setPriceImpactAlg(priceImpactVal)
          // setRealizedLPFee(realizedLPFeeVal)
          // console.log({ priceImpactVal, realizedLPFeeVal })
        }
      } else {
        setToTokenAmount('')
      }
    }
  }, [bestTrade, service, slippage])

  const debouncedFromTokenAmount = useDebounce(fromTokenAmount, 200)

  const { data: ooeQuoteData, isLoading } = useGetOOESwapData(
    fromAddress,
    toAsset?.address,
    debouncedFromTokenAmount,
    slippage,
    networkId,
    account,
    Boolean(
      service === 'OOE' &&
        fromAddress &&
        toAsset?.address &&
        !isInvalidAmount(debouncedFromTokenAmount) &&
        fromAddress.toLowerCase() !== toAsset?.address?.toLowerCase(),
    ),
  )

  const { data: oneInchQuoteData, isLoading: isLoadingOneInch } = useGet1InchSwapData(
    fromAddress,
    toAsset?.address,
    debouncedFromTokenAmount,
    slippage,
    networkId,
    account,
    Boolean(
      service === '1inch' &&
        fromAddress &&
        toAsset?.address &&
        !isInvalidAmount(debouncedFromTokenAmount) &&
        fromAddress.toLowerCase() !== toAsset?.address?.toLowerCase(),
    ),
  )

  const { onSwap: onSwapOOE, pending: pendingOOE } = useTCSpotOOESwap()
  const { onSwap: onSwapAlgebra, pending: pendingAlg } = useTCSpotAlgebraSwap()

  useEffect(() => {
    if (ooeQuoteData?.code === 200 && ooeQuoteData?.data) {
      setToTokenAmount(fromWei(ooeQuoteData.data.outAmount, ooeQuoteData.data.outToken.decimals))
      setMinimumReceived(fromWei(ooeQuoteData.data.minOutAmount, ooeQuoteData.data.outToken.decimals))
      setOoeData(ooeQuoteData.data.data)
    } else {
      setToTokenAmount('')
    }
  }, [ooeQuoteData])

  useEffect(() => {
    console.log({ oneInchQuoteData })
    // if (oneInchQuoteData?.code === 200 && ooeQuoteData?.data) {
    //   setToTokenAmount(fromWei(ooeQuoteData.data.outAmount, ooeQuoteData.data.outToken.decimals))
    //   setMinimumReceived(fromWei(ooeQuoteData.data.minOutAmount, ooeQuoteData.data.outToken.decimals))
    //   setOoeData(ooeQuoteData.data.data)
    // } else {
    //   setToTokenAmount('')
    // }
  }, [oneInchQuoteData])

  useEffect(() => {
    if (fromAddress !== fromAddress?.address) {
      setFromAddress(fromAsset?.address)
    }
  }, [fromAddress, fromAsset?.address])

  const priceImpact = useMemo(() => {
    if (fromAsset && toAsset && debouncedFromTokenAmount && toTokenAmount) {
      const fromInUsd = new BigNumber(debouncedFromTokenAmount).times(fromAsset.price)
      const toInUsd = new BigNumber(toTokenAmount).times(toAsset.price)
      return new BigNumber(((fromInUsd - toInUsd) / fromInUsd) * 100).toNumber()
    }
    return 0
  }, [fromAsset, toAsset, debouncedFromTokenAmount, toTokenAmount])

  const percents = useMemo(
    () => [
      {
        label: '10%',
        onClickHandler: () => setFromTokenAmount(fromAsset.balance.times(0.1).toString(10)),
      },
      {
        label: '25%',
        onClickHandler: () => setFromTokenAmount(fromAsset.balance.times(0.25).toString(10)),
      },
      {
        label: '50%',
        onClickHandler: () => setFromTokenAmount(fromAsset.balance.times(0.5).toString(10)),
      },
      {
        label: 'Max',
        onClickHandler: () => setFromTokenAmount(fromAsset.balance.toString(10)),
      },
    ],
    [fromAsset, setFromTokenAmount],
  )

  const handleSwap = useCallback(async () => {
    switch (service) {
      case 'Algebra':
        await onSwapAlgebra(
          fromAsset,
          toAsset,
          toWei(debouncedFromTokenAmount),
          toWei(minimumReceived, 17), // TODO
          tcSpot,
          slippage,
          deadline,
        )
        break
      default:
        await onSwapOOE(ooeData, fromAsset, toAsset, tcSpot)
        break
    }
  }, [
    service,
    onSwapAlgebra,
    fromAsset,
    toAsset,
    debouncedFromTokenAmount,
    tcSpot,
    slippage,
    deadline,
    onSwapOOE,
    ooeData,
    minimumReceived,
  ])

  const btnMsg = useMemo(() => {
    if (!fromAsset || !toAsset) {
      return {
        isError: true,
        label: t('Select a Token'),
      }
    }

    if (isInvalidAmount(debouncedFromTokenAmount)) {
      return {
        isError: true,
        label: t('Enter an amount'),
      }
    }

    if (fromAsset.balance && fromAsset.balance.lt(debouncedFromTokenAmount)) {
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

    if (!toTokenAmount) {
      return {
        isError: true,
        label: t('Insufficient liquidity for this trade'),
      }
    }

    return {
      isError: false,
      label: t('Swap'),
    }
  }, [fromAsset, debouncedFromTokenAmount, isUnwrap, isWrap, t, toAsset, toTokenAmount])

  return (
    <>
      <div className='grid grid-cols-12 gap-4 lg:gap-12'>
        <div className='col-span-12 lg:col-span-7'>
          <div className='flex w-full max-w-[920px] flex-col gap-4'>
            <SwapChart asset0={toAsset} asset1={fromAsset} />
            <Box className='flex flex-col gap-4'>
              <div className='flex justify-between'>
                <TextHeading className='text-xl'>{t('Order Routing')}</TextHeading>
                {/* <TextButton
                  className='text-xs'
                  iconClassName='lg:h-4 lg:w-4'
                  onClick={() => mutate()}
                  LeadingIcon={RefreshIcon}
                >
                  {t('Refresh Quote')}
                </TextButton> */}
              </div>
              {isLoading || isLoadingOneInch ? (
                <Skeleton className='h-[100px] w-full' />
              ) : (
                <div>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      <NextImage src={fromAsset?.logoURI} alt='' className='h-5 w-5' />
                      <Paragraph>
                        {formatAmount(fromTokenAmount)} {fromAsset?.symbol}
                      </Paragraph>
                    </div>
                    <div className='flex items-center gap-2'>
                      <Paragraph>
                        {formatAmount(toTokenAmount)} {toAsset?.symbol}
                      </Paragraph>
                      <NextImage src={toAsset?.logoURI} alt='' className='h-5 w-5' />
                    </div>
                  </div>
                  {/* {isDexTrade && (
                    <div className={cn('-mx-4 lg:-mx-6', bestTrade && '-mb-[100px]')}>
                      {bestTrade && <NextImage className='w-full' src={bestTrade.pathVizImage} alt='best route' />}
                    </div>
                  )}
                  {!!lhQuote?.outAmount && Number(lhQuote?.outAmount) > 0 && !isDexTrade && <LiquidityHubRouting />} */}
                </div>
              )}
            </Box>
          </div>
          <div>{children}</div>
        </div>

        <div className='col-span-12 lg:sticky lg:top-56 lg:col-span-5 lg:max-h-[550px]'>
          <Box className='w-full max-w-[480px]'>
            <div className='mb-3 flex items-center justify-between'>
              <h2>{t('Swap')}</h2>
              <div className='flex items-center gap-2'>
                <SettingSideBar service={service} setService={setService} />
              </div>
            </div>
            <div className='my-3 flex flex-col items-end gap-2'>
              <Tabs data={percents} />
              <div className='relative flex w-full flex-col gap-2'>
                <CustomTokenInput
                  asset={fromAsset}
                  setAsset={asset => {
                    if (asset.address === toAsset.address) {
                      setToAsset(fromAsset)
                    }
                    setFromAsset(asset)
                  }}
                  amount={fromTokenAmount}
                  setAmount={setFromTokenAmount}
                  assets={assets}
                  autoFocus
                  hasTabs={false}
                />
                <CustomTokenInput
                  asset={toAsset}
                  setAsset={asset => {
                    if (asset.address === fromAsset.address) {
                      setFromAsset(toAsset)
                    }
                    setToAsset(asset)
                  }}
                  amount={toTokenAmount}
                  assets={assets}
                  hasTabs={false}
                  disabled
                />
                <EmphasisIconButton
                  className='z-1 absolute bottom-0 left-0 right-0 top-0 m-auto'
                  Icon={SwitchVerticalIcon}
                  onClick={() => {
                    setFromAsset(toAsset)
                    setToAsset(fromAsset)
                  }}
                />
              </div>
            </div>
            {toTokenAmount && !isLoading && !isLoadingOneInch && (
              <div className='flex flex-col gap-2 py-3'>
                <div className='flex items-center justify-between'>
                  <TextHeading>{t('Rate')}</TextHeading>
                  <Paragraph>
                    {`${formatAmount(new BigNumber(toTokenAmount).div(fromTokenAmount))} ${t(
                      '[symbolA] per [symbolB]',
                      {
                        symbolA: toAsset.symbol,
                        symbolB: fromAsset.symbol,
                      },
                    )}`}
                  </Paragraph>
                </div>
                <div className='flex items-center justify-between'>
                  <TextHeading>{t('Minimum Received')}</TextHeading>
                  <Paragraph>
                    {new BigNumber(minimumReceived).toNumber()} {toAsset.symbol}
                  </Paragraph>
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
                disabled={!debouncedFromTokenAmount || wrapPending || pendingOOE || pendingAlg || btnMsg.isError}
                onClick={() => {
                  if (priceImpact > 5) {
                    setIsWarning(true)
                  } else if (isWrap) {
                    onWrap(debouncedFromTokenAmount)
                  } else if (isUnwrap) {
                    onUnwrap(debouncedFromTokenAmount)
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
        </div>

        <WarningModal popup={isWarning} setPopup={setIsWarning} priceImpact={priceImpact} handleSwap={handleSwap} />
      </div>
    </>
  )
}
