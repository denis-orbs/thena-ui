import Link from 'next/link'
import { useTranslations } from 'next-intl'
import React, { useMemo, useState } from 'react'
import { zeroAddress } from 'viem'

import Box from '@/components/box'
import { PrimaryButton, SecondaryButton } from '@/components/buttons/Button'
import ConnectButton from '@/components/buttons/ConnectButton'
import TokenInput from '@/components/input/TokenInput'
import Spinner from '@/components/spinner'
import { TextSubHeading } from '@/components/typography'
import { GAMMA_TYPES, PAIR_TYPES } from '@/constant'
import Contracts from '@/constant/contracts'
import useDebounce from '@/hooks/useDebounce'
import { useGetOdosTxSwap, useOdosQuoteSwapTradeTC } from '@/hooks/useSwap'
import useWallet from '@/hooks/useWallet'
import { useGammaZapper, useV1Zapper } from '@/hooks/zapper/useZapper'
import { cn, fromWei, isInvalidAmount } from '@/lib/utils'
import { InfoIcon } from '@/svgs'

const getZapAddress = (strategy, chainId) => {
  if (GAMMA_TYPES.includes(strategy.title)) return { address: Contracts.gammaZap[chainId], isV1: false }
  if (strategy.type === PAIR_TYPES.CLASSIC) return { address: Contracts.classicZap[chainId], isV1: true }
  if (strategy.type === PAIR_TYPES.STABLE) return { address: Contracts.stableZap[chainId], isV1: true }
}

export function ZapperPane({ asset0, asset1, slippage = 1, strategy }) {
  const t = useTranslations()
  const { address: pairAddress, gauge } = strategy
  const zapSwapSlippage = 10000 - slippage * 100

  const { account, chainId } = useWallet()
  const [tokenDeposit, setTokenDeposit] = useState(asset0)
  const [amount, setAmount] = useState(0)
  const amountIn = useDebounce(amount, 500)

  const { onAddLiquidity: addZapV1 } = useV1Zapper()
  const { onAddLiquidity: addZapGamma } = useGammaZapper()

  const isUseTokenInPair =
    tokenDeposit.address.toLowerCase() === asset0.address.toLowerCase() ||
    tokenDeposit.address.toLowerCase() === asset1.address.toLowerCase()

  const { address: zapAddress, isV1 } = getZapAddress(strategy, chainId)
  const { data: quoteO } = useOdosQuoteSwapTradeTC(
    zapAddress,
    tokenDeposit.address,
    asset0.address,
    amountIn,
    slippage,
    chainId,
    Boolean(!isInvalidAmount(amountIn) && !isUseTokenInPair),
    tokenDeposit?.decimals,
  )
  const { data: quote1 } = useOdosQuoteSwapTradeTC(
    zapAddress,
    tokenDeposit.address,
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

  const handleAddLiquidity = ({ isStake = true }) => {
    if (isV1) {
      addZapV1({
        tokenDeposit,
        tokenIn,
        amount: amountIn,
        gaugeAddress: isStake && gauge?.address ? gauge?.address : null,
        pairAddress,
        zapSwapSlippage,
        odosParams: bestQuote,
        type: strategy.type,
      })
    } else {
      addZapGamma({
        tokenDeposit,
        tokenIn,
        amount: amountIn,
        isFarming: strategy.isFarming,
        pairAddress,
        zapSwapSlippage,
        odosParams: bestQuote,
      })
    }
  }

  return (
    <div className='flex flex-col gap-2'>
      <div className='relative flex w-full flex-col gap-2'>
        <TokenInput
          asset={tokenDeposit}
          setAsset={setTokenDeposit}
          amount={amount}
          setAmount={setAmount}
          isHideTrending
          autoFocus
          assetNull
        />
      </div>

      {strategy && (
        <>
          <Box
            className={cn(
              'mt-5 flex flex-row items-center justify-between gap-4 border border-primary-800 bg-primary-950',
            )}
          >
            <div className='size-5'>
              <InfoIcon className='size-5 stroke-primary-600' />
            </div>
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
            </TextSubHeading>
          </Box>
        </>
      )}

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
          <SecondaryButton
            disabled={!amountIn || (!isUseTokenInPair && !bestQuote)}
            onClick={() => handleAddLiquidity({ isStake: false })}
            className='w-full'
          >
            {t('Deposit')}
          </SecondaryButton>

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
