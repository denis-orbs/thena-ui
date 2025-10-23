'use client'

import { useTranslations } from 'next-intl'

import { TrailingButton } from '@/components/buttons/Button'
import { SOCIAL_LINKS } from '@/constant'

import { CommunityStars } from './CommunityStars'
import { MainCommunityIllustration } from './MainCommunityIllustration'

function Community() {
  const t = useTranslations()

  return (
    <div className='relative mx-auto flex max-h-[1152px] flex-col items-center justify-center overflow-hidden px-10 py-[80px] md:py-[138px]'>
      <CommunityStars className='absolute inset-0 top-0 left-1/2 h-[179px] -translate-x-[46%] md:-top-4 md:h-[279px] md:-translate-x-1/2' />
      <MainCommunityIllustration />
      <div className='flex flex-col items-center justify-center'>
        <div className='font-archia text-center text-[32px] leading-[40px] font-semibold tracking-[-0.96px] lg:text-5xl lg:leading-[56px] lg:tracking-[-1.44px]'>
          {t('Join THE Community')}
        </div>
        <TrailingButton
          className='mt-4'
          onClick={() => {
            window.open(SOCIAL_LINKS.Discord.url, '_blank')
          }}
        >
          {t('Join Discord')}
        </TrailingButton>
      </div>
    </div>
  )
}

export default Community
