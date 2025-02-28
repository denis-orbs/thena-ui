'use client'

import { useTranslations } from 'next-intl'
import { useCallback, useMemo, useState } from 'react'

import { PrimaryButton } from '@/components/buttons/Button'
import ConnectButton from '@/components/buttons/ConnectButton'
import { useAlgebraAdd, useAlgebraIncrease } from '@/hooks/fusion/useAlgebra'
import useWallet from '@/hooks/useWallet'
import { warnToast } from '@/lib/notify'
import { cn } from '@/lib/utils'
import SettingSlippageDropDown from '@/modules/Position/SettingSlippageDropDown'
import { Field } from '@/state/fusion/actions'
import { useSettings } from '@/state/settings/hooks'

import { EnterAmounts } from './containers/EnterAmounts'

export default function ManualAdd({ baseCurrency, quoteCurrency, mintInfo, onShowModalSuccess, position }) {
  const { account } = useWallet()

  const errorMessage = useMemo(
    () => (position ? position.errorMessage : mintInfo.errorMessage),
    [mintInfo.errorMessage, position],
  )
  const amountA = useMemo(
    () => (position ? position.parsedAmounts?.[Field.CURRENCY_A] : mintInfo.parsedAmounts[Field.CURRENCY_A]),
    [mintInfo.parsedAmounts, position],
  )
  const amountB = useMemo(
    () => (position ? position.parsedAmounts?.[Field.CURRENCY_B] : mintInfo.parsedAmounts[Field.CURRENCY_B]),
    [mintInfo.parsedAmounts, position],
  )

  const { onAlgebraAdd, pending } = useAlgebraAdd()
  const { onAlgebraIncrease, pending: isPendingIncrease } = useAlgebraIncrease(position?.version ?? 3)
  const { deadline } = useSettings()
  const t = useTranslations()

  const [slippage, setSlippage] = useState(0.5)

  const onAddLiquidity = useCallback(() => {
    if (errorMessage) {
      warnToast(errorMessage, 'warn')
      return
    }

    if (!position) {
      onAlgebraAdd({ amountA, amountB, baseCurrency, quoteCurrency, mintInfo, slippage, deadline }, onShowModalSuccess)
    } else {
      onAlgebraIncrease(
        amountA,
        amountB,
        position.pos,
        position.depositADisabled,
        position.depositBDisabled,
        slippage,
        deadline,
        position.tokenId,
        () => {
          position.setTypedValue('')
          onShowModalSuccess()
        },
      )
    }
  }, [
    errorMessage,
    position,
    onAlgebraAdd,
    amountA,
    amountB,
    baseCurrency,
    quoteCurrency,
    mintInfo,
    slippage,
    deadline,
    onShowModalSuccess,
    onAlgebraIncrease,
  ])

  return (
    <section className='space-y-8'>
      <div className='space-y-4'>
        <SettingSlippageDropDown slippage={slippage} updateSlippage={setSlippage} className='mb-0' />
        <EnterAmounts currencyA={baseCurrency} currencyB={quoteCurrency} mintInfo={mintInfo} position={position} />
      </div>

      <div className={cn('mt-auto flex w-full flex-col items-center gap-4 pt-5 lg:flex-row')}>
        {account ? (
          <PrimaryButton disabled={pending || isPendingIncrease} onClick={onAddLiquidity} className='w-full'>
            {t('Deposit')}
          </PrimaryButton>
        ) : (
          <ConnectButton className='w-full' />
        )}
      </div>
    </section>
  )
}
