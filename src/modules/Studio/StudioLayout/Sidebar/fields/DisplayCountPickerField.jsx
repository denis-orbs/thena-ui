import React from 'react'
import { useTranslations } from 'use-intl'

import Dropdown from '@/components/dropdown'
import { TextHeading } from '@/components/typography'

function DisplayCountPickerField({ label, value, onChange }) {
  const t = useTranslations()
  const handleSelect = val => {
    onChange(val.value)
  }
  return (
    <div className='flex flex-col gap-2'>
      <TextHeading>{t(label)}</TextHeading>
      <Dropdown
        selected={value}
        setSelected={handleSelect}
        data={[
          { label: '1', value: '1' },
          { label: '2', value: '2' },
          { label: '3', value: '3' },
          { label: '4', value: '4' },
          { label: '5', value: '5' },
          { label: '6', value: '6' },
        ]}
        className='h-11 w-full'
        classNames={{ input: 'px-4' }}
      />
    </div>
  )
}

export default DisplayCountPickerField
