'use client'

import { useSearchParams } from 'next/navigation'
import React from 'react'

import LayoutWithBackButton from '@/components/common/LayoutWithBackButton'
import { useBackURL } from '@/hooks/useBackURL'
import { useMediaQuery } from '@/hooks/useMediaQuery'

import Step1 from './Step1'
import Step2 from './Step2'
import Step3 from './Step3'

export default function AddLiquidityPage() {
  const params = useSearchParams()
  const backUrl = useBackURL()
  const step = Number(params.get('step') ?? 1)
  const { isXlDown } = useMediaQuery()

  return (
    <LayoutWithBackButton
      hiddenBackButton={isXlDown}
      className='3xl:mt-16! 3xl:w-[1440px]! mx-4 lg:mx-10 xl:mx-auto xl:w-[1184px]! 2xl:mt-8! 2xl:w-[1312px]!'
      backUrl={backUrl}
    >
      <div className='container mx-auto flex flex-col'>
        {step === 1 && <Step1 />}
        {step === 2 && <Step2 />}
        {step === 3 && <Step3 />}
      </div>
    </LayoutWithBackButton>
  )
}
