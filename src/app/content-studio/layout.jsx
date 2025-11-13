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
          className='3xl:pt-10! mt-6! max-w-[1344px]! xl:mx-12 xl:-mt-2! 2xl:mx-auto'
        >
          <TextHeading className='font-archia 3xl:text-[48px] 3xl:leading-[48px] text-2xl font-semibold text-neutral-50 xl:text-4xl xl:leading-10 2xl:text-[40px] 2xl:leading-[48px]'>
            {t('Content Studio')}
          </TextHeading>
          <div className='relative mt-3 gap-8 overflow-visible rounded-xl xl:mt-8 xl:bg-neutral-900 xl:p-4'>
            {children}
          </div>
        </LayoutWithBackButton>
      </Suspense>
    </main>
  )
}
