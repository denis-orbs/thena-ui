import React from 'react'

import Box from '@/components/box'
import { SecondaryButton } from '@/components/buttons/Button'

export default function StoryRegister() {
  return (
    <Box className='z-10 col-span-12 lg:sticky lg:top-56 lg:col-span-5 lg:max-h-[500px]'>
      <h2 className='mb-6'>Register Now</h2>
      <div className='mb-6'>
        <label htmlFor='evmAddress' className='mb-1 block text-sm font-medium text-gray-900 dark:text-white'>
          Your EVM Address
        </label>
        <input
          type='text'
          id='evmAddress'
          className='w-full cursor-text rounded-lg border border-neutral-700 bg-neutral-700 py-3 text-neutral-50 placeholder-neutral-400 caret-transparent focus:border-neutral-500'
          placeholder='EVM Address'
          required
        />
      </div>
      <div className='mb-6'>
        <div>
          <label htmlFor='countries' className='mb-1 block text-sm font-medium text-gray-900 dark:text-white'>
            Select Country
          </label>
          <select
            id='countries'
            className='w-full cursor-pointer rounded-lg border border-neutral-700 bg-neutral-700 py-3 text-neutral-50 placeholder-neutral-400 caret-transparent focus:border-neutral-500'
          >
            <option selected>Choose</option>
            <option value='US'>United States</option>
            <option value='CA'>Canada</option>
            <option value='FR'>France</option>
            <option value='DE'>Germany</option>
          </select>
        </div>
      </div>
      <div className='mb-6'>
        <label htmlFor='emailAddress' className='mb-1 block text-sm font-medium text-gray-900 dark:text-white'>
          Email Address
        </label>
        <input
          name='email'
          type='email'
          id='emailAddress'
          className='w-full cursor-text rounded-lg border border-neutral-700 bg-neutral-700 py-3 text-neutral-50 placeholder-neutral-400 caret-transparent focus:border-neutral-500'
          placeholder='Email Address'
          required
        />
      </div>
      <SecondaryButton className='w-full'>Join now</SecondaryButton>
    </Box>
  )
}
