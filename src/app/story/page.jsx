'use client'

import React from 'react'

import StoryRegister from '@/modules/Story/StoryRegister'

function StoryPage() {
  return (
    <div className='mt-6 flex flex-col gap-4'>
      <div className='w-full'>
        <div className='mt-6 grid grid-cols-12 gap-8 lg:gap-12'>
          <div className='col-span-12 my-auto px-20 lg:col-span-7'>
            <small className='uppercase text-purple-600'>The story of Thena</small>
            <p className='mb-3 text-4xl font-black text-gray-900 dark:text-white'>
              Join the Adventure and Earn Rewards!
            </p>
            <small className='text-gray-300'>
              Brief Campaign Description Brief Campaign DescriptionBrief Campaign Description
            </small>
            <small className='text-gray-300'>DescriptionBrief Campaign Description</small>
          </div>
          <StoryRegister />
        </div>
      </div>
    </div>
  )
}

export default StoryPage
