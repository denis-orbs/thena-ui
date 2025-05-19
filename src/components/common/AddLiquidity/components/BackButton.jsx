import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React from 'react'

import { EmphasisButton } from '@/components/buttons/Button'
import { cn } from '@/lib/utils'

function BackButton({ url, className }) {
  const t = useTranslations()
  const { back, push } = useRouter()
  return (
    <EmphasisButton className={cn(className)} onClick={() => (url ? push(url) : back())}>
      {t('back')}
    </EmphasisButton>
  )
}

export default BackButton
