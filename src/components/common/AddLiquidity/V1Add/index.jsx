'use client'

import { useTranslations } from 'next-intl'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { WBNB } from 'thena-sdk-core'
import { zeroAddress } from 'viem'

import { PrimaryButton, SecondaryButton } from '@/components/buttons/Button'
import ConnectButton from '@/components/buttons/ConnectButton'
import BalanceInput from '@/components/input/BalanceInput'
import Selection from '@/components/selection'
import { Paragraph, TextHeading } from '@/components/typography'
import { PAIR_TYPES } from '@/constant'
import { useV1Add, useV1AddAndStake } from '@/hooks/useV1Liquidity'
import useWallet from '@/hooks/useWallet'
import { warnToast } from '@/lib/notify'
import { cn, formatAmount, isInvalidAmount, unwrappedSymbol, wrappedAddress } from '@/lib/utils'
import PoolTitle from '@/modules/PoolTitle'
import SettingSlippageModal from '@/modules/Position/SettingSlippageModal'
import { usePools } from '@/state/pools/hooks'
import { useChainSettings, useSettings } from '@/state/settings/hooks'

import ZapperPane from './ZapperPane'

export default function V1Add({
  pairType,
  isModal,
  isAdd,
  firstAsset,
  setFirstAddress,
  secondAsset,
  setSecondAddress,
  setFirstAmountValue,
  setSecondAmountValue,
  slippage,
  setSlippage,
}) {
  const [isZapper, setIsZapper] = useState(false)
  const [firstAmount, setFirstAmount] = useState('')
  const [secondAmount, setSecondAmount] = useState('')
  const { account } = useWallet()
  const { networkId } = useChainSettings()
  const { deadline } = useSettings()
  const { onV1Add, pending } = useV1Add()
  const { onV1AddAndStake, pending: stakePending } = useV1AddAndStake()
  const pools = usePools()
  const t = useTranslations()

  const pool = useMemo(() => {
    const v3Pool = pools.find(
      ele =>
        [ele.token0?.address, ele.token1?.address].includes(wrappedAddress(firstAsset)) &&
        [ele.token0?.address, ele.token1?.address].includes(wrappedAddress(secondAsset)) &&
        pairType === ele.type &&
        ele.version === 3,
    )

    return (
      v3Pool ||
      pools.find(
        ele =>
          [ele.token0?.address, ele.token1?.address].includes(wrappedAddress(firstAsset)) &&
          [ele.token0?.address, ele.token1?.address].includes(wrappedAddress(secondAsset)) &&
          pairType === ele.type,
      )
    )
  }, [pools, firstAsset, secondAsset, pairType])

  const isFromBNB = useMemo(
    () => ['BNB', WBNB[networkId].address.toLowerCase()].includes(firstAsset?.address),
    [networkId, firstAsset],
  )

  const isToBNB = useMemo(
    () => ['BNB', WBNB[networkId].address.toLowerCase()].includes(secondAsset?.address),
    [networkId, secondAsset],
  )

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
      if (pool) {
        const isReverse = wrappedAddress(secondAsset) === pool.token0.address
        const token0Reserve = isReverse ? pool.token1.reserve : pool.token0.reserve
        const token1Reserve = isReverse ? pool.token0.reserve : pool.token1.reserve
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
    [pool, secondAsset],
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
      if (pool) {
        const isReverse = wrappedAddress(firstAsset) === pool.token1.address
        const token0Reserve = isReverse ? pool.token1.reserve : pool.token0.reserve
        const token1Reserve = isReverse ? pool.token0.reserve : pool.token1.reserve
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
    [pool, firstAsset],
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
      pool,
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
    pool,
    firstAsset,
    secondAsset,
    firstAmount,
    secondAmount,
    pairType,
    deadline,
    slippage,
  ])

  return (
    <>
      <div className={cn('inline-flex w-full flex-col gap-5', isModal && 'p-3 lg:px-6')}>
        {isAdd && pool && <PoolTitle strategy={pool} />}
        <Selection data={addSelections} isFull isTranslation={false} />
        <>
          <div className='flex justify-end'>
            <SettingSlippageModal slippage={slippage} updateSlippage={setSlippage} />
          </div>
          {isZapper ? (
            <ZapperPane asset0={firstAsset} asset1={secondAsset} slippage={slippage} strategy={pool} />
          ) : (
            <div className='flex flex-col'>
              <div className='mb-5 flex flex-col gap-2'>
                <BalanceInput
                  title={`${t('Asset')} 1`}
                  asset={firstAsset}
                  setAsset={isFromBNB ? setFirstAddress : null}
                  amount={firstAmount}
                  onAmountChange={onFirstChange}
                />
                <BalanceInput
                  title={`${t('Asset')} 2`}
                  asset={secondAsset}
                  setAsset={isToBNB ? setSecondAddress : null}
                  amount={secondAmount}
                  onAmountChange={onSecondChange}
                />
              </div>

              {pool ? (
                <>
                  <div className='flex flex-col gap-4'>
                    <TextHeading className='text-lg'>{t('Reserve Info')}</TextHeading>
                    <div className='flex flex-col gap-3'>
                      <div className='flex items-center justify-between'>
                        <Paragraph className='font-medium'>
                          {unwrappedSymbol(pool.token0)} {t('Amount')}
                        </Paragraph>
                        <Paragraph>{formatAmount(pool.token0.reserve)}</Paragraph>
                      </div>
                      <div className='flex items-center justify-between'>
                        <Paragraph className='font-medium'>
                          {unwrappedSymbol(pool.token1)} {t('Amount')}
                        </Paragraph>
                        <Paragraph>{formatAmount(pool.token1.reserve)}</Paragraph>
                      </div>
                    </div>
                  </div>
                  <div className='mt-4 flex flex-col gap-4 border-t border-neutral-700 pt-4'>
                    <TextHeading className='text-lg'>{t('My Info')}</TextHeading>
                    <div className='flex flex-col gap-3'>
                      <div className='flex items-center justify-between'>
                        <Paragraph className='font-medium'>{t('Pooled Liquidity')}</Paragraph>
                        <Paragraph>{formatAmount(pool.account.totalLp)} LP</Paragraph>
                      </div>
                      <div className='flex items-center justify-between'>
                        <Paragraph className='font-medium'>{t('Staked Liquidity')}</Paragraph>
                        <Paragraph>{formatAmount(pool.account.gaugeBalance)} LP</Paragraph>
                      </div>
                    </div>
                  </div>
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
                      <Paragraph>
                        {firstAmount && secondAmount ? formatAmount(firstAmount / secondAmount) : '-'}
                      </Paragraph>
                    </div>
                    <div className='flex items-center justify-between'>
                      <Paragraph className='font-medium'>
                        {t('[symbolA] per [symbolB]', {
                          symbolA: secondAsset?.symbol,
                          symbolB: firstAsset?.symbol,
                        })}
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
        </>
      </div>

      <div
        className={cn(
          'mt-auto flex w-full flex-col items-center gap-4 pt-5 lg:flex-row',
          isModal && 'px-3 lg:px-6',
          isZapper && 'hidden',
        )}
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

            {/* If v2 gauge, dont show Stake */}
            {pool && pool.gauge.address !== zeroAddress && pool.version === 3 && (
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
    </>
  )
}
