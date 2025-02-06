import React from 'react'

import Box from '@/components/box'
import { cn } from '@/lib/utils'

function Stepper({ steps, currentStep, setCurrentStep, isEdit }) {
  return (
    <Box className='flex flex-col gap-6'>
      {steps.map((step, index) => (
        <div
          key={index}
          onClick={() => (isEdit ? setCurrentStep(index + 1) : {})}
          className={cn('flex items-center gap-3', isEdit ? 'cursor-pointer' : '')}
        >
          <div
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-lg',
              currentStep === index + 1 ? 'bg-primary-600 text-neutral-50' : 'bg-[#34243D] text-neutral-500',
            )}
          >
            {index + 1}
          </div>
          <span className={('ml-4', currentStep === index + 1 ? 'text-neutral-50' : 'text-neutral-500')}>{step}</span>
        </div>
      ))}
    </Box>
  )
}

export default Stepper
