'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import React, { useCallback } from 'react'

import Step1 from './Step1'
import Step2 from './Step2'
import Step3 from './Step3'

export default function AddLiquidityPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const params = useSearchParams()
  const step = Number(params.get('step') ?? 1)

  const setStep = useCallback(
    nextStep => {
      const query = new URLSearchParams(searchParams.toString())
      query.set('step', nextStep)
      router.replace(`${pathname}?${query.toString()}`)
    },
    [pathname, router, searchParams],
  )

  return (
    <div className='container mx-auto flex flex-col'>
      {step === 1 && <Step1 nextStep={setStep} />}
      {step === 2 && <Step2 setStep={setStep} />}
      {step === 3 && <Step3 setStep={setStep} />}
    </div>
  )
}
