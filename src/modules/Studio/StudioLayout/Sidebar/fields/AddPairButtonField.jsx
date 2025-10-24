import { useTranslations } from 'next-intl'
import React, { useEffect } from 'react'

import { EmphasisButton } from '@/components/buttons/Button'
import { useMediaQuery } from '@/hooks/useMediaQuery'

function AddPairButtonField({ label, value, onChange, max }) {
  const t = useTranslations()

  const { isLgDown } = useMediaQuery()

  useEffect(() => {
    if (!isLgDown && value !== max) onChange(max)
  }, [max, isLgDown, onChange, value])

  if (value >= max || !isLgDown) return null

  return (
    <div>
      <EmphasisButton onClick={() => onChange(value + 1)}>{t(label)}</EmphasisButton>
    </div>
  )
}

export default AddPairButtonField
