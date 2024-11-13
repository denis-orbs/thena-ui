'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useMemo, useState } from 'react'

import { TextButton } from '@/components/buttons/Button'
import { TextHeading } from '@/components/typography'
import { ArrowLeftIcon } from '@/svgs'

import Step1 from './Step1'
import Step2 from './Step2'
import Step3 from './Step3'

export default function AddLiquidityPage() {
  const { push } = useRouter()
  const t = useTranslations()
  const [step, setStep] = useState(0)
  const [poolSelected, setPoolSelected] = useState(null)
  const [isAutomatic, setIsAutomatic] = useState(true)
  const [isAdd, setIsAdd] = useState(false)

  const layoutStep = useMemo(() => {
    // mock data:
    setIsAdd(false)
    switch (step) {
      case 0: {
        return <Step1 nextStep={setStep} setPoolSelected={setPoolSelected} />
      }
      case 1: {
        return (
          <Step2
            pool={poolSelected}
            setCurrentStep={setStep}
            currentStep={step}
            isAutomatic={isAutomatic}
            setIsAutomatic={setIsAutomatic}
          />
        )
      }

      case 2: {
        return <Step3 isAdd={isAdd} isAutomatic={isAutomatic} pool={poolSelected} setCurrentStep={setStep} />
      }

      default: {
        return <Step1 nextStep={setStep} setPoolSelected={setPoolSelected} />
      }
    }
  }, [isAdd, isAutomatic, poolSelected, step])

  return (
    <div className='mx-auto flex max-w-[1028px] flex-col'>
      <div className='h-11 w-[98px]'>
        <TextButton LeadingIcon={ArrowLeftIcon} onClick={() => push('/pools')}>
          {t('Pools')}
        </TextButton>
      </div>
      <TextHeading className='mt-4 font-archia text-[26px] font-semibold lg:text-4xl'>{t('Add Liquidity')}</TextHeading>
      {layoutStep}
    </div>
  )
}
