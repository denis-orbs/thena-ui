import BigNumber from 'bignumber.js'
import { useTranslations } from 'next-intl'
import React, { useCallback, useMemo, useState } from 'react'
import { WBNB } from 'thena-sdk-core'
import { zeroAddress } from 'viem'
import { useReadContract, useReadContracts } from 'wagmi'

import { Alert } from '@/components/alert'
import { EmphasisButton, PrimaryButton, SecondaryButton } from '@/components/buttons/Button'
import ConnectButton from '@/components/buttons/ConnectButton'
import IconGroup from '@/components/icongroup'
import { TokenAmountInput } from '@/components/input/TokenAmountInput'
import Spinner from '@/components/spinner'
import { Paragraph, TextHeading, TextSubHeading } from '@/components/typography'
import { GAMMA_TYPES, PAIR_TYPES } from '@/constant'
import { routerAbi, vammZapAbi } from '@/constant/abi'
import Contracts from '@/constant/contracts'
import useDebounce from '@/hooks/useDebounce'
import { useGetOdosTxSwap, useOdosQuoteSwapTradeTC } from '@/hooks/useSwap'
import useWallet from '@/hooks/useWallet'
import { useGammaZapper, useV1Zapper } from '@/hooks/zapper/useZapper'
import { warnToast } from '@/lib/notify'
import { cn, formatAmount, fromWei, isInvalidAmount, toWei } from '@/lib/utils'
import { InfoIcon } from '@/svgs'

import WarningZapper from './WarningZapper'

const getZapAddress = (strategy, chainId) => {
  if (GAMMA_TYPES.includes(strategy.title)) return { address: Contracts.gammaZap[chainId], isV1: false }
  if (strategy.type === PAIR_TYPES.CLASSIC) {
    return { address: Contracts.classicZap[chainId], routerAddress: Contracts.solidlyRouter[chainId], isV1: true }
  }
  if (strategy.type === PAIR_TYPES.STABLE) {
    return { address: Contracts.stableZap[chainId], routerAddress: Contracts.solidlyRouter[chainId], isV1: true }
  }
}

