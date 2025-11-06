import { useTranslations } from 'next-intl'
import { useRouter } from 'nextjs-toploader/app'
import React from 'react'

import ArrowLeftIcon from '@/icons/ArrowLeftIcon'
import { cn } from '@/lib/utils'

import { TextButton } from './Button'

function BackButton({ href, className }) {
  const t = useTranslations()
  const router = useRouter()

  return (
    <TextButton
      className={cn('w-fit', className)}
      onClick={() => (href ? router.push(href) : router.back())}
      LeadingIcon={ArrowLeftIcon}
    >
      {t('Back')}
    </TextButton>
  )
}

export default BackButton
