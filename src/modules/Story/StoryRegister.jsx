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
    <div className='col-span-12 my-auto h-[463px] w-[610px] rounded-xl bg-gradient-to-b from-start-gradient to-end-gradient p-[1px] lg:col-span-6'>
      <Box className='relative z-10 col-span-12 my-auto rounded-xl bg-[#1A121E] px-[30px] lg:sticky lg:top-56 lg:col-span-6'>
        <h2 className='mb-6'>{t('Register Now')}</h2>
        <form onSubmit={handleSubmit}>
          <div className='mb-6'>
            <label htmlFor='evmAddress' className='mb-[5.93px] block text-base font-medium text-neutral-50'>
              {t('Your EVM Address')}
            </label>
            <Input
              className='h-11 w-full'
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
              <label htmlFor='countries' className='mb-[5.93px] block text-base font-medium text-neutral-50'>
                {t('Select Country')}
              </label>
              <select
                id='countries'
                name='country'
                className='h-11 w-full cursor-pointer rounded-lg border border-neutral-700 bg-neutral-700 py-3 text-neutral-50 placeholder-neutral-400 caret-transparent focus:border-neutral-500'
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
            <label htmlFor='emailAddress' className='mb-[5.93px] block text-base font-medium text-neutral-50'>
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
          <SecondaryButton type='submit' className='w-full bg-[#DF08D4] text-white'>
            {t('Join now')}
          </SecondaryButton>
        </form>
      </Box>
    </div>
  )
}