export function CommonZapperPane({
  asset0,
  asset1,
  strategy,
  onShowModalSuccess,
  handleBack,
  isSmall = false,
  slippage = 0.5,
}) {
  const t = useTranslations()
  const { address: pairAddress, gauge } = strategy
  // const [slippage, setSlippage] = useState(0.5)
  const zapSwapSlippage = 10000 - slippage * 100

  const { account, chainId } = useWallet()
  const [tokenDeposit, setTokenDeposit] = useState(asset0)
  const [amount, setAmount] = useState(0)
  const amountIn = useDebounce(amount, 500)

  const { onAddLiquidity: addZapV1 } = useV1Zapper()
  const { onAddLiquidity: addZapGamma } = useGammaZapper()

  const isUseTokenInPair =
    tokenDeposit.address.toLowerCase() === asset0.address.toLowerCase() ||
    tokenDeposit.address.toLowerCase() === asset1.address.toLowerCase() ||
    (tokenDeposit.address === 'BNB' &&
      (asset1.address === WBNB[chainId].address.toLowerCase() ||
        asset0.address === WBNB[chainId].address.toLowerCase()))

  const { address: zapAddress, routerAddress, isV1 } = getZapAddress(strategy, chainId)

  // Get quote swap to token0/token1 to check best quote
  const { data: quoteO } = useOdosQuoteSwapTradeTC(
    zapAddress,
    tokenDeposit.address === 'BNB' ? WBNB[chainId].address : tokenDeposit.address,
    asset0.address,
    amountIn,
    slippage,
    chainId,
    Boolean(!isInvalidAmount(amountIn) && !isUseTokenInPair),
    tokenDeposit?.decimals,
  )
  const { data: quote1 } = useOdosQuoteSwapTradeTC(
    zapAddress,
    tokenDeposit.address === 'BNB' ? WBNB[chainId].address : tokenDeposit.address,
    asset1.address,
    amountIn,
    slippage,
    chainId,
    Boolean(!isInvalidAmount(amountIn) && !isUseTokenInPair),
    tokenDeposit?.decimals,
  )

  const { data: assemble0, isLoading: isLoading0 } = useGetOdosTxSwap(zapAddress, quoteO)
  const { data: assemble1, isLoading: isLoading1 } = useGetOdosTxSwap(zapAddress, quote1)

  const { bestQuote, tokenIn } = useMemo(() => {
    if (!assemble0 || !assemble1) return { bestQuote: null, tokenIn: null }

    const reciveAmount0 = assemble0[0].outputMin ?? 0n
    const recive0InUsd = fromWei(reciveAmount0, asset0.decimals).times(asset0.price)

    const reciveAmount1 = assemble1[0].outputMin ?? 0n
    const recive1InUsd = fromWei(reciveAmount1, asset1.decimals).times(asset1.price)

    if (recive0InUsd.gt(recive1InUsd)) {
      return {
        bestQuote: assemble0,
        tokenIn: asset0,
      }
    }
    return {
      bestQuote: assemble1,
      tokenIn: asset1,
    }
  }, [assemble0, assemble1, asset0, asset1])

  const tokenInReceiveAmount = fromWei(bestQuote?.[0].outputMin ?? 0n, tokenIn?.decimals)
  const theOther = (isUseTokenInPair ? tokenDeposit.symbol : tokenIn?.symbol) === asset0.symbol ? asset1 : asset0
  const args = isUseTokenInPair
    ? [tokenDeposit.address, toWei(amountIn, tokenDeposit?.decimals), strategy.address]
    : [tokenIn?.address, toWei(tokenInReceiveAmount, tokenIn?.decimals), strategy.address]

  const { data } = useReadContracts({
    contracts: [
      {
        abi: vammZapAbi,
        address: zapAddress,
        functionName: 'getSwapAmount',
        args,
      },
      {
        abi: vammZapAbi,
        address: zapAddress,
        functionName: 'getEstimatedZapIn',
        args,
      },
    ],
    query: {
      enabled: isUseTokenInPair
        ? Boolean(tokenDeposit.address && amountIn && strategy.address)
        : Boolean(tokenIn && tokenInReceiveAmount && strategy.address),
    },
  })

  const [amountToSwap, amountToReceive, liquidityAdded] = useMemo(() => {
    const _amountToSwap = fromWei(data?.[0]?.result?.[0] ?? 0n)
    const _amountToReceive = fromWei(data?.[0]?.result?.[1] ?? 0n)
    const _liquidityAdded = fromWei(data?.[1]?.result ?? 0n)
    return [_amountToSwap, _amountToReceive, _liquidityAdded]
  }, [data])

  const { data: amounts } = useReadContract({
    abi: routerAbi,
    address: routerAddress,
    functionName: 'quoteRemoveLiquidity',
    args: [asset0.address, asset1.address, strategy.type === PAIR_TYPES.STABLE, toWei(liquidityAdded)],
    query: {
      enabled: isV1,
    },
  })

  const amountDepositInUSD = useMemo(() => {
    const amountDeposit = isUseTokenInPair ? amountIn : tokenInReceiveAmount
    const token = isUseTokenInPair ? tokenDeposit : tokenIn
    return new BigNumber(amountDeposit).times(token?.price ?? 0)
  }, [isUseTokenInPair, tokenDeposit, tokenIn, amountIn, tokenInReceiveAmount])

  const amountReceiveInUSD = useMemo(() => {
    if (!amounts) return new BigNumber(0)
    const amountA = fromWei(amounts[0], asset0.decimals)
    const amountB = fromWei(amounts[1], asset1.decimals)
    return amountA.times(asset0.price).plus(amountB.times(asset1.price))
  }, [amounts, asset0, asset1])

  const priceImpact = useMemo(() => {
    if (!amountDepositInUSD || !amountReceiveInUSD) return 0
    return amountDepositInUSD.minus(amountReceiveInUSD).div(amountDepositInUSD).times(100).toNumber()
  }, [amountDepositInUSD, amountReceiveInUSD])

  const handleAddLiquidity = useCallback(
    ({ isStake = true }) => {
      if (isInvalidAmount(amountIn)) {
        warnToast('Invalid Amount')
        return false
      }

      if (BigNumber(amountIn).gt(tokenDeposit?.balance)) {
        warnToast('Insufficient Balance')
        return false
      }

      if (!isUseTokenInPair && !bestQuote) {
        warnToast('Invalid Routing, please try again later')
        return false
      }
      if (isV1) {
        addZapV1(
          {
            tokenDeposit,
            tokenIn,
            amount: amountIn,
            gaugeAddress: isStake && gauge?.address ? gauge.address : null,
            pairAddress,
            zapSwapSlippage,
            odosParams: bestQuote,
            type: strategy.type,
          },
          onShowModalSuccess,
        )
      } else {
        addZapGamma(
          {
            tokenDeposit,
            tokenIn,
            amount: amountIn,
            pairAddress,
            zapSwapSlippage,
            gammaSlippage: Math.floor(slippage * 100),
            odosParams: bestQuote,
          },
          onShowModalSuccess,
        )
      }
    },
    [
      addZapGamma,
      addZapV1,
      amountIn,
      bestQuote,
      gauge?.address,
      isUseTokenInPair,
      isV1,
      onShowModalSuccess,
      pairAddress,
      slippage,
      strategy.type,
      tokenDeposit,
      tokenIn,
      zapSwapSlippage,
    ],
  )

  return (
    <div className='flex flex-col gap-8'>
      <div className='relative flex w-full flex-col gap-2 md:gap-4'>
        <WarningZapper />
        {/* <SettingSlippageDropDown slippage={slippage} updateSlippage={setSlippage} className='mb-0' /> */}
        <div className='flex flex-col gap-2'>
          <TokenAmountInput
            type='number'
            amount={amount}
            setAsset={setTokenDeposit}
            asset={tokenDeposit}
            maxBalance={tokenDeposit?.balance}
            autoFocus
            singleMode
            onAmountChange={setAmount}
            showPercent={false}
            assetsSelect={[]}
            isSmall={isSmall}
            classNames={{ input: 'p-4! gap-2!' }}
          />
          <div
            className={cn(
              'flex gap-3 rounded-xl border border-neutral-600 bg-neutral-900 p-4 text-neutral-50 md:p-6 2xl:p-8',
              !isUseTokenInPair && !tokenIn && 'hidden',
              Number(amountIn) <= 0 && 'hidden',
            )}
          >
            <article className='flex flex-col gap-2'>
              <div className='flex items-center justify-center gap-1 rounded-md bg-[#29292980] p-[6px]'>
                <IconGroup
                  className='*:not-first:-ml-2'
                  classNames={{
                    image: 'outline-2 w-7 h-7',
                  }}
                  logo1={asset0.logoURI}
                  logo2={asset1.logoURI}
                />
                <p className='hidden text-sm text-neutral-200 md:block'>
                  {asset0.symbol}/{asset1.symbol}
                </p>
              </div>
              <p className='flex gap-2'>
                <span>{formatAmount(liquidityAdded)}</span>
                <TextSubHeading className='text-sm'>LP</TextSubHeading>
              </p>
            </article>

            <article>
              <p className='mb-1 text-xl font-medium'>Zapper Route</p>
              <ol className='list-inside list-decimal text-sm'>
                {isUseTokenInPair ? (
                  <>
                    <li>
                      Swap {formatAmount(amountToSwap)} {tokenDeposit.symbol} to {formatAmount(amountToReceive)}{' '}
                      {theOther.symbol}.
                    </li>
                    <li>
                      Build LP using {formatAmount(Number(amountIn) - Number(amountToSwap))} {tokenDeposit.symbol} and{' '}
                      {formatAmount(amountToReceive)} {theOther.symbol} on THENA
                    </li>
                    <li>
                      Deposit estimated {formatAmount(liquidityAdded)} {asset0.symbol}/{asset1.symbol} LP
                    </li>
                  </>
                ) : (
                  <>
                    <li>
                      Swap {formatAmount(amountIn)} {tokenDeposit.symbol} to {formatAmount(tokenInReceiveAmount)}{' '}
                      {tokenIn?.symbol} via ODOS.
                    </li>
                    <li>
                      Swap {formatAmount(amountToSwap)} {tokenIn?.symbol} to {formatAmount(amountToReceive)}{' '}
                      {theOther.symbol}.
                    </li>
                    <li>
                      Build LP using {formatAmount(Number(tokenInReceiveAmount) - Number(amountToSwap))}{' '}
                      {tokenIn?.symbol} and {formatAmount(amountToReceive)} {theOther.symbol} on THENA
                    </li>
                    <li>
                      Deposit estimated {formatAmount(liquidityAdded)} {asset0.symbol}/{asset1.symbol} LP
                    </li>
                  </>
                )}

                <div className='mt-2 flex flex-col gap-2'>
                  <div className='flex items-center gap-2'>
                    <TextHeading className='text-sm lg:text-base'>{t('Price Impact')}:</TextHeading>
                    <Paragraph className='text-neutral-200'> {formatAmount(priceImpact)}%</Paragraph>
                  </div>
                  {priceImpact > 4.9 && (
                    <Alert>
                      <InfoIcon className='stroke-error-600 h-4 w-4' />
                      <p>{t('High Slippage Warning')}</p>
                    </Alert>
                  )}
                </div>
              </ol>
            </article>
          </div>
        </div>
      </div>

      <div
        className={cn(
          'mt-4 hidden border-t border-neutral-700',
          !isUseTokenInPair && (isLoading1 || isLoading0) && 'block',
        )}
      >
        <SecondaryButton className='w-full'>
          Finding Best Quote
          <Spinner className='size-5' />
        </SecondaryButton>
      </div>

      {account ? (
        <div
          className={cn(
            'mt-4 flex w-full flex-col items-center gap-2 lg:flex-row',
            !isUseTokenInPair && (isLoading1 || isLoading0) && 'hidden',
          )}
        >
          <EmphasisButton className='block w-full xl:hidden' onClick={handleBack}>
            {t('Cancel')}
          </EmphasisButton>

          <EmphasisButton
            onClick={() => handleAddLiquidity({ isStake: false })}
            className={cn(
              'w-full',
              'bg-primary-600 text-primary-100 hover:bg-primary-700 hover:text-primary-200 active:bg-primary-600 active:text-primary-100',
              gauge && strategy.version !== 2 && 'hidden',
              gauge?.address !== zeroAddress && strategy.version !== 2 && 'hidden',
            )}
          >
            {t('Deposit')}
          </EmphasisButton>

          <PrimaryButton
            onClick={() => handleAddLiquidity({ isStake: true })}
            className={cn(
              'w-full',
              !gauge && 'hidden',
              gauge?.address === zeroAddress && 'hidden',
              strategy.version === 2 && 'hidden',
            )}
          >
            {t('Deposit & Stake')}
          </PrimaryButton>
        </div>
      ) : (
        <ConnectButton className='w-full' />
      )}
    </div>
  )
}
