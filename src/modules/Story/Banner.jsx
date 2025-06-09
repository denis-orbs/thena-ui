import { useTranslations } from 'next-intl'
import React from 'react'

import { OutlinedButton } from '@/components/buttons/Button'
import { ArrowsDownIcon, SoundOffIcon, SoundOnIcon } from '@/svgs'

import VideoBanner from './Video'

export default function Banner({ videoRef, isMuted, settingSound, handleScroll }) {
  const t = useTranslations()
  return (
    <div className='h-auto w-auto rounded-[20px] bg-[#382F411F] px-2 pt-2 md:px-[15px] md:pt-[15px]'>
      <div className='relative mb-10 lg:mb-15'>
        <VideoBanner
          src='/videos/TheSpaceFinal.mp4'
          width={1410}
          height={793}
          className='w-full rounded-[10px]'
          videoRef={videoRef}
          muted={isMuted}
        />
        <OutlinedButton className='absolute top-5 right-4 border-none p-2' onClick={settingSound}>
          {isMuted ? <SoundOffIcon className='h-8 w-6' /> : <SoundOnIcon className='h-8 w-6' />}
        </OutlinedButton>
        <div className='font-archia absolute bottom-0 left-0 w-full p-0 text-center text-[28px] font-semibold text-white md:bottom-3 md:text-[40px] lg:bottom-6 lg:px-4 lg:pb-9 lg:text-[72px]'>
          <p>{t('Get Ready for THE Story of THENA')}</p>
          <div className='mt-3 flex w-full justify-center'>
            <OutlinedButton className='hidden border-none lg:block' onClick={handleScroll}>
              <ArrowsDownIcon className='h-8 w-6' />
            </OutlinedButton>
          </div>
        </div>
      </div>
    </div>
  )
}
