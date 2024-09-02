import Link from 'next/link'
import { useTranslations } from 'next-intl'
import React from 'react'

import { PrimaryButton } from '@/components/buttons/Button'
import Spinner from '@/components/spinner'
import { TextHeading, TextSubHeading } from '@/components/typography'

export function TCNotReadyYet() {
  const t = useTranslations()

  return (
    <div className='flex h-[calc(100vh-280px)] w-full flex-col items-center justify-center lg:h-[calc(100vh-280px)]'>
      <div className='mb-3 flex flex-col items-center justify-center gap-2'>
        <Spinner className='size-8' />
        <TextHeading className='text-2xl font-bold lg:text-3xl'>{t('Competition Is Not Ready Yet')}</TextHeading>
        <TextSubHeading className='text-xl lg:text-2xl'>{t('Competition Is Not Ready Yet SubText')}</TextSubHeading>
      </div>
      <Link href='/arena'>
        <PrimaryButton>{t('Back')}</PrimaryButton>
      </Link>
    </div>
  )
}
