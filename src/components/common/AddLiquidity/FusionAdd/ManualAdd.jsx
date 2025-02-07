'use client'

import { useTranslations } from 'next-intl'
import { useCallback, useMemo } from 'react'

import { PrimaryButton } from '@/components/buttons/Button'
import ConnectButton from '@/components/buttons/ConnectButton'
import CustomTooltip from '@/components/tooltip'
import { Paragraph, TextHeading } from '@/components/typography'
import { MANUAL_TYPES } from '@/constant'
import { useAlgebraAdd } from '@/hooks/fusion/useAlgebra'
import { useEstimateAPR } from '@/hooks/fusion/useEstimateAPR'
import useWallet from '@/hooks/useWallet'
import { warnToast } from '@/lib/notify'
import { formatAmount, unwrappedSymbol } from '@/lib/utils'
import { Bound, Field } from '@/state/fusion/actions'
import { useSettings } from '@/state/settings/hooks'
import { InfoIcon } from '@/svgs'

import { EnterAmounts } from './containers/EnterAmounts'

export default function ManualAdd({ baseCurrency, quoteCurrency, mintInfo, slippage, strategy }) {
  const { account } = useWallet()
  const { [Bound.LOWER]: tickLower, [Bound.UPPER]: tickUpper } = useMemo(() => mintInfo.ticks, [mintInfo])
  const [token0, token1] = useMemo(() => {
    const [wrappedTokenA, wrappedTokenB] = [baseCurrency?.wrapped, quoteCurrency?.wrapped]
    if (!wrappedTokenA || !wrappedTokenB) return [null, null]

    return wrappedTokenA.sortsBefore(wrappedTokenB) ? [wrappedTokenA, wrappedTokenB] : [wrappedTokenB, wrappedTokenA]
  }, [baseCurrency?.wrapped, quoteCurrency?.wrapped])

  const { errorMessage } = mintInfo
  const amountA = mintInfo.parsedAmounts[Field.CURRENCY_A]
  const amountB = mintInfo.parsedAmounts[Field.CURRENCY_B]
  const apr = useEstimateAPR({
    pool: mintInfo.pool,
    poolAddress: mintInfo.poolAddress,
    tickUpper,
    tickLower,
    token0,
    amount0: amountA?.quotient,
    token1,
    amount1: amountB?.quotient,
    isFarming: strategy?.title === MANUAL_TYPES[0],
    tvl: strategy?.tvl,
  })

  const { onAlgebraAdd, pending } = useAlgebraAdd()
  const { deadline } = useSettings()
  const t = useTranslations()

  const onAddLiquidity = useCallback(() => {
    if (errorMessage) {
      warnToast(errorMessage, 'warn')
      return
    }

    onAlgebraAdd(amountA, amountB, baseCurrency, quoteCurrency, mintInfo, slippage, deadline)
  }, [errorMessage, onAlgebraAdd, amountA, amountB, baseCurrency, quoteCurrency, mintInfo, slippage, deadline])

  return (
    <section>
      <EnterAmounts currencyA={baseCurrency} currencyB={quoteCurrency} mintInfo={mintInfo} />

      <div className='mt-5 flex flex-col gap-3'>
        <div className='flex items-center justify-between'>
          <Paragraph className='font-medium'>Estimated APR</Paragraph>
          <Paragraph className='flex items-center gap-1'>
            {apr.toFixed(2)}%
            <InfoIcon className='ml-1 h-4 w-4 stroke-neutral-400' data-tooltip-id='apr-info' />
          </Paragraph>

          <CustomTooltip id='apr-info' className='max-w-[320px]'>
            Estimated return based on weekly trade fees and farming yield
          </CustomTooltip>
        </div>
      </div>

      <div className='mt-5 flex flex-col gap-4 border-t border-neutral-700 pt-4'>
        <TextHeading className='text-lg'>{t('Reserve Info')}</TextHeading>
        <div className='flex flex-col gap-3'>
          <div className='flex items-center justify-between'>
            <Paragraph className='font-medium'>
              {unwrappedSymbol(strategy?.token0)} {t('Amount')}
            </Paragraph>
            <Paragraph>{formatAmount(strategy?.token0?.reserve)}</Paragraph>
          </div>
          <div className='flex items-center justify-between'>
            <Paragraph className='font-medium'>
              {unwrappedSymbol(strategy?.token1)} {t('Amount')}
            </Paragraph>
            <Paragraph>{formatAmount(strategy?.token1?.reserve)}</Paragraph>
          </div>
        </div>
      </div>

      <div className='my-5 flex flex-col gap-4 border-t border-neutral-700 pt-4'>
        <TextHeading className='text-lg'>{t('My Info')}</TextHeading>
        <div className='flex flex-col gap-3'>
          <div className='flex items-center justify-between'>
            <Paragraph className='font-medium'>{t('Pooled Liquidity')}</Paragraph>
            <Paragraph>{formatAmount(strategy?.account?.totalLp)} LP</Paragraph>
          </div>
        </div>
      </div>

      {account ? (
        <PrimaryButton
          disabled={pending}
          onClick={() => {
            onAddLiquidity()
          }}
          className='w-full'
        >
          {t('Add Liquidity')}
        </PrimaryButton>
      ) : (
        <ConnectButton className='w-full' />
      )}
    </section>
  )
}
