'use client'

import { useTranslations } from 'next-intl'
import { Suspense } from 'react'

import LayoutWithBackButton from '@/components/common/LayoutWithBackButton'
import { TextHeading } from '@/components/typography'

import Loading from '../loading'

export default function ContentStudioLayout({ children }) {
  const t = useTranslations()

  return (
    <main className='flex min-h-screen flex-col bg-neutral-950'>
      <Suspense fallback={<Loading />}>
        <LayoutWithBackButton
          hiddenBackButton
          className='3xl:w-[1464px] 3xl:pt-8! pt-6! xl:mx-12 2xl:mx-auto 2xl:w-[1344px]'
        >
          <TextHeading className='font-archia text-2xl font-semibold text-neutral-50 xl:text-5xl'>
            {t('Content Studio')}
          </TextHeading>
          <div className='relative mt-3 gap-8 overflow-y-auto rounded-xl xl:bg-neutral-900 xl:p-4'>{children}</div>
        </LayoutWithBackButton>
      </Suspense>
    </main>
  )
}
