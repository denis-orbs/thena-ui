import { useTranslations } from 'next-intl'
import React, { useMemo, useState } from 'react'

import Box from '@/components/box'
import { PrimaryButton, TextButton } from '@/components/buttons/Button'
import Toggle from '@/components/toggle'
import { TextHeading } from '@/components/typography'
import { useTokenUSDValue } from '@/hooks/usePrices'
import { formatAmount } from '@/lib/utils'
import { ArrowLeftIcon, InfoCirCleDisableIcon } from '@/svgs'

import InputLiquidityToken from './InputLiquidityToken'

export default function SetInitialLiquidity({ setTokenAndWeights, tokensAndWeights, setCurrentStep }) {
  const t = useTranslations()
  const [isAutoOptimize, setIsAutoOptimize] = useState(false)
  // TODO: replace mock data
  const available = 42000

  const { getValueTokenAmountToUSD } = useTokenUSDValue()
  const total = useMemo(
    () => tokensAndWeights.reduce((sum, curr) => sum + getValueTokenAmountToUSD(curr.token.address, curr.amount), 0),
    [getValueTokenAmountToUSD, tokensAndWeights],
  )

  const isDisable = useMemo(() => !tokensAndWeights.every(item => item.amount > 0 && item.amount), [tokensAndWeights])

  return (
    <Box className='flex flex-col gap-3'>
      <div className='flex h-11 flex-row items-center'>
        <TextButton onClick={() => setCurrentStep(prev => prev - 1)} LeadingIcon={ArrowLeftIcon} />
        <TextHeading className='font-archia text-xl xl:text-3xl'>{t('Set Initial Liquidity')}</TextHeading>
      </div>
      <div className='flex flex-col gap-3'>
        {(tokensAndWeights || []).map(item => (
          <InputLiquidityToken
            asset={item.token}
            allocate={`(${item.allocate}%)`}
            setTokenAndWeights={setTokenAndWeights}
            amount={item.amount}
          />
        ))}
      </div>
      <div className='flex flex-row items-center gap-2'>
        <Toggle checked={isAutoOptimize} onChange={() => setIsAutoOptimize(prev => !prev)} />
        <label className='text-sm lg:text-[16px]'>{t('Auto optimize liquidity')}</label>{' '}
        <InfoCirCleDisableIcon className='h-4 w-4' />
      </div>
      <div className='flex flex-col gap-2 rounded-xl bg-neutral-800 p-4'>
        <div className='flex flex-row justify-between'>
          <span>{t('Total')}</span>
          <span>${formatAmount(total)}</span>
        </div>
        <div className='flex flex-row justify-between'>
          <span>
            {t('Available')}: ${formatAmount(available)} <span className='text-primary-400'>{t('Max')}</span>
          </span>
          <span className='text-primary-400'>{t('Optimize')}</span>
        </div>
      </div>
      <PrimaryButton disabled={isDisable} onClick={() => setCurrentStep(prev => prev + 1)} className='w-full'>
        {t('Preview')}
      </PrimaryButton>
    </Box>
  )
}
