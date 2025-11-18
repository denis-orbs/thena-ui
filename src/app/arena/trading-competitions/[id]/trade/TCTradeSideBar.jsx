'use client'

import BigNumber from 'bignumber.js'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { JSBI, Percent } from 'thena-sdk-core'

import WarningModal from '@/app/swap/WarningModal'
import { Alert } from '@/components/alert'
import Box from '@/components/box'
import { EmphasisButton, TextButton } from '@/components/buttons/Button'
import ConnectButton from '@/components/buttons/ConnectButton'
import { EmphasisIconButton } from '@/components/buttons/IconButton'
import NextImage from '@/components/image/NextImage'
import CustomTokenInput from '@/components/input/CustomTokenInput'
import Skeleton from '@/components/skeleton'
import Tabs from '@/components/tabs'
import { Paragraph, TextHeading } from '@/components/typography'
import { useTradingCompetition } from '@/context/tradingCompetitionContext'
import { useCurrency } from '@/hooks/fusion/Tokens'
import { useBestV3TradeExactIn } from '@/hooks/fusion/useBestV3Trade'
import useDebounce from '@/hooks/useDebounce'
import {
  useGet1InchSwapData,
  useGetOdosTxSwap,
  useGetOOESwapData,
  useOdosQuoteSwapTradeTC,
  useTCSpot1InchSwap,
  useTCSpotAlgebraSwap,
  useTCSpotOdosSwap,
  useTCSpotOOESwap,
} from '@/hooks/useSwap'
import useWallet from '@/hooks/useWallet'
import InfoIcon from '@/icons/InfoIcon'
import { tryParseAmount } from '@/lib/fusion'
import { computeRealizedLPFeePercent } from '@/lib/fusion/computeRealizedLPFeePercent'
import CandleStickChart from '@/modules/SwapChart/CandleStickChart'
import { useChainSettings, useSettings } from '@/state/settings/hooks'
import { formatAmount, fromWei, isInvalidAmount, toWei } from '@/utils/utils'

import RefreshIcon from '~/svgs/refresh.svg'
import SwitchVerticalIcon from '~/svgs/switch-vertical.svg'

import SettingSideBar, { serviceList } from './SettingSideBar'

