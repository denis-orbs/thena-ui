import { useTranslations } from 'next-intl'
import React, { useEffect } from 'react'

import { OutlinedButton } from '@/components/buttons/Button'
import { useMediaQuery } from '@/hooks/useMediaQuery'

function AddPairButtonField({ label, value, onChange, max }) {
  const t = useTranslations()

  const { isXlDown } = useMediaQuery()

  useEffect(() => {
    if (!isXlDown && value !== max) onChange(max)
  }, [max, isXlDown, onChange, value])

  if (value >= max || !isXlDown) return null

  return (
    <OutlinedButton className='w-full' onClick={() => onChange(value + 1)}>
      {t(label)}
    </OutlinedButton>
  )
}

export default AddPairButtonField
