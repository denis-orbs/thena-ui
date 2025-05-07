'use client'

import { useSearchParams } from 'next/navigation'
import React, { useEffect, useMemo, useState } from 'react'

import LayoutWithBackButton from '@/components/common/LayoutWithBackButton'
import { PAIR_TYPES } from '@/constant'

import Step1 from './Step1'
import Step2 from './Step2'
import Step3 from './Step3'

export default function AddLiquidityPage() {
  const params = useSearchParams()
  const step = Number(params.get('step') ?? 1)
  const pairType = params.get('pairType') || PAIR_TYPES.LSD
  const firstAddress = params.get('firstAddress')
  const secondAddress = params.get('secondAddress')

  const [stepUrls, setStepUrls] = useState({
    1: '/pools/add-liquidity?step=1',
    2: '/pools/add-liquidity?step=2',
  })

  useEffect(() => {
    if (firstAddress && secondAddress) {
      setStepUrls({
        1: `/pools/add-liquidity?step=1&pairType=${pairType}`,
        // eslint-disable-next-line max-len
        2: `/pools/add-liquidity?step=2&pairType=${pairType}&firstAddress=${firstAddress}&secondAddress=${secondAddress}`,
      })
    }
  }, [firstAddress, secondAddress, pairType])

  const backUrl = useMemo(() => {
    if (step === 1) return '/pools'
    if (step === 2) return stepUrls[1]
    if (step === 3) return stepUrls[2]
    return '/pools'
  }, [step, stepUrls])

  return (
    <LayoutWithBackButton backUrl={backUrl}>
      <div className='container mx-auto flex flex-col'>
        {step === 1 && <Step1 />}
        {step === 2 && <Step2 />}
        {step === 3 && <Step3 />}
      </div>
    </LayoutWithBackButton>
  )
}
