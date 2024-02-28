'use client'

import { TrailingButton } from '@/components/buttons/Button'

import { CommunityStars } from './CommunityStars'
import { MainCommunityIllustration } from './MainCommunityIllustration'

function Community() {
  return (
    <div className='relative mx-auto flex max-h-[1152px] flex-col items-center justify-center overflow-hidden px-10 py-[80px] md:py-[138px]'>
      <CommunityStars className='absolute inset-0 left-1/2 top-0 h-[179px] -translate-x-[46%] md:-top-4 md:h-[279px] md:-translate-x-1/2' />
      <MainCommunityIllustration />
      <div className='flex flex-col items-center justify-center'>
        <div className='font-archia text-[32px] font-semibold leading-[40px] tracking-[-0.96px] lg:text-5xl lg:leading-[56px] lg:tracking-[-1.44px]'>
          Join THE Community
        </div>
        <TrailingButton
          className='mt-4'
          onClick={() => {
            window.open('https://discord.gg/thena', '_blank')
          }}
        >
          Join Discord
        </TrailingButton>
      </div>
    </div>
  )
}

export default Community
