'use client'

import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import ConnectButton from '@/components/buttons/ConnectButton'
import { MANUAL_TYPES } from '@/constant'
import { useAlgebraAdd, useAlgebraIncrease } from '@/hooks/fusion/useAlgebra'
import { useEstimateAPR } from '@/hooks/fusion/useEstimateAPR'
import useWallet from '@/hooks/useWallet'
import { warnToast } from '@/lib/notify'
import { cn } from '@/lib/utils'
import SettingSlippageDropDown from '@/modules/Position/SettingSlippageDropDown'
import { useAprStore } from '@/state/APR/store'
import { Bound, Field } from '@/state/fusion/actions'
import { useV3MintState } from '@/state/fusion/hooks'
import { useSettings } from '@/state/settings/hooks'

import { EnterAmounts } from './containers/EnterAmounts'

export default function ManualAdd({
  baseCurrency,
  quoteCurrency,
  setBaseCurrency,
  setQuoteCurrency,
  mintInfo,
  onShowModalSuccess,
  position,
  handleBack,
}) {
  const { account } = useWallet()
  const { setAPRs } = useAprStore()

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

  const { startPriceTypedValue } = useV3MintState()
  const { onAlgebraAdd, pending } = useAlgebraAdd()
  const { onAlgebraIncrease, pending: isPendingIncrease } = useAlgebraIncrease(position?.version ?? 3)
  const { deadline } = useSettings()
  const t = useTranslations()

  const [slippage, setSlippage] = useState(0.5)

  const { strategy, ticks, pool, poolAddress, parsedAmounts } = mintInfo
  const { [Field.CURRENCY_A]: currencyAAmount, [Field.CURRENCY_B]: currencyBAmount } = parsedAmounts

  const estimateAPR = useEstimateAPR({
    pool,
    poolAddress: poolAddress?.toLowerCase(),
    tickLower: ticks[Bound.LOWER],
    tickUpper: ticks[Bound.UPPER],
    token0: baseCurrency,
    amount0: currencyAAmount?.quotient,
    token1: quoteCurrency,
    amount1: currencyBAmount?.quotient,
    isFarming: strategy?.title === MANUAL_TYPES[0],
  })

  useEffect(() => {
    setAPRs(estimateAPR)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(estimateAPR), setAPRs])

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
    <section className='space-y-2 md:space-y-8'>
      <div className={cn('space-y-2 md:space-y-4', mintInfo.noLiquidity && !startPriceTypedValue && 'blur-xl')}>
        <SettingSlippageDropDown slippage={slippage} updateSlippage={setSlippage} className='mb-0' />
        <EnterAmounts
          currencyA={baseCurrency}
          currencyB={quoteCurrency}
          setCurrencyA={setBaseCurrency}
          setCurrencyB={setQuoteCurrency}
          mintInfo={mintInfo}
          position={position}
        />
      </div>

      <div className={cn('!mt-8 flex w-full flex-col items-center gap-2 lg:flex-row')}>
        <EmphasisButton className='block w-full md:hidden' onClick={handleBack}>
          {t('Cancel')}
        </EmphasisButton>
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
