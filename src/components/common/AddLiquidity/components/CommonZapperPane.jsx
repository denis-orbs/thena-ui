import Link from 'next/link'
import { useTranslations } from 'next-intl'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { WBNB } from 'thena-sdk-core'
import { zeroAddress } from 'viem'

import Box from '@/components/box'
import { EmphasisButton, PrimaryButton, SecondaryButton } from '@/components/buttons/Button'
import ConnectButton from '@/components/buttons/ConnectButton'
import { TokenAmountInput } from '@/components/input/TokenAmountInput'
import Spinner from '@/components/spinner'
import { TextSubHeading } from '@/components/typography'
import { GAMMA_TYPES, PAIR_TYPES } from '@/constant'
import Contracts from '@/constant/contracts'
import { useTokenBalance } from '@/hooks/fusion/Tokens'
import useDebounce from '@/hooks/useDebounce'
import { useGetOdosTxSwap, useOdosQuoteSwapTradeTC } from '@/hooks/useSwap'
import useWallet from '@/hooks/useWallet'
import { useGammaZapper, useV1Zapper } from '@/hooks/zapper/useZapper'
import { cn, fromWei, isInvalidAmount } from '@/lib/utils'
import { ChevronUpIcon, InfoIcon } from '@/svgs'

const getZapAddress = (strategy, chainId) => {
  if (GAMMA_TYPES.includes(strategy.title)) return { address: Contracts.gammaZap[chainId], isV1: false }
  if (strategy.type === PAIR_TYPES.CLASSIC) return { address: Contracts.classicZap[chainId], isV1: true }
  if (strategy.type === PAIR_TYPES.STABLE) return { address: Contracts.stableZap[chainId], isV1: true }
}

export function CommonZapperPane({ asset0, asset1, slippage = 0.5, strategy, onShowModalSuccess }) {
  const t = useTranslations()
  const { address: pairAddress, gauge } = strategy
  const zapSwapSlippage = 10000 - slippage * 100
  const warningTextRef = useRef(null)
  const [warningTextHeight, setWarningTextHeight] = useState('0px')
  const [showWarning, setShowWarning] = useState(true)

  useEffect(() => {
    if (warningTextRef.current) {
      setWarningTextHeight(showWarning ? `${warningTextRef.current.scrollHeight}px` : '0px')
    }
  }, [showWarning])

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

  const { address: zapAddress, isV1 } = getZapAddress(strategy, chainId)

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

  const handleAddLiquidity = useCallback(
    ({ isStake = true }) => {
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

  const { balance, isDouble } = useTokenBalance(tokenDeposit, true)

  return (
    <div className='flex flex-col gap-2'>
      <Box
        className={cn(
          'flex flex-row items-start gap-2.5 border border-primary-800 bg-primary-950 py-3 md:gap-4',
          !showWarning && 'items-center',
        )}
      >
        <InfoIcon className='my-1 w-5 min-w-5 stroke-primary-600 md:my-2 md:w-8 md:min-w-8' />
        <div>
          <p className='text-xl font-medium text-primary-100'>Attention against sandwich attacks</p>
          <div
            className='overflow-hidden transition-all duration-300 ease-in-out'
            style={{ height: warningTextHeight }}
            ref={warningTextRef}
          >
            <TextSubHeading className='text-base text-primary-100'>
              If you are zapping a considerable amount of funds, please ensure to use{' '}
              <Link
                target='_blank'
                className='text-primary-500'
                href='https://cyberscope.medium.com/sandwich-attacks-in-crypto-how-to-protect-yourself-9e9c223c7e3a'
                rel='noreferrer'
              >
                protection against sandwich attacks
              </Link>{' '}
              to safeguard your investment. This precaution helps protect your transaction from potential front-running
              and other malicious activities.
              <br />
              <br />
              This feature is incompatible with tokens that have tax implications.
            </TextSubHeading>
          </div>
        </div>
        <ChevronUpIcon
          className={cn(
            'w-7 min-w-7 cursor-pointer p-1 transition-all duration-300 ease-in-out md:w-9 md:min-w-9 md:p-2',
            !showWarning && 'rotate-180',
          )}
          onClick={() => setShowWarning(show => !show)}
        />
      </Box>

      <div className='relative flex w-full flex-col gap-2'>
        <TokenAmountInput
          type='number'
          amount={amount}
          setAsset={setTokenDeposit}
          asset={tokenDeposit}
          maxBalance={isDouble ? balance : null}
          autoFocus
          onAmountChange={setAmount}
          showPercent={false}
          assetsSelect={[asset0, asset1]}
        />
      </div>

      <div
        className={cn(
          'mt-4 border border-neutral-600 bg-neutral-900 p-4 text-neutral-50 md:p-6 2xl:p-8',
          !isUseTokenInPair && !tokenIn && 'hidden',
        )}
      >
        <p className='mb-1 text-xl font-medium'>Zapp routing</p>
        <ol className='list-inside list-decimal text-sm'>
          {!isUseTokenInPair && (
            <li>
              Swap {tokenDeposit.symbol} to {tokenIn?.symbol}.
            </li>
          )}
          <li>
            Swap a portion of {isUseTokenInPair ? tokenDeposit.symbol : tokenIn?.symbol} to{' '}
            {(isUseTokenInPair ? tokenDeposit.symbol : tokenIn?.symbol) === asset0.symbol
              ? asset1.symbol
              : asset0.symbol}{' '}
            to match the pool ratio.
          </li>
          <li>
            Deposit the remaining {isUseTokenInPair ? tokenDeposit.symbol : tokenIn?.symbol} and swapped{' '}
            {(isUseTokenInPair ? tokenDeposit.symbol : tokenIn?.symbol) === asset0.symbol
              ? asset1.symbol
              : asset0.symbol}{' '}
            into the pool to receive LP tokens.
          </li>
        </ol>
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
            'mt-auto flex w-full flex-col items-center gap-4 pt-5 lg:flex-row',
            !isUseTokenInPair && (isLoading1 || isLoading0) && 'hidden',
          )}
        >
          <EmphasisButton
            disabled={!amountIn || (!isUseTokenInPair && !bestQuote)}
            onClick={() => handleAddLiquidity({ isStake: false })}
            className='w-full'
          >
            {t('Deposit')}
          </EmphasisButton>

          <PrimaryButton
            disabled={!amountIn || (!isUseTokenInPair && !bestQuote)}
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
