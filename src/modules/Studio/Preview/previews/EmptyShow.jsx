import { useTranslations } from 'next-intl'
import React from 'react'

import { TextHeading, TextSubHeading } from '@/components/typography'

function EmptyShow({ title = 'Select Pair', subTitle = 'Select pairs from the dropdown to see the results' }) {
  const t = useTranslations()
  return (
    <div className='mt-[47px] mb-[46px] flex h-[388px] w-[464px] items-center justify-center bg-[url("/images/content-studio/empty_pair.png")]'>
      <div className='flex flex-col gap-3'>
        <TextHeading className='font-archia text-center text-3xl font-semibold'>{t(title)}</TextHeading>
        <TextSubHeading className='text-neutral-300'>{t(subTitle)}</TextSubHeading>
      </div>
    </div>
  )
}

export default EmptyShow
