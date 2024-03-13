'use client'

import { useWeb3Modal } from '@web3modal/wagmi/react'
import BigNumber from 'bignumber.js'
import React, { useCallback, useMemo, useState } from 'react'

import { PrimaryButton } from '@/components/buttons/Button'
import BalanceInput from '@/components/input/BalanceInput'
import { Paragraph, TextHeading } from '@/components/typography'
import { useAssets } from '@/context/assetsContext'
import { useIchiManage } from '@/hooks/fusion/useIchi'
import { warnToast } from '@/lib/notify'
import { cn, formatAmount, isInvalidAmount, unwrappedSymbol } from '@/lib/utils'
import useWallet from '@/lib/wallets/useWallet'
import PoolTitle from '@/modules/PoolTitle'
import { useSettings } from '@/state/settings/hooks'

export default function IchiAdd({ strategy, isAdd, isModal }) {
  const [amount, setAmount] = useState('')
  const { onIchiAddAndStake, pending } = useIchiManage()
  const { account } = useWallet()
  const { open } = useWeb3Modal()
  const assets = useAssets()
  const { slippage } = useSettings()
  const bnbBalance = assets.find(ele => ele.address === 'BNB').balance
  const depositToken = assets.find(ele => ele.address.toLowerCase() === strategy.allowed.address)

  const isDouble = useMemo(() => depositToken.symbol === 'WBNB', [depositToken])

  const balance = useMemo(() => {
    if (isDouble) {
      return depositToken.balance.plus(bnbBalance)
    }
    return depositToken.balance
  }, [depositToken, isDouble, bnbBalance])

  const amountToWrap = useMemo(() => {
    let final
    if (depositToken.balance.lt(amount)) {
      final = new BigNumber(amount).minus(depositToken.balance)
    }
    return final
  }, [amount, depositToken])

  const errorMsg = useMemo(() => {
    if (isInvalidAmount(amount)) {
      return 'Invalid amount'
    }
    if (balance.lt(amount)) {
      return 'Insufficient balance'
    }
    return null
  }, [balance, amount])

  const onAddLiquidityAndStake = useCallback(() => {
    if (errorMsg) {
      warnToast(errorMsg)
    } else {
      onIchiAddAndStake(strategy, amount, amountToWrap, slippage)
    }
  }, [strategy, amount, amountToWrap, slippage, errorMsg, onIchiAddAndStake])

  return (
    <>
      <div className={cn('inline-flex w-full flex-col gap-5', isModal && 'p-3 lg:px-6')}>
        {isAdd && strategy && <PoolTitle strategy={strategy} />}
        <div className='flex flex-col gap-4'>
          <BalanceInput
            title='Asset'
            asset={depositToken}
            maxBalance={isDouble ? balance : null}
            amount={amount}
            onAmountChange={setAmount}
          />
          <div className='flex flex-col gap-4'>
            <TextHeading className='text-lg'>Reserve Info</TextHeading>
            <div className='flex flex-col gap-3'>
              <div className='flex items-center justify-between'>
                <Paragraph className='font-medium'>{unwrappedSymbol(strategy.token0)} Amount</Paragraph>
                <Paragraph>{formatAmount(strategy.token0.reserve)}</Paragraph>
              </div>
              <div className='flex items-center justify-between'>
                <Paragraph className='font-medium'>{unwrappedSymbol(strategy.token1)} Amount</Paragraph>
                <Paragraph>{formatAmount(strategy.token1.reserve)}</Paragraph>
              </div>
            </div>
          </div>
          <div className='flex flex-col gap-4 border-t border-neutral-700 pt-4'>
            <TextHeading className='text-lg'>My Info</TextHeading>
            <div className='flex flex-col gap-3'>
              <div className='flex items-center justify-between'>
                <Paragraph className='font-medium'>Pooled Liquidity</Paragraph>
                <Paragraph>{formatAmount(strategy.account.totalLp)} LP</Paragraph>
              </div>
              <div className='flex items-center justify-between'>
                <Paragraph className='font-medium'>Staked Liquidity</Paragraph>
                <Paragraph>{formatAmount(strategy.account.gaugeBalance)} LP</Paragraph>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        className={cn('mt-auto flex w-full flex-col items-center gap-4 pt-5 lg:flex-row', isModal && 'px-3 lg:px-6')}
      >
        {account ? (
          <PrimaryButton
            disabled={pending}
            onClick={() => {
              onAddLiquidityAndStake()
            }}
            className='w-full'
          >
            Add Liquidity & Stake
          </PrimaryButton>
        ) : (
          <PrimaryButton className='w-full' onClick={() => open()}>
            Connect Wallet
          </PrimaryButton>
        )}
      </div>
    </>
  )
}
