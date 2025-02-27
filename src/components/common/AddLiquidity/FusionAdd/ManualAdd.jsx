'use client'

import { useTranslations } from 'next-intl'
import { useCallback, useState } from 'react'

import { PrimaryButton } from '@/components/buttons/Button'
import ConnectButton from '@/components/buttons/ConnectButton'
import { useAlgebraAdd } from '@/hooks/fusion/useAlgebra'
import useWallet from '@/hooks/useWallet'
import { warnToast } from '@/lib/notify'
import { cn } from '@/lib/utils'
import SettingSlippageDropDown from '@/modules/Position/SettingSlippageDropDown'
import { Field } from '@/state/fusion/actions'
import { useSettings } from '@/state/settings/hooks'

import { EnterAmounts } from './containers/EnterAmounts'

export default function ManualAdd({ baseCurrency, quoteCurrency, mintInfo, onShowModalSuccess }) {
  const { account } = useWallet()

  const { errorMessage } = mintInfo
  const amountA = mintInfo.parsedAmounts[Field.CURRENCY_A]
  const amountB = mintInfo.parsedAmounts[Field.CURRENCY_B]

  const { onAlgebraAdd, pending } = useAlgebraAdd()
  const { deadline } = useSettings()
  const t = useTranslations()

  const [slippage, setSlippage] = useState(0.5)

  const onAddLiquidity = useCallback(() => {
    if (errorMessage) {
      warnToast(errorMessage, 'warn')
      return
    }

    onAlgebraAdd({ amountA, amountB, baseCurrency, quoteCurrency, mintInfo, slippage, deadline }, onShowModalSuccess)
  }, [
    errorMessage,
    onAlgebraAdd,
    amountA,
    amountB,
    baseCurrency,
    quoteCurrency,
    mintInfo,
    slippage,
    deadline,
    onShowModalSuccess,
  ])

  return (
    <section className='space-y-8'>
      <div className='space-y-4'>
        <SettingSlippageDropDown slippage={slippage} updateSlippage={setSlippage} className='mb-0' />
        <EnterAmounts currencyA={baseCurrency} currencyB={quoteCurrency} mintInfo={mintInfo} />
      </div>

      <div className={cn('mt-auto flex w-full flex-col items-center gap-4 pt-5 lg:flex-row')}>
        {account ? (
          <PrimaryButton disabled={pending} onClick={onAddLiquidity} className='w-full'>
            {t('Deposit')}
          </PrimaryButton>
        ) : (
          <ConnectButton className='w-full' />
        )}
      </div>
    </section>
  )
}