export function TCTradeSideBar({
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
  tcAddress,
  children,
  reloadBalanceData,
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
  const [oneInchData, setOneInchData] = useState('')
  const [service, setService] = useState(serviceList[3])
  const [isResetChart, setResetChart] = useState(false)

  const { handleReloadFetch } = useTradingCompetition()

  const inCurrency = useCurrency(fromAsset ? fromAsset.address : undefined)
  const outCurrency = useCurrency(toAsset ? toAsset.address : undefined)
  const parsedAmount = tryParseAmount(fromTokenAmount, inCurrency ?? undefined)
  const bestV3TradeExactIn = useBestV3TradeExactIn(parsedAmount, outCurrency ?? undefined)

  const bestTrade = useMemo(() => {
    const v3Trade = bestV3TradeExactIn ?? undefined
    const bestTradeTmp = v3Trade?.trade ?? undefined

    return bestTradeTmp
  }, [bestV3TradeExactIn])

  const allowedSlippage = useMemo(() => new Percent(JSBI.BigInt(slippage * 100), JSBI.BigInt(10000)), [slippage])

  const debouncedFromTokenAmount = useDebounce(fromTokenAmount, 200)

  const { data: ooeQuoteData, isLoading } = useGetOOESwapData(
    fromAddress,
    toAsset?.address,
    debouncedFromTokenAmount,
    slippage,
    networkId,
    tcAddress,
    Boolean(
      service === 'OOE' &&
        fromAddress &&
        toAsset?.address &&
        !isInvalidAmount(debouncedFromTokenAmount) &&
        fromAddress.toLowerCase() !== toAsset?.address?.toLowerCase(),
    ),
  )

  const {
    data: quoteOdos,
    isLoading: _isLoadingGetOdos,
    mutate,
  } = useOdosQuoteSwapTradeTC(
    tcAddress,
    fromAddress,
    toAsset?.address,
    debouncedFromTokenAmount,
    slippage,
    networkId,
    Boolean(
      service === 'Odos' &&
        fromAddress &&
        toAsset?.address &&
        !isInvalidAmount(debouncedFromTokenAmount) &&
        fromAddress.toLowerCase() !== toAsset?.address?.toLowerCase(),
    ),
    fromAsset?.decimals,
  )

  const { data: _txOdos, isLoading: _isLoadingTxOdos } = useGetOdosTxSwap(tcAddress, quoteOdos)

  const { data: oneInchQuoteData, isLoading: isLoadingOneInch } = useGet1InchSwapData(
    fromAddress,
    toAsset?.address,
    toWei(debouncedFromTokenAmount, fromAsset?.decimals),
    slippage,
    networkId,
    tcAddress,
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
  const { onSwap: onSwap1inch, pending: pending1inch } = useTCSpot1InchSwap()
  const { onSwap: onSwapOdos, pending: pendingOdos } = useTCSpotOdosSwap()

  useEffect(() => {
    if (service === 'Odos') {
      if (quoteOdos && quoteOdos.outAmounts) {
        setToTokenAmount(fromWei(quoteOdos.outAmounts[0], toAsset?.decimals))
        setMinimumReceived(fromWei(quoteOdos.outAmounts[0], toAsset?.decimals) * ((100 - slippage) / 100))
      } else {
        setToTokenAmount('')
      }
    }
  }, [quoteOdos, service, slippage, toAsset?.decimals])

  useEffect(() => {
    if (service === '1inch') {
      if (oneInchQuoteData && oneInchQuoteData.toAmount && oneInchQuoteData.tx) {
        setToTokenAmount(fromWei(oneInchQuoteData.toAmount, toAsset?.decimals))
        setMinimumReceived(fromWei(oneInchQuoteData.toAmount, toAsset?.decimals) * ((100 - slippage) / 100))
        setOneInchData(oneInchQuoteData.tx.data)
      } else {
        setToTokenAmount('')
      }
    }
  }, [oneInchQuoteData, oneInchQuoteData?.toAmount, service, slippage, toAsset?.decimals])

  useEffect(() => {
    if (service === 'Algebra') {
      if (bestTrade) {
        const outputAmount = bestTrade.outputAmount?.toExact()
        if (outputAmount) {
          setToTokenAmount(outputAmount)
          setMinimumReceived(bestTrade.minimumAmountOut(allowedSlippage).toSignificant(10) * 0.95)
        }
      } else {
        setToTokenAmount('')
      }
    }
  }, [allowedSlippage, bestTrade, service, slippage])

  useEffect(() => {
    if (service === 'OOE') {
      if (ooeQuoteData?.code === 200 && ooeQuoteData?.data) {
        setToTokenAmount(fromWei(ooeQuoteData.data.outAmount, ooeQuoteData.data.outToken.decimals))
        setMinimumReceived(fromWei(ooeQuoteData.data.minOutAmount, ooeQuoteData.data.outToken.decimals))
        setOoeData(ooeQuoteData.data.data)
      } else {
        setToTokenAmount('')
      }
    }
  }, [ooeQuoteData, service])

  useEffect(() => {
    if (fromAddress !== fromAddress?.address) {
      setFromAddress(fromAsset?.address)
    }
  }, [fromAddress, fromAsset?.address])

  const { priceImpact, realizedLPFee } = useMemo(() => {
    if (fromAsset && toAsset && debouncedFromTokenAmount && toTokenAmount) {
      if (service === 'Algebra') {
        if (bestTrade) {
          const realizedLpFeePercent = computeRealizedLPFeePercent(bestTrade)
          const realizedLPFeeVal = bestTrade.inputAmount.multiply(realizedLpFeePercent)
          const priceImpactVal = bestTrade.priceImpact.subtract(realizedLpFeePercent)
          return { priceImpact: priceImpactVal.toSignificant(4), realizedLPFee: realizedLPFeeVal }
        }
        return { priceImpact: 0, realizedLPFee: 0 }
      }

      const fromInUsd = new BigNumber(debouncedFromTokenAmount).times(fromAsset.price)
      const toInUsd = new BigNumber(toTokenAmount).times(toAsset.price)
      return { priceImpact: new BigNumber(((fromInUsd - toInUsd) / fromInUsd) * 100).toNumber() }
    }
    return { priceImpact: 0, realizedLPFee: 0 }
  }, [fromAsset, toAsset, debouncedFromTokenAmount, toTokenAmount, service, bestTrade])

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
    let isSuccess = false

    switch (service) {
      case 'Algebra':
        isSuccess = await onSwapAlgebra(
          fromAsset,
          toAsset,
          toWei(debouncedFromTokenAmount, fromAsset?.decimals),
          toWei(minimumReceived),
          tcAddress,
          deadline,
        )
        break
      case '1inch':
        isSuccess = await onSwap1inch(oneInchData, fromAsset, toAsset, tcAddress)
        break
      case 'Odos':
        isSuccess = await onSwapOdos(_txOdos, fromAsset, toAsset, tcAddress)
        break
      default:
        isSuccess = await onSwapOOE(ooeData, fromAsset, toAsset, tcAddress)
        break
    }

    if (isSuccess) {
      reloadBalanceData()
      if (handleReloadFetch) {
        handleReloadFetch()
      }
    }
  }, [
    service,
    onSwapAlgebra,
    fromAsset,
    toAsset,
    debouncedFromTokenAmount,
    minimumReceived,
    tcAddress,
    deadline,
    onSwap1inch,
    oneInchData,
    onSwapOdos,
    _txOdos,
    onSwapOOE,
    ooeData,
    reloadBalanceData,
    handleReloadFetch,
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
            <CandleStickChart
              asset0={toAsset}
              asset1={fromAsset}
              isResetChart={isResetChart}
              setResetChart={setResetChart}
            />
            <Box className='flex flex-col gap-4'>
              <div className='flex justify-between'>
                <TextHeading className='text-xl'>{t('Order Routing')}</TextHeading>
              </div>
              {isLoading || isLoadingOneInch ? (
                <Skeleton className='h-[100px] w-full' />
              ) : service !== 'Odos' ? (
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
                </div>
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
                  <div>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-2'>
                        <NextImage src={fromAsset?.logoURI} alt='' className='h-5 w-5' />
                        <Paragraph>
                          {formatAmount(debouncedFromTokenAmount)} {fromAsset?.symbol}
                        </Paragraph>
                      </div>
                      <div className='flex items-center gap-2'>
                        <Paragraph>
                          {formatAmount(toTokenAmount)} {toAsset?.symbol}
                        </Paragraph>
                        <NextImage src={toAsset?.logoURI} alt='' className='h-5 w-5' />
                      </div>
                    </div>
                  </div>
                </Box>
              )}
            </Box>
          </div>
        </div>

        <div className='col-span-12 lg:top-56 lg:col-span-5 lg:max-h-[550px]'>
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
                    setResetChart(true)
                    if (asset?.address === toAsset?.address) {
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
                    setResetChart(true)
                    if (asset.address === fromAsset?.address) {
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
                  className='absolute top-0 right-0 bottom-0 left-0 z-1 m-auto'
                  Icon={SwitchVerticalIcon}
                  onClick={() => {
                    setResetChart(true)
                    setFromAsset(toAsset)
                    setToAsset(fromAsset)
                  }}
                />
              </div>
            </div>
            {toTokenAmount && !isLoading && !isLoadingOneInch && (
              <div className='flex flex-col gap-2 py-3'>
                <div className='flex items-center justify-between'>
                  <TextHeading>{t('Slippage Tolerance')}</TextHeading>
                  <Paragraph>{slippage} %</Paragraph>
                </div>
                <div className='flex items-center justify-between'>
                  <TextHeading>{t('Option')}</TextHeading>
                  <Paragraph>{service}</Paragraph>
                </div>
                <div className='flex items-center justify-between'>
                  <TextHeading>{t('Rate')}</TextHeading>
                  <Paragraph>
                    {`${formatAmount(new BigNumber(toTokenAmount).div(fromTokenAmount))} ${t(
                      '[symbolA] per [symbolB]',
                      {
                        symbolA: toAsset?.symbol,
                        symbolB: fromAsset?.symbol,
                      },
                    )}`}
                  </Paragraph>
                </div>
                <div className='flex items-center justify-between'>
                  <TextHeading>{t('Minimum Received')}</TextHeading>
                  <Paragraph className='text-right'>
                    {new BigNumber(minimumReceived).toNumber()} {toAsset?.symbol}
                  </Paragraph>
                </div>
                <div className='flex items-center justify-between'>
                  <TextHeading>{t('Price Impact')}</TextHeading>
                  <Paragraph>{formatAmount(priceImpact)}%</Paragraph>
                </div>
                {service === 'Algebra' && (
                  <div className='flex items-center justify-between'>
                    <TextHeading>{t('Liquidity Provider Fee')}</TextHeading>
                    <Paragraph>
                      {realizedLPFee ? `${realizedLPFee.toSignificant(4)} ${realizedLPFee.currency.symbol}` : '-'}
                    </Paragraph>
                  </div>
                )}
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
                  !debouncedFromTokenAmount ||
                  wrapPending ||
                  pendingOOE ||
                  pendingAlg ||
                  pending1inch ||
                  pendingOdos ||
                  btnMsg.isError
                }
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
      <div>{children}</div>
    </>
  )
}
