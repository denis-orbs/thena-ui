import { useTranslations } from 'next-intl'
import React from 'react'

import { TextHeading, TextSubHeading } from '@/components/typography'

function EmptyPair() {
  const t = useTranslations()
  return (
    <div className='mt-[94px] flex h-[388px] w-[464px] items-center justify-center bg-[url("/images/content-studio/empty_pair.png")]'>
      <div className='flex flex-col gap-3'>
        <TextHeading className='font-archia text-center text-3xl font-semibold'>Select Pair</TextHeading>
        <TextSubHeading className='text-neutral-300'>
          {t('Select pairs from the dropdown to see the results')}
        </TextSubHeading>
      </div>
    </div>
  )
}

export default EmptyPair
