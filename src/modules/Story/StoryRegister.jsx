import { useTranslations } from 'next-intl'
import React, { useState } from 'react'

import Box from '@/components/box'
import { PrimaryButton } from '@/components/buttons/Button'
import Dropdown from '@/components/dropdown'
import Input from '@/components/input'
import LabelTooltip from '@/components/label/LabelTooltip'
import { SuccessIcon } from '@/svgs'

import ChevronRightIcon from './ChevronRightIcon'

const initialFormState = {
  evmAddress: '',
  country: null,
  email: '',
}

const countries = {
  US: 'United States',
  CA: 'Canada',
  FR: 'France',
  DE: 'Germany',
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
    <div className='border-gradient-secondary h-[360px] rounded-xl p-px md:w-[610px]'>
      <Box className='h-full rounded-[11px] bg-neutral-900 px-8'>
        {isRegistered ? (
          // TODO: Add element here
          <div className='flex flex-col justify-center'>
            <SuccessIcon className='mx-auto h-20 w-20' />
            <p className='mx-auto mb-10 max-w-[400px] text-center text-[30px] font-semibold'>
              {t('You Have Successfully Registered for THE Story of THENA Adventure')}
            </p>
            <PrimaryButton className='w-full'>
              {t('Go to dashboard')}
              <ChevronRightIcon />
            </PrimaryButton>
          </div>
        ) : (
          <div className='my-auto flex flex-col gap-6'>
            <h2>{t('Become a Thenian')}</h2>
            <div>
              <div>
                <LabelTooltip className='mb-1.5' required label='Select Country' />
                {/* TODO: Common Select component */}
                <Dropdown
                  className='w-full'
                  data={Object.keys(countries).map(item => ({
                    label: item,
                  }))}
                  selected={formState.country}
                  setSelected={ele => {
                    setFormState(prev => ({
                      ...prev,
                      country: ele.label,
                    }))
                  }}
                  z
                  onChange
                  placeHolder='Choose'
                />
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
