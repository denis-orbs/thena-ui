'use client'

import { useWeb3Modal } from '@web3modal/wagmi/react'
import React, { useCallback, useMemo, useState } from 'react'
import { WBNB } from 'thena-sdk-core'
import { zeroAddress } from 'viem'

import { PrimaryButton, SecondaryButton } from '@/components/buttons/Button'
import BalanceInput from '@/components/input/BalanceInput'
import Selection from '@/components/selection'
import { Paragraph, TextHeading } from '@/components/typography'
import { PAIR_TYPES } from '@/constant'
import { usePairs } from '@/context/pairsContext'
import { useV1Add, useV1AddAndStake } from '@/hooks/useV1Liquidity'
import { warnToast } from '@/lib/notify'
import { cn, formatAmount, isInvalidAmount, unwrappedSymbol, wrappedAddress } from '@/lib/utils'
import useWallet from '@/lib/wallets/useWallet'
import PoolTitle from '@/modules/PoolTitle'
import { useChainSettings, useSettings } from '@/state/settings/hooks'

export default function V1Add({
  pairType,
  isModal,
  isAdd,
  firstAsset,
  setFirstAddress,
  secondAsset,
  setSecondAddress,
}) {
  const [isZapper, setIsZapper] = useState(false)
  const [firstAmount, setFirstAmount] = useState('')
  const [secondAmount, setSecondAmount] = useState('')
  const { account } = useWallet()
  const { open } = useWeb3Modal()
  const { networkId } = useChainSettings()
  const { slippage, deadline } = useSettings()
  const { onV1Add, pending } = useV1Add()
  const { onV1AddAndStake, pending: stakePending } = useV1AddAndStake()
  const { pairs } = usePairs()

  const pair = useMemo(
    () =>
      (pairs ?? []).find(
        ele =>
          [ele.token0.address, ele.token1.address].includes(wrappedAddress(firstAsset)) &&
          [ele.token0.address, ele.token1.address].includes(wrappedAddress(secondAsset)) &&
          pairType === ele.type,
      ),
    [pairs, firstAsset, secondAsset, pairType],
  )

  const isFromBNB = useMemo(
    () => ['BNB', WBNB[networkId].address.toLowerCase()].includes(firstAsset?.address),
    [networkId, firstAsset],
  )

  const isToBNB = useMemo(
    () => ['BNB', WBNB[networkId].address.toLowerCase()].includes(secondAsset?.address),
    [networkId, secondAsset],
  )

  const strategy = useMemo(() => (pair ? pair.subpools[0] : undefined), [pair])

  const addSelections = useMemo(
    () => [
      {
        label: 'Default',
        active: !isZapper,
        onClickHandler: () => {
          setIsZapper(false)
        },
      },
      {
        label: 'Zapper',
        active: isZapper,
        onClickHandler: () => {
          setIsZapper(true)
        },
      },
    ],
    [isZapper],
  )

  const onFirstChange = useCallback(
    val => {
      setFirstAmount(val)
      if (strategy) {
        const isReverse = wrappedAddress(secondAsset) === strategy.token0.address
        const token0Reserve = isReverse ? strategy.token1.reserve : strategy.token0.reserve
        const token1Reserve = isReverse ? strategy.token0.reserve : strategy.token1.reserve
        setSecondAmount(
          val
            ? token1Reserve
                .times(val)
                .div(token0Reserve)
                .dp(secondAsset?.decimals || 0)
                .toString(10)
            : '',
        )
      }
    },
    [strategy, secondAsset],
  )

  const onSecondChange = useCallback(
    val => {
      setSecondAmount(val)
      if (strategy) {
        const isReverse = wrappedAddress(firstAsset) === strategy.token1.address
        const token0Reserve = isReverse ? strategy.token1.reserve : strategy.token0.reserve
        const token1Reserve = isReverse ? strategy.token0.reserve : strategy.token1.reserve
        setFirstAmount(
          val
            ? token0Reserve
                .times(val)
                .div(token1Reserve)
                .dp(firstAsset?.decimals || 0)
                .toString(10)
            : '',
        )
      }
    },
    [strategy, firstAsset],
  )

  const errorMsg = useMemo(() => {
    if (isInvalidAmount(firstAmount) || isInvalidAmount(secondAmount)) {
      return 'Invalid amount'
    }
    if (firstAsset.balance.lt(firstAmount)) {
      return `Insufficient ${firstAsset.symbol} balance`
    }
    if (secondAsset.balance.lt(secondAmount)) {
      return `Insufficient ${secondAsset.symbol} balance`
    }
    return null
  }, [firstAmount, secondAmount, firstAsset, secondAsset])

  const onAddLqiduity = useCallback(() => {
    if (errorMsg) {
      warnToast(errorMsg, 'warn')
      return
    }
    onV1Add(
      firstAsset,
      secondAsset,
      firstAmount,
      secondAmount,
      pairType === PAIR_TYPES.STABLE,
      slippage,
      deadline,
      () => {
        setFirstAmount('')
        setSecondAmount('')
      },
    )
  }, [onV1Add, firstAsset, secondAsset, firstAmount, secondAmount, pairType, slippage, deadline, errorMsg])

  const onAddAndStake = useCallback(() => {
    if (errorMsg) {
      warnToast(errorMsg, 'warn')
      return
    }
    onV1AddAndStake(
      strategy,
      firstAsset,
      secondAsset,
      firstAmount,
      secondAmount,
      pairType === PAIR_TYPES.STABLE,
      slippage,
      deadline,
      () => {
        setFirstAmount('')
        setSecondAmount('')
      },
    )
  }, [
    onV1AddAndStake,
    strategy,
    firstAsset,
    secondAsset,
    firstAmount,
    secondAmount,
    pairType,
    slippage,
    deadline,
    errorMsg,
  ])

  return (
    <>
      <div className={cn('inline-flex w-full flex-col gap-5', isModal && 'p-3 lg:px-6')}>
        {isAdd && strategy && <PoolTitle strategy={strategy} />}
        <Selection data={addSelections} isFull />
        {isZapper ? (
          <div className='flex flex-col gap-5'>Coming soon!</div>
        ) : (
          <div className='flex flex-col'>
            <div className='mb-5 flex flex-col gap-2'>
              <BalanceInput
                title='Asset 1'
                asset={firstAsset}
                setAsset={isFromBNB ? setFirstAddress : null}
                amount={firstAmount}
                onAmountChange={onFirstChange}
              />
              <BalanceInput
                title='Asset 2'
                asset={secondAsset}
                setAsset={isToBNB ? setSecondAddress : null}
                amount={secondAmount}
                onAmountChange={onSecondChange}
              />
            </div>
            {strategy ? (
              <>
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
                <div className='mt-4 flex flex-col gap-4 border-t border-neutral-700 pt-4'>
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
              </>
            ) : (
              <div className='flex flex-col gap-4'>
                <TextHeading className='text-lg'>Starting Liquidity Info</TextHeading>
                <div className='flex flex-col gap-3'>
                  <div className='flex items-center justify-between'>
                    <Paragraph className='font-medium'>
                      {firstAsset?.symbol} per {secondAsset?.symbol}
                    </Paragraph>
                    <Paragraph>
                      {firstAmount && secondAmount ? formatAmount(firstAmount / secondAmount) : '-'}
                    </Paragraph>
                  </div>
                  <div className='flex items-center justify-between'>
                    <Paragraph className='font-medium'>
                      {secondAsset?.symbol} per {firstAsset?.symbol}
                    </Paragraph>
                    <Paragraph>
                      {firstAmount && secondAmount ? formatAmount(secondAmount / firstAmount) : '-'}
                    </Paragraph>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      {!isZapper && (
        <div
          className={cn('mt-auto flex w-full flex-col items-center gap-4 pt-5 lg:flex-row', isModal && 'px-3 lg:px-6')}
        >
          {account ? (
            <>
              <SecondaryButton
                disabled={pending}
                onClick={() => {
                  onAddLqiduity()
                }}
                className='w-full'
              >
                Add Liquidity
              </SecondaryButton>
              {strategy && strategy.gauge.address !== zeroAddress && (
                <PrimaryButton
                  disabled={stakePending}
                  onClick={() => {
                    onAddAndStake()
                  }}
                  className='w-full'
                >
                  Add Liquidity & Stake
                </PrimaryButton>
              )}
            </>
          ) : (
            <PrimaryButton className='w-full' onClick={() => open()}>
              Connect Wallet
            </PrimaryButton>
          )}
        </div>
      )}
    </>
  )
}
