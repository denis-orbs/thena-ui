import { useTranslations } from 'next-intl'
import React, { useMemo, useState } from 'react'
import { zeroAddress } from 'viem'

import { PrimaryButton, SecondaryButton } from '@/components/buttons/Button'
import ConnectButton from '@/components/buttons/ConnectButton'
import TokenInput from '@/components/input/TokenInput'
import Tabs from '@/components/tabs'
import { Paragraph, TextHeading } from '@/components/typography'
import { PAIR_TYPES } from '@/constant'
import Contracts from '@/constant/contracts'
import useDebounce from '@/hooks/useDebounce'
import { useGetOdosTxSwap, useOdosQuoteSwapTradeTC } from '@/hooks/useSwap'
import useWallet from '@/hooks/useWallet'
import { useV1Zapper } from '@/hooks/zapper/useZapper'
import { cn, formatAmount, fromWei, isInvalidAmount, unwrappedSymbol } from '@/lib/utils'

export function ZapperPaneV1({ asset0, asset1, slippage = 1, strategy }) {
  const t = useTranslations()
  const { address: pairAddress, gauge } = strategy
  const zapSwapSlippage = 10000 - slippage * 100

  const { account, chainId } = useWallet()
  const [tokenDeposit, setTokenDeposit] = useState(asset0)
  const [amount, setAmount] = useState(0)
  const amountIn = useDebounce(amount, 500)

  const { onAddLiquidity } = useV1Zapper()
  const isUseTokenInPair = tokenDeposit.address === asset0.address || tokenDeposit.address === asset1.address

  const zapAddress = strategy.type === PAIR_TYPES.CLASSIC ? Contracts.classicZap[chainId] : Contracts.stableZap[chainId]
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

  const percents = useMemo(
    () => [
      {
        label: '10%',
        onClickHandler: () => setAmount(tokenDeposit?.balance.times(0.1).toString(10)),
      },
      {
        label: '25%',
        onClickHandler: () => setAmount(tokenDeposit?.balance.times(0.25).toString(10)),
      },
      {
        label: '50%',
        onClickHandler: () => setAmount(tokenDeposit?.balance.times(0.5).toString(10)),
      },
      {
        label: 'Max',
        onClickHandler: () => setAmount(tokenDeposit?.balance.toString(10)),
      },
    ],
    [tokenDeposit?.balance, setAmount],
  )

  return (
    <div className='flex flex-col gap-2'>
      <div className='flex flex-row justify-between'>
        <TextHeading>{t('Deposit Token')}</TextHeading> <Tabs data={percents} />
      </div>

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
          <div className='flex flex-col gap-4'>
            <TextHeading className='text-lg'>{t('Reserve Info')}</TextHeading>
            <div className='flex flex-col gap-3'>
              <div className='flex items-center justify-between'>
                <Paragraph className='font-medium'>
                  {unwrappedSymbol(strategy.token0)} {t('Amount')}
                </Paragraph>
                <Paragraph>{formatAmount(strategy.token0.reserve)}</Paragraph>
              </div>
              <div className='flex items-center justify-between'>
                <Paragraph className='font-medium'>
                  {unwrappedSymbol(strategy.token1)} {t('Amount')}
                </Paragraph>
                <Paragraph>{formatAmount(strategy.token1.reserve)}</Paragraph>
              </div>
            </div>
          </div>
          <div className='mt-4 flex flex-col gap-4 border-t border-neutral-700 pt-4'>
            <TextHeading className='text-lg'>{t('My Info')}</TextHeading>
            <div className='flex flex-col gap-3'>
              <div className='flex items-center justify-between'>
                <Paragraph className='font-medium'>{t('Pooled Liquidity')}</Paragraph>
                <Paragraph>{formatAmount(strategy.account.totalLp)} LP</Paragraph>
              </div>
              <div className='flex items-center justify-between'>
                <Paragraph className='font-medium'>{t('Staked Liquidity')}</Paragraph>
                <Paragraph>{formatAmount(strategy.account.gaugeBalance)} LP</Paragraph>
              </div>
            </div>
          </div>
        </>
      )}

      <div
        className={cn(
          'mt-4 hidden border-t border-neutral-700',
          !isUseTokenInPair && (isLoading1 || isLoading0) && 'block',
        )}
      >
        <p className='mt-4'>On Loading Best router</p>
      </div>

      {account ? (
        <div className={cn('mt-auto flex w-full flex-col items-center gap-4 pt-5 lg:flex-row')}>
          <SecondaryButton
            disabled={!amountIn || (!isUseTokenInPair && !bestQuote)}
            onClick={() => {
              onAddLiquidity({
                tokenDeposit,
                tokenIn,
                amount: amountIn,
                gaugeAddress: null,
                pairAddress,
                zapSwapSlippage,
                odosParams: bestQuote,
                type: strategy.type,
              })
            }}
            className='w-full'
          >
            {t('Add Liquidity')}
          </SecondaryButton>

          <PrimaryButton
            disabled={!amountIn || (!isUseTokenInPair && !bestQuote)}
            onClick={() => {
              onAddLiquidity({
                tokenDeposit,
                tokenIn,
                amount: amountIn,
                gaugeAddress: gauge?.address ?? null,
                pairAddress,
                zapSwapSlippage,
                odosParams: bestQuote,
                type: strategy.type,
              })
            }}
            className={cn(
              'w-full',
              !gauge && 'hidden',
              gauge?.address === zeroAddress && 'hidden',
              strategy.version === 2 && 'hidden',
            )}
          >
            {t('Add Liquidity & Stake')}
          </PrimaryButton>
        </div>
      ) : (
        <ConnectButton className='w-full' />
      )}
    </div>
  )
}
