'use client'

import { useTranslations } from 'next-intl'
import React, { useCallback, useMemo, useState } from 'react'

import { PrimaryButton, TextButton } from '@/components/buttons/Button'
import CircleImage from '@/components/image/CircleImage'
import DoubleInput from '@/components/input/DoubleInput'
import { ModalBody, ModalFooter } from '@/components/modal'
import { Paragraph, TextHeading } from '@/components/typography'
import { GAMMA_TYPES, ICHI_TYPES, PAIR_TYPES } from '@/constant'
import { useDefiedgeRemove } from '@/hooks/fusion/useDefiedge'
import { useGammaRemove } from '@/hooks/fusion/useGamma'
import { useIchiRemove } from '@/hooks/fusion/useIchi'
import { useV1Remove } from '@/hooks/useV1Liquidity'
import { warnToast } from '@/lib/notify'
import { formatAmount, isInvalidAmount } from '@/lib/utils'
import { useSettings } from '@/state/settings/hooks'

import SettingSlippageDropDown from './SettingSlippageDropDown'
import PoolTitle from '../PoolTitle'

export default function RemovePosition({ setPopup, strategy, isStaked, isManage = false }) {
  const [amount, setAmount] = useState('')
  const { deadline } = useSettings()
  const [slippage, setSlippage] = useState(0.5)
  const { onV1Remove, pending: v1Pending } = useV1Remove()
  const { onGammaRemove, pending: gammaPending } = useGammaRemove()
  const { onIchiRemove, pending: ichiPending } = useIchiRemove()
  const { onDefiedgeRemove, pending: defiedgePending } = useDefiedgeRemove()
  const t = useTranslations()

  const version = useMemo(() => strategy?.account?.version ?? 3, [strategy])

  const balance = useMemo(
    () => (strategy.staked ? strategy.account.gaugeBalance : strategy.account.walletBalance),
    [strategy],
  )

  const firstAmount = useMemo(
    () => strategy.token0.reserve && strategy.token0.reserve.times(amount || 0).div(strategy.totalSupply),
    [strategy, amount],
  )

  const secondAmount = useMemo(
    () => strategy.token1.reserve.times(amount || 0).div(strategy.totalSupply),
    [strategy, amount],
  )

  const errorMsg = useMemo(() => {
    if (isInvalidAmount(amount)) {
      return 'Invalid Amount'
    }
    if (!balance || balance.lt(amount)) {
      return 'Insufficient Balance'
    }
    return null
  }, [amount, balance])

  const callback = useCallback(() => {
    setAmount('')
    setPopup(false)
  }, [setPopup])

  const onRemoveLiquidity = useCallback(() => {
    if (errorMsg) {
      warnToast(errorMsg, 'warn')
      return
    }
    if ([PAIR_TYPES.STABLE, PAIR_TYPES.CLASSIC].includes(strategy.title)) {
      onV1Remove(strategy, amount, deadline, firstAmount, secondAmount, slippage, callback)
    } else if (GAMMA_TYPES.includes(strategy.title)) {
      onGammaRemove({
        pool: strategy,
        amount,
        version,
        isStaked,
        hasRewards: !!strategy.rewardUsd,
        callback,
      })
    } else if (ICHI_TYPES.includes(strategy.title)) {
      onIchiRemove({
        pool: strategy,
        isStaked,
        amount,
        version,
        callback,
        hasRewards: !!strategy.rewardUsd,
      })
    } else if (strategy.title === 'DefiEdge') {
      onDefiedgeRemove(strategy, amount, callback)
    }
  }, [
    errorMsg,
    strategy,
    onV1Remove,
    amount,
    deadline,
    firstAmount,
    secondAmount,
    slippage,
    callback,
    onGammaRemove,
    version,
    isStaked,
    onIchiRemove,
    onDefiedgeRemove,
  ])

  return (
    <>
      <ModalBody>
        {!isManage && <PoolTitle strategy={strategy} />}
        <div className='flex justify-end'>
          <SettingSlippageDropDown
            className='justify-end'
            slippage={slippage}
            updateSlippage={setSlippage}
            position='end'
          />
        </div>
        <DoubleInput
          title='Amount'
          pair={strategy}
          balance={balance}
          symbol={strategy.symbol}
          amount={amount}
          onAmountChange={setAmount}
          autoFocus
        />
        <div className='flex flex-col gap-4'>
          <TextHeading className='text-lg'>{t('You will receive')}</TextHeading>
          <div className='flex flex-col gap-3'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-1'>
                <CircleImage className='h-4 w-4' src={strategy.token0.logoURI} alt='thena logo' />
                <Paragraph className='font-medium'>{strategy.token0.symbol}</Paragraph>
              </div>
              <Paragraph>{formatAmount(firstAmount)}</Paragraph>
            </div>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-1'>
                <CircleImage className='h-4 w-4' src={strategy.token1.logoURI} alt='thena logo' />
                <Paragraph className='font-medium'>{strategy.token1.symbol}</Paragraph>
              </div>
              <Paragraph>{formatAmount(secondAmount)}</Paragraph>
            </div>
          </div>
        </div>
      </ModalBody>
      <ModalFooter className='flex flex-col-reverse gap-4 lg:flex-row'>
        <TextButton className='w-full' onClick={() => setPopup(false)}>
          {t('Cancel')}
        </TextButton>
        <PrimaryButton
          className='w-full'
          disabled={v1Pending || gammaPending || ichiPending || defiedgePending}
          onClick={() => {
            onRemoveLiquidity()
          }}
        >
          {t('Remove')}
        </PrimaryButton>
      </ModalFooter>
    </>
  )
}
