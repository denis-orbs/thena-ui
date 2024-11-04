'use client'

import { useTranslations } from 'next-intl'
import React, { useState } from 'react'

import { TextButton } from '@/components/buttons/Button'
import { TextHeading } from '@/components/typography'
import ChooseTokenAndWeights from '@/modules/WeightedPool/ChooseTokenAndWeights'
import MaxInitialLiquidity from '@/modules/WeightedPool/MaxInitialLiquidity'
import PoolSummary from '@/modules/WeightedPool/PoolSummary'
import Preview from '@/modules/WeightedPool/Preview'
import SetInitialLiquidity from '@/modules/WeightedPool/SetInitialLiquidity'
import SetPoolFees from '@/modules/WeightedPool/SetPoolFees'
import StepCreate from '@/modules/WeightedPool/StepCreate'
import { ArrowLeftIcon } from '@/svgs'

function PoolWithStep({ currentStep, setCurrentStep, tokensAndWeights, setTokenAndWeights }) {
  switch (currentStep) {
    case 1: {
      return (
        <ChooseTokenAndWeights
          setCurrentStep={setCurrentStep}
          tokensAndWeights={tokensAndWeights}
          setTokenAndWeights={setTokenAndWeights}
        />
      )
    }

    case 2: {
      return <SetPoolFees setCurrentStep={setCurrentStep} />
    }

    case 3: {
      return (
        <SetInitialLiquidity
          setCurrentStep={setCurrentStep}
          setTokenAndWeights={setTokenAndWeights}
          tokensAndWeights={tokensAndWeights}
        />
      )
    }

    case 4: {
      return <Preview setCurrentStep={setCurrentStep} tokensAndWeights={tokensAndWeights} />
    }

    default:
      return <></>
  }
}

export default function WeightedPoolPage() {
  const t = useTranslations()
  const [tokensAndWeights, setTokenAndWeights] = useState([])
  const [currentStep, setCurrentStep] = useState(1)
  return (
    <div className='flex flex-col'>
      <div className='h-11 w-[98px]'>
        <TextButton LeadingIcon={ArrowLeftIcon}>{t('Back')}</TextButton>
      </div>
      <div className='flex flex-col'>
        <TextHeading className='mb-10 font-archia text-[40px] font-semibold'>{t('THENA Weighted Pool')}</TextHeading>
        <div className='flex flex-row justify-between gap-8'>
          <div className='lg:w-[380px]'>
            <StepCreate currentStep={currentStep} />
          </div>
          <div className='lg:w-[616px]'>
            <PoolWithStep
              currentStep={currentStep}
              setCurrentStep={setCurrentStep}
              setTokenAndWeights={setTokenAndWeights}
              tokensAndWeights={tokensAndWeights}
            />
          </div>
          <div className='flex flex-col gap-8 lg:w-[380px]'>
            <PoolSummary tokensAndWeights={tokensAndWeights} />
            <MaxInitialLiquidity tokensAndWeights={tokensAndWeights} />
          </div>
        </div>
      </div>
    </div>
  )
}
