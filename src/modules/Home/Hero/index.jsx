'use client'

import { useRouter } from 'next/navigation'
import React from 'react'

import { TrailingButton } from '@/components/buttons/Button'

import { MainHero } from './MainHero'
import HomeImage from '../Common/HomeImage'

function Hero() {
  const { push } = useRouter()
  return (
    <>
      <div className='absolute w-full lg:-mt-[92px]'>
        <HomeImage
          alt='background mask'
          src='/images/home/hero/mask.png'
          className='absolute top-10 z-0 hidden w-full lg:block'
        />
        <HomeImage
          alt='blob background'
          src='/images/home/hero/blob.png'
          className='absolute -top-16 z-[25] hidden h-[944px] w-full opacity-70 lg:block'
        />
        <HomeImage
          alt='pillars'
          src='/images/home/hero/pillars.png'
          className='absolute top-[92px] hidden w-full lg:block'
        />
        {/* mobile backgrounds */}
        <HomeImage
          src='/images/home/hero/blob-mobile.png'
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
          className='z-30 flex cursor-pointer items-center space-x-3'
          onClick={() => {
            window.open('https://blog.openzeppelin.com/retro-thena-audit', '_blank')
          }}
        >
          <span className='text-sm leading-5 tracking-[-0.42px] text-white/[65%]'>Audited by</span>
          <HomeImage alt='zepplin logo' src='/images/home/hero/z.svg' />
        </div>
        <h1 className='mt-[26px] w-full text-center font-archia text-4xl font-semibold leading-10 tracking-[-1.08px] lg:text-7xl lg:leading-[88px] lg:tracking-[-2.16px]'>
          THE ULTIMATE
          <br />
          Decentralized Exchange
          {/* <RotatingHeading />
          <br />
          with THENA Finance */}
        </h1>
        <TrailingButton className='z-30 mt-8 lg:mt-10' onClick={() => push('/swap')}>
          Trade Now
        </TrailingButton>
        <MainHero />
      </div>
    </>
  )
}

export default Hero
