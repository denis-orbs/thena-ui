import { useTranslations } from 'next-intl'
import React, { useMemo, useState } from 'react'

import Box from '@/components/box'
import { PrimaryButton, TextButton } from '@/components/buttons/Button'
import Input from '@/components/input'
import Selection from '@/components/selection'
import { Paragraph, TextHeading } from '@/components/typography'
import { ArrowLeftIcon } from '@/svgs'

import { ErrorMessage } from './ChooseTokenAndWeights'

export default function SetPoolFees({ setCurrentStep }) {
  const t = useTranslations()
  const [poolFee, setPoolFee] = useState()
  const poolRange = useMemo(
    () => [
      {
        label: '0,1%',
        active: poolFee === 0.1,
        onClickHandler: () => setPoolFee(0.1),
      },
      {
        label: '0,3%',
        active: poolFee === 0.3,
        onClickHandler: () => setPoolFee(0.3),
      },
      {
        label: '1,00%',
        active: poolFee === 1.0,
        onClickHandler: () => setPoolFee(1.0),
      },
    ],
    [poolFee],
  )
  return (
    <Box>
      <div className='flex h-11 flex-row'>
        <TextButton onClick={() => setCurrentStep(prev => prev - 1)} LeadingIcon={ArrowLeftIcon} />
        <TextHeading className='font-archia text-3xl'>{t('Set Pool Fees')}</TextHeading>
      </div>
      <Paragraph>{t('Set Pool Fees description')}</Paragraph>
      <div className='mt-4 flex flex-row justify-between'>
        <Selection className='!h-11' data={poolRange} />
        <Input className='h-11 w-[112px]' placeholder='Custom' suffix='%' classNames={{ input: 'pr-7' }} />
      </div>
      <ErrorMessage className='mt-6' message={t('Pool fee message')} />
      <PrimaryButton disabled={!poolFee} className='mt-6 w-full' onClick={() => setCurrentStep(prev => prev + 1)}>
        {t('Next')}
      </PrimaryButton>
    </Box>
  )
}
