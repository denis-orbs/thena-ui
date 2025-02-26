'use client'

import React from 'react'

import { cn } from '@/lib/utils'

export default function StepCreate({ currentStep, setCurrentStep, disabled2, disabled3 }) {
  const steps = [1, 2, 3]

  return (
    <div className='flex gap-6'>
      {steps.map(step => (
        <div
          key={step}
          className='flex cursor-pointer flex-row items-center gap-1'
          onClick={() => {
            if ((disabled2 && step === 2) || ((disabled2 || disabled3) && step === 3)) return
            setCurrentStep(step)
          }}
        >
          <div
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-[8px] text-[18px] text-neutral-50',
              currentStep === step ? 'bg-primary-600' : '',
            )}
          >
            {step}
          </div>
        </div>
      ))}
    </div>
  )
}
