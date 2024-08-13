import { useTranslations } from 'next-intl'
import React, { useState } from 'react'

import Box from '@/components/box'
import { SecondaryButton } from '@/components/buttons/Button'
import Input from '@/components/input'

const initialFormState = {
  evmAddress: '',
  country: null,
  email: '',
}

export default function StoryRegister() {
  const t = useTranslations()
  const [formState, setFormState] = useState(initialFormState)

  const handleChange = name => event => {
    setFormState(prev => ({
      ...prev,
      [name]: event.target.value,
    }))
  }

  const handleSubmit = event => {
    event.preventDefault()
    console.log(formState)
  }
  return (
    <Box className='z-10 col-span-12 my-auto lg:sticky lg:top-56 lg:col-span-5 lg:max-h-[500px]'>
      <h2 className='mb-6'>{t('Register Now')}</h2>
      <form onSubmit={handleSubmit}>
        <div className='mb-6'>
          <label htmlFor='evmAddress' className='mb-1 block text-sm font-medium text-gray-900 dark:text-white'>
            {t('Your EVM Address')}
          </label>
          <Input
            type='text'
            id='evmAddress'
            placeholder={t('EVM Address')}
            val={formState.evmAddress}
            onChange={handleChange('evmAddress')}
            required
          />
        </div>
        <div className='mb-6'>
          <div>
            <label htmlFor='countries' className='mb-1 block text-sm font-medium text-gray-900 dark:text-white'>
              {t('Select Country')}
            </label>
            <select
              id='countries'
              name='country'
              className='w-full cursor-pointer rounded-lg border border-neutral-700 bg-neutral-700 py-3 text-neutral-50 placeholder-neutral-400 caret-transparent focus:border-neutral-500'
              value={formState.country}
              onChange={handleChange('country')}
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
            {t('Your Email')}
          </label>
          <Input
            type='email'
            id='emailAddress'
            name='email'
            placeholder={t('Email Address')}
            val={formState.email}
            onChange={handleChange('email')}
            required
          />
        </div>
        <SecondaryButton type='submit' className='w-full text-white'>
          {t('Join now')}
        </SecondaryButton>
      </form>
    </Box>
  )
}
