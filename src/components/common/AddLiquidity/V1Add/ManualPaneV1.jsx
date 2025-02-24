import { useTranslations } from 'next-intl'
import React, { useCallback, useMemo, useState } from 'react'
import { WBNB } from 'thena-sdk-core'
import { zeroAddress } from 'viem'

import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import ConnectButton from '@/components/buttons/ConnectButton'
import BalanceInput from '@/components/input/BalanceInput'
import CustomTooltip from '@/components/tooltip'
import { PAIR_TYPES } from '@/constant'
import { useV1Add, useV1AddAndStake } from '@/hooks/useV1Liquidity'
import useWallet from '@/hooks/useWallet'
import { warnToast } from '@/lib/notify'
import { isInvalidAmount, wrappedAddress } from '@/lib/utils'
import { useChainSettings, useSettings } from '@/state/settings/hooks'

export function ManualPaneV1({
  strategy,
  firstAsset,
  secondAsset,
  setFirstAddress,
  setSecondAddress,
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
        <div className='mb-5 grid gap-2 xl:grid-cols-2'>
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
      </div>

      <div className='mt-5 grid gap-4 md:grid-cols-2'>
        {account ? (
          <>
            <EmphasisButton
              disabled={pending}
              onClick={() => {
                onAddLiquidity()
              }}
            >
              {t('Deposit')}
            </EmphasisButton>

            <PrimaryButton
              disabled={stakePending || !strategy || strategy.gauge.address === zeroAddress || strategy.version !== 3}
              onClick={() => {
                onAddAndStake()
              }}
              data-tooltip-id='add-liquidity-stake'
            >
              {t('Deposit & Stake')}
            </PrimaryButton>

            {(!strategy || strategy.gauge.address === zeroAddress || strategy.version !== 3) && (
              <CustomTooltip id='add-liquidity-stake' className='max-w-full md:max-w-[500px]'>
                {t('This pool has no Gauge')}
              </CustomTooltip>
            )}
          </>
        ) : (
          <ConnectButton className='w-full' />
        )}
      </div>
    </section>
  )
}
