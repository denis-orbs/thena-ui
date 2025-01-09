'use client'

import { isEmpty } from 'lodash'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useEffect, useMemo, useState } from 'react'

import Loading from '@/app/loading'
import { TextButton } from '@/components/buttons/Button'
import { TextHeading } from '@/components/typography'
import { useAssets } from '@/context/assetsContext'
import { useGetAsset } from '@/hooks/fusion/Tokens'
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
  // const searchParams = useSearchParams()
  const { push } = useRouter()
  const t = useTranslations()
  const assets = useAssets()
  const [fees, setFees] = useState(0.3)
  const [tokensAndWeights, setTokenAndWeights] = useState([])

  const searchParams = useSearchParams()
  const firstAddress = searchParams.get('firstAddress')
  const secondAddress = searchParams.get('secondAddress')
  const firstToken = useGetAsset(firstAddress)
  const secondToken = useGetAsset(secondAddress)

  useEffect(() => {
    setTokenAndWeights(prev => {
      if (!prev || prev.length === 0 || !prev?.[0]?.token || !prev?.[1]?.token) {
        return [
          { token: firstToken || null, lock: false, weight: 50 },
          { token: secondToken || null, lock: false, weight: 50 },
        ]
      }
      return prev.map(item => {
        const itemAddress = item?.token?.address
        if (firstToken?.address?.toLowerCase() === itemAddress?.toLowerCase()) {
          console.log('check1')
          return {
            ...item,
            token: {
              ...item.token,
              ...firstToken,
            },
          }
        }

        if (secondToken?.address?.toLowerCase() === itemAddress?.toLowerCase()) {
          console.log('check2')
          return {
            ...item,
            token: {
              ...item.token,
              ...secondToken,
            },
          }
        }
        return item
      })
    })
  }, [firstAddress, firstToken, secondAddress, secondAddress?.address, secondToken])

  const [currentStep, setCurrentStep] = useState(1)
  const initialPoolSymbol = useMemo(() => {
    const result = tokensAndWeights.reduce(
      (str, curr, index) =>
        index > 0
          ? `${str}-${curr?.token?.symbol === 'WBNB' ? 'BNB' : curr?.token?.symbol}`
          : `${str}${curr?.token?.symbol === 'WBNB' ? 'BNB' : curr?.token?.symbol}`,
      '',
    )
    return result
  }, [tokensAndWeights])

  if (!tokensAndWeights || isEmpty(tokensAndWeights)) {
    return <Loading />
  }

  return (
    <div className='flex flex-col'>
      <div className='h-11 w-[98px]'>
        <TextButton onClick={() => push('/pools')} LeadingIcon={ArrowLeftIcon}>
          {t('Back')}
        </TextButton>
      </div>
      <div className='flex flex-col'>
        <TextHeading className='mb-10 font-archia text-3xl font-semibold lg:text-[40px]'>
          {t('THENA Weighted Pool')}
        </TextHeading>
        <div className='flex flex-col justify-between gap-8 lg:flex-row'>
          <div className='hidden lg:block lg:w-[380px]'>
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
