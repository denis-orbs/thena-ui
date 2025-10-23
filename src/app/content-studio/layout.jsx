'use client'

import { useTranslations } from 'next-intl'

import { TextHeading } from '@/components/typography'

export default function ContentStudioLayout({ children }) {
  const t = useTranslations()

  return (
    <div className='layout mx-auto flex w-full max-w-[1440px] flex-col gap-3 lg:px-12 lg:pt-8'>
      <TextHeading className='font-archia text-5xl font-semibold text-neutral-50'>{t('Content Studio')}</TextHeading>
      <div className='relative gap-8 overflow-y-auto rounded-xl bg-neutral-900 p-4'>{children}</div>
    </div>
  )
}
