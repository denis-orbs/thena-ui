import { useTranslations } from 'next-intl'
import React, { useMemo } from 'react'

import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import Input from '@/components/input'
import { Paragraph, TextHeading } from '@/components/typography'
import { isInvalidAmount } from '@/lib/utils'

import SetInitialLiquidity from './SetInitialLiquidity'
import SetPoolFees from './SetPoolFees'
import WeightedPoolLogo from './WeightedPoolLogo'

function SetWeightedAttributes({
  tokensAndWeights,
  fees,
  setFees,
  poolName,
  setPoolName,
  setTokenAndWeights,
  setCurrentStep,
}) {
  const isDisable = useMemo(
    () => (tokensAndWeights || []).some(item => item.isError || isInvalidAmount(item?.amount)),
    [tokensAndWeights],
  )
  const t = useTranslations()
  return (
    <div className='flex flex-col gap-4'>
      <div className='flex gap-4'>
        <div className='flex min-h-full flex-[7] flex-col justify-between gap-4'>
          <TextHeading className='font-archia text-2xl font-semibold lg:text-3xl'>{t('Set Pool Name')}</TextHeading>
          <div className='flex items-center gap-4'>
            <WeightedPoolLogo
              tokens={tokensAndWeights.map(token => ({ ...token.token, weight: token.weight }))}
              width={24}
              height={24}
            />
            <Paragraph className='text-neutral-200'>{t('Weighted Pool')}</Paragraph>
          </div>
          <Input
            type='text'
            val={poolName}
            onChange={e => setPoolName(e.target.value)}
            placeholder='Enter Name for Pool'
          />
        </div>
        <div className='min-h-full flex-[3]'>
          <SetPoolFees fees={fees} setFees={setFees} />
        </div>
      </div>
      <div>
        <SetInitialLiquidity setTokenAndWeights={setTokenAndWeights} tokensAndWeights={tokensAndWeights} />
      </div>
      <div className='flex flex-col gap-4 lg:flex-row'>
        <EmphasisButton className='w-full lg:w-fit' onClick={() => setCurrentStep(prev => prev - 1)}>
          {t('Back')}
        </EmphasisButton>
        <PrimaryButton
          disabled={isDisable}
          className='w-full lg:w-fit'
          onClick={() => setCurrentStep(prev => prev + 1)}
        >
          {t('Next')}
        </PrimaryButton>
      </div>
    </div>
  )
}
export default SetWeightedAttributes
