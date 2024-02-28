import React from 'react'

import { cn } from '@/lib/utils'

function Input({
  className,
  classNames,
  val,
  LeadingIcon,
  suffix,
  TrailingIcon,
  TrailingButton,
  type = 'number',
  ...rest
}) {
  return (
    <div className={cn('relative flex items-center', className)}>
      <input
        type={type}
        lang='en'
        className={cn(
          'w-full rounded-lg border border-neutral-700 bg-neutral-700 py-3 text-neutral-50 placeholder-neutral-400 transition-all duration-150 ease-out focus:border-neutral-500',
          LeadingIcon ? 'pl-12' : 'pl-4',
          TrailingIcon || suffix ? 'pr-7' : 'pr-3',
          classNames?.input,
        )}
        placeholder='0'
        value={val}
        {...rest}
      />
      {LeadingIcon && <div className='absolute bottom-0 left-4 top-0 my-auto h-5 w-5'>{LeadingIcon}</div>}
      {suffix && <span className='absolute bottom-0 right-3 top-0 my-auto h-fit text-neutral-400'>{suffix}</span>}
      {TrailingIcon && <div className='absolute bottom-0 right-3 top-0 my-auto h-5 w-5'>{TrailingIcon}</div>}
      {TrailingButton && (
        <div className='absolute bottom-0 right-3 top-0 my-auto flex items-center'>{TrailingButton}</div>
      )}
    </div>
  )
}

export default Input
