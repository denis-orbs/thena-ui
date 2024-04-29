import React from 'react'

import HomeImage from '@/modules/Home/Common/HomeImage'

export default function Hero() {
  return (
    <>
      <div className='absolute w-full lg:-mt-[92px]'>
        {/* <HomeImage
          alt='background mask'
          src='/images/home/hero/mask.png'
          className='absolute top-10 z-0 hidden w-full lg:block'
        /> */}
        <HomeImage
          alt='blob background'
          src='/images/home/hero/blob.png'
          className='absolute -top-12 z-[25] w-full opacity-70 lg:-top-64'
        />
        <HomeImage
          alt='pillars'
          src='/images/home/hero/pillars-left.png'
          className='absolute left-0 top-[92px] z-[25] w-1/2 lg:w-1/3'
        />
        <HomeImage
          alt='pillars'
          src='/images/home/hero/pillars-right.png'
          className='absolute right-0  top-[92px] z-[25] w-1/2 lg:w-1/3 '
        />
        {/* mobile backgrounds */}
        {/* <HomeImage
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
        /> */}
      </div>
    </>
  )
}
