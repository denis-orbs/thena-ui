import React from 'react'

import CheckIcon from '@/icons/CheckIcon'
import { cn } from '@/lib/utils'

function CheckBox({ className, checked, setChecked = () => {}, ...rest }) {
  return (
    <button
      type='button'
      className={cn(
        'h-[21px] w-[21px] border border-transparent p-0.5',
        'outline-2 outline-offset-2 outline-transparent outline-solid',
        'rounded-xs transition-all duration-150 ease-out',
        'active:outline-focus disabled:bg-neutral-700',
        Boolean(checked) && 'bg-primary-600 hover:bg-primary-700',
        Boolean(!checked) && 'border-neutral-600 hover:border-neutral-400',
        className,
      )}
      onClick={() => setChecked(!checked)}
      {...rest}
    >
      {Boolean(checked) && <CheckIcon className='h-4 w-4 stroke-white disabled:stroke-neutral-600' />}
    </button>
  )
}

export default CheckBox
