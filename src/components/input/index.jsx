import { useTranslations } from 'next-intl'
import React from 'react'

import { cn } from '@/lib/utils'

function Input({
  className,
  classNames,
  val,
  LeadingIcon,
  suffix,
  prefix,
  TrailingIcon,
  TrailingButton,
  type = 'number',
  placeholder = '0',
  isLocale = true,
  ...rest
}) {
  const t = useTranslations()

  return (
    <div className={cn('relative flex items-center', className)}>
      <input
        type={type}
        lang='en'
        className={cn(
          'w-full rounded-lg border border-neutral-700 bg-neutral-700 py-3 text-neutral-50 placeholder-neutral-400 transition-all duration-150 ease-out focus:border-neutral-500',
          LeadingIcon ? 'pl-12' : prefix ? 'pl-7' : 'pl-4',
          TrailingIcon || suffix ? 'pr-7' : 'pr-3',
          TrailingIcon && TrailingButton ? 'pr-20' : '',
          classNames?.input,
        )}
        placeholder={isLocale && placeholder !== '' && placeholder !== '0' ? t(placeholder) : placeholder}
        value={val}
        {...rest}
      />
      {prefix && <span className='absolute bottom-0 left-3 top-0 my-auto h-fit text-neutral-400'>{prefix}</span>}
      {LeadingIcon && <div className='absolute bottom-0 left-4 top-0 my-auto h-5 w-5'>{LeadingIcon}</div>}
      {suffix && <span className='absolute bottom-0 right-3 top-0 my-auto h-fit text-neutral-400'>{suffix}</span>}
      {TrailingIcon && <div className='absolute bottom-0 right-3 top-0 my-auto h-5 w-5'>{TrailingIcon}</div>}
      {TrailingButton && (
        <div className={cn('absolute bottom-0 top-0 my-auto flex items-center', TrailingIcon ? 'right-12' : 'right-3')}>
          {TrailingButton}
        </div>
      )}
    </div>
  )
}

export default Input
