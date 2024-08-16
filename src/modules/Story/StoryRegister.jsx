import { useTranslations } from 'next-intl'
import React, { useState } from 'react'

import Box from '@/components/box'
import { PrimaryButton } from '@/components/buttons/Button'
import Input from '@/components/input'
import LabelTooltip from '@/components/label/LabelTooltip'

const initialFormState = {
  evmAddress: '',
  country: null,
  email: '',
}

export default function StoryRegister({ isRegistered }) {
  const t = useTranslations()
  const [formState, setFormState] = useState(initialFormState)

  const handleChange = name => event => {
    setFormState(prev => ({
      ...prev,
      [name]: event.target.value,
    }))
  }

  return (
    <div className='border-story-gradient h-[360px] rounded-xl p-px md:w-[610px]'>
      <Box className='h-full rounded-[11px] bg-neutral-900 px-8'>
        {isRegistered ? (
          // TODO: Add element here
          <div className='flex flex-col'>
            <p>Test text</p>
            <PrimaryButton className='w-full'>{t('Join now')}</PrimaryButton>
          </div>
        ) : (
          <div className='my-auto flex flex-col gap-6'>
            <h2>{t('Register Now')}</h2>
            <div>
              <div>
                <LabelTooltip className='mb-1.5' required label='Select Country' />
                {/* TODO: Common Select component */}
                <select
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
            <div>
              <LabelTooltip
                className='mb-1.5'
                required
                label='Your Email'
                tooltip='Email Label Tooltip'
                showInfoIcon
                id='email-input'
              />
              <Input
                type='email'
                placeholder={t('Email Address')}
                val={formState.email}
                onChange={handleChange('email')}
                required
              />
            </div>
            <PrimaryButton className='w-full'>{t('Join now')}</PrimaryButton>
          </div>
        )}
      </Box>
    </div>
  )
}
