import { useCallback, useState } from 'react'
import { useTranslations } from 'use-intl'

import { successToast } from '@/lib/notify'

export const useCopyText = () => {
  const t = useTranslations()
  const [copied, setCopied] = useState()
  const onCopy = useCallback(
    (e, text, type) => {
      e.stopPropagation()
      e.preventDefault()
      navigator.clipboard.writeText(text)
      successToast(t('Copied'))
      setCopied(type)
      setTimeout(() => {
        setCopied()
      }, 3000)
    },
    [t],
  )
  return { onCopy, copied }
}
