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
          {t('Our Trade2Earn Program Has Ended!')}
        </TextHeading>
        <TextSubHeading className='text-base leading-[22px] text-neutral-300 md:text-[17px]'>
          {t('Trade to earn description')}
        </TextSubHeading>
        <div className='flex flex-col items-center justify-center gap-4 md:flex-row [&>*]:w-48'>
          <TrailingButton onClick={() => push('https://alpha.thena.fi/trade/BTCUSDT')}>
            {t('Trade on ALPHA')}
          </TrailingButton>

          <TrailingButton onClick={() => push('https://thena.fi/arena')}>{t('Go to ARENA')}</TrailingButton>
        </div>
      </div>
    </div>
  )
}

export default TopBar
