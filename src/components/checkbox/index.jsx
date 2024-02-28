import React from 'react'

import { cn } from '@/lib/utils'
import { CheckIcon } from '@/svgs'

function CheckBox({ className, checked, setChecked = () => {}, ...rest }) {
  return (
    <button
      type='button'
      className={cn(
        'h-[21px] w-[21px] border border-transparent p-0.5',
        'outline outline-2 outline-offset-2 outline-transparent',
        'rounded transition-all duration-150 ease-out',
        'active:outline-focus disabled:bg-neutral-700',
        checked && 'bg-primary-600 hover:bg-primary-700',
        !checked && 'border-neutral-600 hover:border-neutral-400',
        className,
      )}
      onClick={() => setChecked(!checked)}
      {...rest}
    >
      {checked && <CheckIcon className='h-4 w-4 stroke-white disabled:stroke-neutral-600' />}
    </button>
  )
}

export default CheckBox
