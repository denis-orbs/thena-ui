import { useTranslations } from 'next-intl'
import React from 'react'

import cn from '@/utils/classes'

function Textarea({ className = '', val, placeholder = '0', isLocale = true, ...rest }) {
  const t = useTranslations()

  return (
    <textarea
      lang='en'
      className={cn(
        'w-full rounded-lg border border-neutral-700 bg-neutral-700 py-3 text-neutral-50 placeholder-neutral-400 transition-all duration-150 ease-out focus:border-neutral-500',
        className,
      )}
      placeholder={isLocale && placeholder !== '0' ? t(placeholder) : placeholder}
      value={val}
      {...rest}
    />
  )
}

export default Textarea
