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

  const handleClick = () => {
    const newValue = value + 1
    onChange(newValue)
    // On mobile, after adding a pair, click the latest pair picker dropdown
    if (isXlDown) {
      setTimeout(() => {
        // The latest pair index is always newValue - 1 (0-indexed)
        const latestIndex = newValue - 1
        const latestElement = document.querySelector(`[data-pair-index="${latestIndex}"]`)
        // Click the latest pair picker dropdown
        if (latestElement) {
          latestElement.click()
        }
      }, 200) // Small delay to ensure DOM is updated
    }
  }

  return (
    <OutlinedButton className='w-full' onClick={handleClick}>
      {t(label)}
    </OutlinedButton>
  )
}

export default AddPairButtonField
