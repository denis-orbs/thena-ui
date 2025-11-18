import { useTranslations } from 'next-intl'
import React from 'react'

import cn from '@/utils/classes'

import { Paragraph } from '../typography'

function Toggle({ className, onChange, toggleId, label, checked, disabled = false }) {
  const t = useTranslations()

  return (
    <div className={cn('flex items-center gap-2.5 max-md:mt-2', className)}>
      <label htmlFor={toggleId} className='relative inline-flex cursor-pointer items-center'>
        <input
          onChange={onChange}
          type='checkbox'
          checked={checked}
          id={toggleId}
          className='peer sr-only focus:outline-hidden'
          disabled={disabled}
        />
        <div
          className={cn(
            'h-[24px] w-[44px] rounded-full bg-neutral-700 hover:bg-neutral-600',
            'peer-checked peer-checked:bg-primary-600 hover:peer-checked:bg-primary-700 peer-checked:after:translate-x-full peer-checked:after:border-white',
            'after:absolute after:top-1 after:left-1.5 after:h-[16px] after:w-[16px]',
            "after:rounded-full after:bg-neutral-500 after:transition-all after:content-[''] hover:after:bg-neutral-400",
            'peer-checked:after:bg-primary-200 hover:peer-checked:after:bg-primary-300',
            'outline-2 outline-offset-4 outline-transparent outline-solid',
            disabled ? 'cursor-not-allowed' : 'active:outline-focus',
          )}
        />
      </label>
      <Paragraph>{label && t(label)}</Paragraph>
    </div>
  )
}

export default Toggle
