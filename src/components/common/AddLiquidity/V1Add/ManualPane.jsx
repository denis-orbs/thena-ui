import { useTranslations } from 'next-intl'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { WBNB } from 'thena-sdk-core'
import { zeroAddress } from 'viem'

import { PrimaryButton, SecondaryButton } from '@/components/buttons/Button'
import ConnectButton from '@/components/buttons/ConnectButton'
import BalanceInput from '@/components/input/BalanceInput'
import { Paragraph, TextHeading } from '@/components/typography'
import { PAIR_TYPES } from '@/constant'
import { useV1Add, useV1AddAndStake } from '@/hooks/useV1Liquidity'
import useWallet from '@/hooks/useWallet'
import { warnToast } from '@/lib/notify'
import { cn, formatAmount, isInvalidAmount, wrappedAddress } from '@/lib/utils'
import { useChainSettings, useSettings } from '@/state/settings/hooks'

export function ManualPaneV1({
  strategy,
  firstAsset,
  secondAsset,
  isModal,
  setFirstAddress,
  setSecondAddress,
  setFirstAmountValue,
  setSecondAmountValue,
  pairType,
  slippage,
}) {
  const t = useTranslations()

  const [firstAmount, setFirstAmount] = useState('')
  const [secondAmount, setSecondAmount] = useState('')
  const { account } = useWallet()
  const { networkId } = useChainSettings()
  const { deadline } = useSettings()
  const { onV1Add, pending } = useV1Add()
  const { onV1AddAndStake, pending: stakePending } = useV1AddAndStake()

  const isFromBNB = useMemo(
    () => ['BNB', WBNB[networkId].address.toLowerCase()].includes(firstAsset?.address),
    [networkId, firstAsset],
  )

  const isToBNB = useMemo(
    () => ['BNB', WBNB[networkId].address.toLowerCase()].includes(secondAsset?.address),
    [networkId, secondAsset],
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

  useEffect(() => {
    if (typeof setFirstAmountValue === 'function') {
      setFirstAmountValue(firstAmount)
    }

    if (typeof setSecondAmountValue === 'function') {
      setSecondAmountValue(secondAmount)
    }
  }, [firstAmount, secondAmount, setFirstAmountValue, setSecondAmountValue])

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
      return 'Invalid Amount'
    }
    if (firstAsset.balance.lt(firstAmount)) {
      return `Insufficient ${firstAsset.symbol} balance`
    }
    if (secondAsset.balance.lt(secondAmount)) {
      return `Insufficient ${secondAsset.symbol} balance`
    }
    return null
  }, [firstAmount, secondAmount, firstAsset, secondAsset])

  const onAddLiquidity = useCallback(() => {
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
      deadline,
      slippage,
      () => {
        setFirstAmount('')
        setSecondAmount('')
      },
    )
  }, [errorMsg, onV1Add, firstAsset, secondAsset, firstAmount, secondAmount, pairType, deadline, slippage])

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
      deadline,
      slippage,
      () => {
        setFirstAmount('')
        setSecondAmount('')
      },
    )
  }, [
    errorMsg,
    onV1AddAndStake,
    strategy,
    firstAsset,
    secondAsset,
    firstAmount,
    secondAmount,
    pairType,
    deadline,
    slippage,
  ])

  return (
    <section>
      <div className='flex flex-col'>
        <div className='mb-5 flex flex-col gap-2 xl:flex-row'>
          <BalanceInput
            asset={firstAsset}
            setAsset={isFromBNB ? setFirstAddress : null}
            amount={firstAmount}
            onAmountChange={onFirstChange}
            showPercent={false}
          />
          <BalanceInput
            asset={secondAsset}
            setAsset={isToBNB ? setSecondAddress : null}
            amount={secondAmount}
            onAmountChange={onSecondChange}
            showPercent={false}
          />
        </div>

        {strategy ? (
          <>
            {/* <div className='flex flex-col gap-4'>
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
            </div> */}
          </>
        ) : (
          <div className='flex flex-col gap-4'>
            <TextHeading className='text-lg'>{t('Starting Liquidity Info')}</TextHeading>
            <div className='flex flex-col gap-3'>
              <div className='flex items-center justify-between'>
                <Paragraph className='font-medium'>
                  {t('[symbolA] per [symbolB]', {
                    symbolA: firstAsset?.symbol,
                    symbolB: secondAsset?.symbol,
                  })}
                </Paragraph>
                <Paragraph>{firstAmount && secondAmount ? formatAmount(firstAmount / secondAmount) : '-'}</Paragraph>
              </div>
              <div className='flex items-center justify-between'>
                <Paragraph className='font-medium'>
                  {t('[symbolA] per [symbolB]', {
                    symbolA: secondAsset?.symbol,
                    symbolB: firstAsset?.symbol,
                  })}
                </Paragraph>
                <Paragraph>{firstAmount && secondAmount ? formatAmount(secondAmount / firstAmount) : '-'}</Paragraph>
              </div>
            </div>
          </div>
        )}
      </div>
      <div
        className={cn('mt-auto flex w-full flex-col items-center gap-4 pt-5 lg:flex-row', isModal && 'px-3 lg:px-6')}
      >
        {account ? (
          <>
            <SecondaryButton
              disabled={pending}
              onClick={() => {
                onAddLiquidity()
              }}
              className='w-full'
            >
              {t('Add Liquidity')}
            </SecondaryButton>

            {strategy && strategy.gauge.address !== zeroAddress && strategy.version === 3 && (
              <PrimaryButton
                disabled={stakePending}
                onClick={() => {
                  onAddAndStake()
                }}
                className='w-full'
              >
                {t('Add Liquidity & Stake')}
              </PrimaryButton>
            )}
          </>
        ) : (
          <ConnectButton className='w-full' />
        )}
      </div>
    </section>
  )
}
