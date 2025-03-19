'use client'

import { useSearchParams } from 'next/navigation'
import React from 'react'

import LayoutWithBackButton from '@/components/common/LayoutWithBackButton'

import Step1 from './Step1'
import Step2 from './Step2'
import Step3 from './Step3'

export default function AddLiquidityPage() {
  const params = useSearchParams()
  const step = Number(params.get('step') ?? 1)

  return (
    <LayoutWithBackButton>
      <div className='container mx-auto flex flex-col'>
        {step === 1 && <Step1 />}
        {step === 2 && <Step2 />}
        {step === 3 && <Step3 />}
      </div>
    </LayoutWithBackButton>
  )
}
