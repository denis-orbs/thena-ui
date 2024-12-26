'use client'

import { useTranslations } from 'next-intl'
import { useCallback } from 'react'

import { PrimaryButton } from '@/components/buttons/Button'
import ConnectButton from '@/components/buttons/ConnectButton'
import { useAlgebraAdd } from '@/hooks/fusion/useAlgebra'
import useWallet from '@/hooks/useWallet'
import { warnToast } from '@/lib/notify'
import { Field } from '@/state/fusion/actions'
import { useSettings } from '@/state/settings/hooks'

export default function ManualAdd({ baseCurrency, quoteCurrency, mintInfo, slippage, strategy }) {
  const { account } = useWallet()
  const { errorMessage } = mintInfo
  const amountA = mintInfo.parsedAmounts[Field.CURRENCY_A]
  const amountB = mintInfo.parsedAmounts[Field.CURRENCY_B]
  const { onAlgebraAdd, pending } = useAlgebraAdd()
  const { deadline } = useSettings()
  const t = useTranslations()

  const onAddLiquidity = useCallback(() => {
    if (errorMessage) {
      warnToast(errorMessage, 'warn')
      return
    }

    onAlgebraAdd(amountA, amountB, baseCurrency, quoteCurrency, mintInfo, slippage, deadline, strategy?.isFarming)
  }, [
    errorMessage,
    strategy,
    onAlgebraAdd,
    amountA,
    amountB,
    baseCurrency,
    quoteCurrency,
    mintInfo,
    slippage,
    deadline,
  ])

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
