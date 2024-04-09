import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React from 'react'

import { TrailingButton } from '@/components/buttons/Button'
import { TextHeading, TextSubHeading } from '@/components/typography'

function TopBar() {
  const t = useTranslations()
  const { push } = useRouter()

  return (
    <div className='mb-8 flex items-center justify-center py-5'>
      <div className='flex flex-col gap-5 text-center'>
        <TextHeading className='text-3xl font-semibold leading-9 md:text-5xl'>
          {t('Trade on ALPHA and Earn Rewards')} <br />
        </TextHeading>
        <TextSubHeading className='text-base leading-[22px] md:text-[17px]'>
          {t('Trade to earn description part 1')}
          <br />
          {t('Trade to earn description part 2')}
        </TextSubHeading>
        <div className='flex justify-center'>
          <TrailingButton onClick={() => push('/swap')}>{t('Trade Now')}</TrailingButton>
        </div>
      </div>
    </div>
  )
}

export default TopBar
