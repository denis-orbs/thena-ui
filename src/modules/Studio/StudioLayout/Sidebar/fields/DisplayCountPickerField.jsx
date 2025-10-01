import React from 'react'
import { useTranslations } from 'use-intl'

import Dropdown from '@/components/dropdown'
import { TextHeading } from '@/components/typography'

function DisplayCountPickerField({ label, value, onChange, options = [] }) {
  const t = useTranslations()
  const handleSelect = val => {
    onChange(val.value)
  }
  return (
    <div className='flex flex-col gap-2'>
      <TextHeading>{t(label)}</TextHeading>
      <Dropdown
        selected={options.find(opt => opt.value === value)?.label}
        setSelected={handleSelect}
        data={options}
        className='h-11 w-full'
        classNames={{ input: 'px-4' }}
        isLocale={false}
      />
    </div>
  )
}

export default DisplayCountPickerField
