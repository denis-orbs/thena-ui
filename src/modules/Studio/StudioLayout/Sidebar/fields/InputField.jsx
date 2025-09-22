import React from 'react'
import { useTranslations } from 'use-intl'

import Input from '@/components/input'
import { TextHeading } from '@/components/typography'

function InputField({ label, value, onChange, typeInput }) {
  const t = useTranslations()
  return (
    <div className='flex flex-col gap-2'>
      <TextHeading>{t(label)}</TextHeading>
      <Input
        classNames={{ input: 'h-11 py-3 px-4' }}
        type={typeInput}
        val={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  )
}

export default InputField
