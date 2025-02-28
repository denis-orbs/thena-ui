import { useTranslations } from 'next-intl'
import React, { useCallback, useMemo, useState } from 'react'
import { WBNB } from 'thena-sdk-core'
import { zeroAddress } from 'viem'

import { EmphasisButton, PrimaryButton, SecondaryButton } from '@/components/buttons/Button'
import ConnectButton from '@/components/buttons/ConnectButton'
import { TokenAmountInput } from '@/components/input/TokenAmountInput'
import Spinner from '@/components/spinner'
import { GAMMA_TYPES, PAIR_TYPES } from '@/constant'
import Contracts from '@/constant/contracts'
import useDebounce from '@/hooks/useDebounce'
import { useGetOdosTxSwap, useOdosQuoteSwapTradeTC } from '@/hooks/useSwap'
import useWallet from '@/hooks/useWallet'
import { useGammaZapper, useV1Zapper } from '@/hooks/zapper/useZapper'
import { warnToast } from '@/lib/notify'
import { cn, fromWei, isInvalidAmount, toWei } from '@/lib/utils'
import SettingSlippageDropDown from '@/modules/Position/SettingSlippageDropDown'

import WarningZapper from './WarningZapper'

const getZapAddress = (strategy, chainId) => {
  if (GAMMA_TYPES.includes(strategy.title)) return { address: Contracts.gammaZap[chainId], isV1: false }
  if (strategy.type === PAIR_TYPES.CLASSIC) return { address: Contracts.classicZap[chainId], isV1: true }
  if (strategy.type === PAIR_TYPES.STABLE) return { address: Contracts.stableZap[chainId], isV1: true }
}

export function CommonZapperPane({ asset0, asset1, strategy, onShowModalSuccess }) {
  const t = useTranslations()
  const { address: pairAddress, gauge } = strategy
  const [slippage, setSlippage] = useState(0.5)
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
      if (
        fromWei(toWei(amountIn, tokenDeposit?.decimals), tokenDeposit?.decimals).gt(tokenDeposit?.balance) ||
        isInvalidAmount(amountIn)
      ) {
        warnToast('Invalid Amount')
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
      <div className='relative flex w-full flex-col gap-4'>
        <WarningZapper />
        <SettingSlippageDropDown slippage={slippage} updateSlippage={setSlippage} className='mb-0' />
        <div className='space-y-2'>
          <TokenAmountInput
            type='number'
            amount={amount}
            setAsset={setTokenDeposit}
            asset={tokenDeposit}
            autoFocus
            onAmountChange={setAmount}
            showPercent={false}
            assetsSelect={[]}
          />
          <div
            className={cn(
              'rounded-xl border border-neutral-600 bg-neutral-900 p-4 text-neutral-50 md:p-6 2xl:p-8',
              !isUseTokenInPair && !tokenIn && 'hidden',
            )}
          >
            <p className='mb-1 text-xl font-medium'>Zapper Route</p>
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
            'mt-auto flex w-full flex-col items-center gap-4 pt-5 lg:flex-row',
            !isUseTokenInPair && (isLoading1 || isLoading0) && 'hidden',
          )}
        >
          <EmphasisButton
            onClick={() => handleAddLiquidity({ isStake: false })}
            className={cn(
              'w-full',
              (!gauge || gauge?.address === zeroAddress || strategy.version === 2) &&
                'bg-primary-600 text-primary-100 hover:bg-primary-700 hover:text-primary-200 active:bg-primary-600 active:text-primary-100',
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
