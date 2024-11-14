'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useMemo, useState } from 'react'

import { TextButton } from '@/components/buttons/Button'
import { TextHeading } from '@/components/typography'
import { useAssets } from '@/context/assetsContext'
import ChooseTokenAndWeights from '@/modules/WeightedPool/ChooseTokenAndWeights'
import MaxInitialLiquidity from '@/modules/WeightedPool/MaxInitialLiquidity'
import PoolSummary from '@/modules/WeightedPool/PoolSummary'
import Preview from '@/modules/WeightedPool/Preview'
import SetInitialLiquidity from '@/modules/WeightedPool/SetInitialLiquidity'
import SetPoolFees from '@/modules/WeightedPool/SetPoolFees'
import StepCreate from '@/modules/WeightedPool/StepCreate'
import { ArrowLeftIcon } from '@/svgs'

function PoolWithStep({
  currentStep,
  setCurrentStep,
  tokensAndWeights,
  setTokenAndWeights,
  fees,
  setFees,
  initialPoolSymbol,
}) {
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
      return (
        <SetPoolFees
          setCurrentStep={setCurrentStep}
          setTokenAndWeights={setTokenAndWeights}
          fees={fees}
          setFees={setFees}
        />
      )
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
      return (
        <Preview
          setCurrentStep={setCurrentStep}
          tokensAndWeights={tokensAndWeights}
          fees={fees}
          setFees={setFees}
          initialPoolSymbol={initialPoolSymbol}
        />
      )
    }

    default:
      return (
        <ChooseTokenAndWeights
          setCurrentStep={setCurrentStep}
          tokensAndWeights={tokensAndWeights}
          setTokenAndWeights={setTokenAndWeights}
        />
      )
  }
}

export default function CreateWeightedPoolPage() {
  const searchParams = useSearchParams()
  const { push } = useRouter()
  const t = useTranslations()
  const assets = useAssets()
  const [fees, setFees] = useState(null)
  const [tokensAndWeights, setTokenAndWeights] = useState(() => {
    const firstAddress = searchParams.get('firstAddress')
    const secondAddress = searchParams.get('secondAddress')
    const firstToken = assets.find(asset => asset.address === firstAddress)
    const secondAsset = assets.find(asset => asset.address === secondAddress)
    return [
      { token: firstToken || null, lock: false, allocate: 50 },
      { token: secondAsset || null, lock: false, allocate: 50 },
    ]
  })
  const [currentStep, setCurrentStep] = useState(1)
  const initialPoolSymbol = useMemo(() => {
    const result = tokensAndWeights.reduce(
      (str, curr, index) => (index > 0 ? `${str}-${curr?.token?.symbol}` : `${str}${curr?.token?.symbol}`),
      '',
    )
    return result
  }, [tokensAndWeights])

  return (
    <div className='flex flex-col'>
      <div className='h-11 w-[98px]'>
        <TextButton onClick={() => push('/pools')} LeadingIcon={ArrowLeftIcon}>
          {t('Back')}
        </TextButton>
      </div>
      <div className='flex flex-col'>
        <TextHeading className='mb-10 font-archia text-[40px] font-semibold'>{t('THENA Weighted Pool')}</TextHeading>
        <div className='flex flex-col justify-between gap-8 lg:flex-row'>
          <div className='lg:w-[380px]'>
            <StepCreate currentStep={currentStep} />
          </div>
          <div className='lg:w-[616px]'>
            <PoolWithStep
              currentStep={currentStep}
              setCurrentStep={setCurrentStep}
              setTokenAndWeights={setTokenAndWeights}
              tokensAndWeights={tokensAndWeights}
              initialPoolSymbol={initialPoolSymbol}
              fees={fees}
              setFees={setFees}
              assets={assets}
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
