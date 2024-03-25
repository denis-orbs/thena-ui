'use client'

import { useTranslations } from 'next-intl'
import React, { useCallback } from 'react'

import { PrimaryButton } from '@/components/buttons/Button'
import ConnectButton from '@/components/buttons/ConnectButton'
import { useAlgebraAdd } from '@/hooks/fusion/useAlgebra'
import { warnToast } from '@/lib/notify'
import useWallet from '@/lib/wallets/useWallet'
import { Field } from '@/state/fusion/actions'
import { useSettings } from '@/state/settings/hooks'

export default function ManualAdd({ baseCurrency, quoteCurrency, mintInfo }) {
  const { account } = useWallet()
  const { errorMessage } = mintInfo
  const amountA = mintInfo.parsedAmounts[Field.CURRENCY_A]
  const amountB = mintInfo.parsedAmounts[Field.CURRENCY_B]
  const { onAlgebraAdd, pending } = useAlgebraAdd()
  const { slippage, deadline } = useSettings()
  const t = useTranslations()

  const onAddLiquidity = useCallback(() => {
    if (errorMessage) {
      warnToast(errorMessage, 'warn')
      return
    }

    onAlgebraAdd(amountA, amountB, baseCurrency, quoteCurrency, mintInfo, slippage, deadline)
  }, [errorMessage, baseCurrency, quoteCurrency, amountA, amountB, mintInfo, slippage, deadline, onAlgebraAdd])

  if (!account) {
    return <ConnectButton className='w-full' />
  }

  return (
    <PrimaryButton
      disabled={pending}
      onClick={() => {
        onAddLiquidity()
      }}
      className='w-full'
    >
      {t('Add Liquidity')}
    </PrimaryButton>
  )
}
