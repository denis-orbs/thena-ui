'use client'

import BigNumber from 'bignumber.js'
import { useTranslations } from 'next-intl'
import React, { useCallback, useMemo, useState } from 'react'

import { PrimaryButton } from '@/components/buttons/Button'
import ConnectButton from '@/components/buttons/ConnectButton'
import { TokenAmountInput } from '@/components/input/TokenAmountInput'
import { useAssets } from '@/context/assetsContext'
import { useIchiManage, useIchiManageV3 } from '@/hooks/fusion/useIchi'
import useWallet from '@/hooks/useWallet'
import { warnToast } from '@/lib/notify'
import { cn, isInvalidAmount } from '@/lib/utils'
import PoolTitle from '@/modules/PoolTitle'
import SettingSlippageDropDown from '@/modules/Position/SettingSlippageDropDown'

export default function IchiAdd({ strategy, isAdd, isModal }) {
  const [amount, setAmount] = useState('')
  const { onIchiAddAndStake: addIchiPoolV2, pending: pendingV2 } = useIchiManage()
  const { addIchiPool: addIchiPoolV3, pending: pendingV3 } = useIchiManageV3()
  const { account } = useWallet()
  const assets = useAssets()
  const [slippage, setSlippage] = useState(0.5)
  const bnbBalance = assets.find(ele => ele.address === 'BNB').balance
  const depositToken = assets.find(ele => ele.address.toLowerCase() === strategy?.allowed?.address)
  const t = useTranslations()

  const isDouble = useMemo(() => depositToken?.symbol === 'WBNB', [depositToken])

  const balance = useMemo(() => {
    if (isDouble) {
      return depositToken?.balance.plus(bnbBalance)
    }
    return depositToken?.balance
  }, [depositToken, isDouble, bnbBalance])

  const amountToWrap = useMemo(() => {
    let final
    if (depositToken?.balance.lt(amount)) {
      final = new BigNumber(amount).minus(depositToken.balance)
    }
    return final
  }, [amount, depositToken])

  const errorMsg = useMemo(() => {
    if (isInvalidAmount(amount)) {
      return 'Invalid Amount'
    }
    if (balance.lt(amount)) {
      return 'Insufficient Balance'
    }
    return null
  }, [balance, amount])

  const onAddLiquidityAndStake = useCallback(() => {
    if (errorMsg) {
      warnToast(errorMsg)
    } else if (strategy?.account?.version === 2) {
      addIchiPoolV2(strategy, amount, amountToWrap, slippage)
    } else {
      addIchiPoolV3(strategy, amount, amountToWrap, slippage)
    }
  }, [addIchiPoolV3, amount, amountToWrap, errorMsg, addIchiPoolV2, slippage, strategy])

  return (
    <>
      <div className={cn('inline-flex w-full flex-col gap-5', isModal && 'p-3 lg:px-6')}>
        {isAdd && strategy && <PoolTitle strategy={strategy} />}

        <div className='flex justify-end'>
          <SettingSlippageDropDown slippage={slippage} updateSlippage={setSlippage} />
        </div>

        <div className='flex flex-col gap-4'>
          <TokenAmountInput
            asset={depositToken}
            maxBalance={isDouble ? balance : null}
            amount={amount}
            onAmountChange={setAmount}
            showPercent={false}
          />
        </div>
      </div>

      <div
        className={cn('mt-auto flex w-full flex-col items-center gap-4 pt-5 lg:flex-row', isModal && 'px-3 lg:px-6')}
      >
        {account ? (
          <PrimaryButton
            disabled={pendingV2 || pendingV3}
            onClick={() => {
              onAddLiquidityAndStake()
            }}
            className='w-full'
          >
            {t('Deposit')}
          </PrimaryButton>
        ) : (
          <ConnectButton className='w-full' />
        )}
      </div>
    </>
  )
}
