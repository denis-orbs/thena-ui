'use client'

import { useTranslations } from 'next-intl'

import { TextHeading } from '@/components/typography'
import { cn } from '@/lib/utils'

export default function ContentStudioLayout({ children }) {
  const t = useTranslations()

  return (
    <div
      className={cn(
        'layout 3xl:mx-auto 3xl:w-[1440px] mx-4 mb-12 flex flex-col gap-3 md:mx-8 md:mb-12 xl:mx-12 xl:pt-8 2xl:mx-16 2xl:mb-[180px]',
      )}
    >
      <TextHeading className='font-archia text-2xl font-semibold text-neutral-50 xl:text-5xl'>
        {t('Content Studio')}
      </TextHeading>
      <div className='relative gap-8 overflow-y-auto rounded-xl xl:bg-neutral-900 xl:p-4'>{children}</div>
    </div>
  )
}
