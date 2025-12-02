'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from 'nextjs-toploader/app'
import React from 'react'

import { TrailingButton } from '@/components/buttons/Button'

import { MainHero } from './MainHero'
import HomeImage from '../Common/HomeImage'

function Hero() {
  const { push } = useRouter()
  const t = useTranslations()

  return (
    <>
      <div className='absolute w-full lg:-mt-[92px]'>
        <HomeImage
          alt='background mask'
          src='/images/home/hero/mask.webp'
          className='absolute top-10 z-0 hidden w-full lg:block'
        />
        <HomeImage
          alt='blob background'
          src='/images/home/hero/blob.webp'
          className='absolute -top-16 z-25 hidden h-[944px] w-full opacity-70 lg:block'
        />
        <HomeImage
          alt='pillars'
          src='/images/home/hero/pillars.webp'
          className='absolute top-[92px] hidden w-full lg:block'
        />
        {/* mobile backgrounds */}
        <HomeImage
          src='/images/home/hero/blob-mobile.webp'
          alt='thean blob mobile'
          height={687}
          width={393}
          className='absolute top-20 w-full lg:hidden'
        />

        <HomeImage
          alt='pillers'
          src='/images/home/hero/mobilebg.png'
          className='absolute top-0 z-10 w-full lg:hidden'
        />
      </div>
      <div className='relative mx-auto flex max-w-[1152px] flex-col items-center justify-center px-[31px] pt-[51px] xl:px-0'>
        <div
          className='z-30 flex cursor-pointer items-center gap-3'
          onClick={() => {
            window.open('https://x.com/BinanceLabs/article/1873984088559747124', '_blank')
          }}
        >
          <span className='text-sm leading-5 tracking-[-0.42px] text-white/65'>{t('Backed by')}</span>
          <HomeImage alt='binancelabs logo' src='/images/yzilabs.png' />
          {/* Hidden on EN, only show on ZH */}
          <span className='text-sm leading-5 tracking-[-0.42px] text-white/65'>{t('Audit')}</span>
        </div>
        <h1 className='font-archia z-30 mt-[26px] w-full text-center text-4xl leading-10 font-semibold tracking-[-1.08px] lg:text-7xl lg:leading-[88px] lg:tracking-[-2.16px]'>
          {t('THE ULTIMATE')}
          <br />
          {t('Decentralized Exchange')}
        </h1>
        <div className='z-30 mt-8 flex gap-4 lg:mt-10'>
          <TrailingButton onClick={() => push('/swap')}>{t('Spot Trade')}</TrailingButton>
          <TrailingButton onClick={() => window.open('https://perps.thena.fi', '_blank')}>
            {t('Perps Trade')}
          </TrailingButton>
        </div>
        <MainHero />
      </div>
    </>
  )
}

export default Hero
