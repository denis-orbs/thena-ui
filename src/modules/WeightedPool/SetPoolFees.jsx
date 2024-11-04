import { useTranslations } from 'next-intl'
import React, { useMemo } from 'react'

import Box from '@/components/box'
import { PrimaryButton, TextButton } from '@/components/buttons/Button'
import Input from '@/components/input'
import Selection from '@/components/selection'
import { Paragraph, TextHeading } from '@/components/typography'
import { cn } from '@/lib/utils'
import { ArrowLeftIcon } from '@/svgs'

import { ErrorMessage } from './ChooseTokenAndWeights'

export default function SetPoolFees({ setCurrentStep, fees, setFees }) {
  const t = useTranslations()
  const poolRange = useMemo(
    () => [
      {
        label: '0,1%',
        active: fees === 0.1,
        onClickHandler: () => setFees(0.1),
      },
      {
        label: '0,3%',
        active: fees === 0.3,
        onClickHandler: () => setFees(0.3),
      },
      {
        label: '1,00%',
        active: fees === 1.0,
        onClickHandler: () => setFees(1.0),
      },
    ],
    [fees, setFees],
  )

  const isCustomFee = useMemo(() => fees !== null && fees !== 0.1 && fees !== 0.3 && fees !== 1, [fees])

  return (
    <Box>
      <div className='flex h-11 flex-row'>
        <TextButton onClick={() => setCurrentStep(prev => prev - 1)} LeadingIcon={ArrowLeftIcon} />
        <TextHeading className='font-archia text-3xl'>{t('Set Pool Fees')}</TextHeading>
      </div>
      <Paragraph>{t('Set Pool Fees description')}</Paragraph>
      <div className='mt-4 flex flex-row justify-between'>
        <Selection className='!h-11' data={poolRange} />
        <Input
          onChange={e => {
            setFees(e.target.value)
          }}
          className={cn('h-11 w-[112px]', isCustomFee ? 'bg-neutral-700 font-medium text-neutral-200' : '')}
          placeholder='Custom'
          suffix='%'
          classNames={{ input: 'pr-7' }}
        />
      </div>
      <ErrorMessage className='mt-6' message={t('Pool fee message')} />
      <PrimaryButton disabled={!fees} className='mt-6 w-full' onClick={() => setCurrentStep(prev => prev + 1)}>
        {t('Next')}
      </PrimaryButton>
    </Box>
  )
}
