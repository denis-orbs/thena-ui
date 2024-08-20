import { useTranslations } from 'next-intl'
import React, { useEffect, useState } from 'react'

import Box from '@/components/box'
import { PrimaryButton } from '@/components/buttons/Button'
import ConnectButton from '@/components/buttons/ConnectButton'
import Input from '@/components/input'
import LabelTooltip from '@/components/label/LabelTooltip'
import useWallet from '@/lib/wallets/useWallet'
import { ArrowForwardSmallIcon, SuccessIcon } from '@/svgs'

import { Countries as countries } from './Country'
import SelectCountry from './SelectCountry'

const initialFormState = {
  country: null,
  email: '',
  evmAddress: '',
}

export default function StoryRegister({ isRegistered }) {
  const [errors, setErrors] = useState({})
  const [isFormValid, setIsFormValid] = useState(false)
  const [isSubmit, setIsSubmit] = useState(false)
  const { account } = useWallet()
  const [countryName, setCountryName] = useState('')
  const t = useTranslations()
  const [formState, setFormState] = useState({
    ...initialFormState,
    evmAddress: account,
  })

  const validateForm = () => {
    const err = {}

    if (!formState.evmAddress) {
      err.evmAddress = 'Please enter your Wallet ID'
    } else if (account && account !== formState.evmAddress) {
      err.evmAddress = 'Your Wallet ID not connected'
    }

    if (!formState.email) {
      err.email = 'Please enter your email.'
    } else if (!/\S+@\S+\.\S+/.test(formState.email)) {
      err.email = 'Email is invalid.'
    }

    if (!formState.country) {
      err.country = 'Please select your country'
    }

    setErrors(err)
    setIsFormValid(Object.keys(err).length === 0)
  }

  const handleChange = name => event => {
    setFormState(prev => ({
      ...prev,
      [name]: event.target.value,
    }))
  }

  useEffect(() => {
    setFormState(prev => ({
      ...prev,
      evmAddress: account,
    }))
  }, [account])

  useEffect(() => {
    if (isSubmit) {
      validateForm()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formState, isSubmit])

  const handleSubmit = () => {
    setIsSubmit(true)
    console.log('formState', formState)
  }

  return (
    <div className='border-gradient-secondary rounded-xl p-px md:w-[610px]'>
      <Box className='z-10 h-full rounded-[11px] bg-neutral-900 px-8'>
        {isRegistered ? (
          <div className='flex flex-col justify-center'>
            <SuccessIcon className='mx-auto h-20 w-20' />
            <p className='mx-auto mb-10 max-w-[400px] text-center font-archia text-[30px] font-semibold'>
              {t('You Have Successfully Registered for THE Story of THENA Adventure')}
            </p>
            <PrimaryButton className='w-full'>
              {t('Go to dashboard')}
              <ArrowForwardSmallIcon className='inline-block h-5 w-5' />
            </PrimaryButton>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className='my-auto flex flex-col gap-6'>
              <h2 className='font-archia'>{t('Become a Thenian')}</h2>
              <div>
                <LabelTooltip className='mb-1.5' required label={t('Your Wallet ID')} id='email-input' />
                <Input
                  type='text'
                  placeholder={t('Connect your wallet')}
                  val={formState.evmAddress}
                  name='evmAddress'
                  onChange={handleChange('evmAddress')}
                  required
                />
                {errors.evmAddress && <p className='mb-1.5 text-red-500'>{errors.evmAddress}</p>}
              </div>
              <div>
                <div>
                  <LabelTooltip className='mb-1.5' required label='Select Country' />
                  <SelectCountry
                    className='w-full'
                    data={countries}
                    selected={countryName}
                    setSelected={ele => {
                      setFormState(prev => ({
                        ...prev,
                        country: ele.isoCode,
                      }))
                      setCountryName(`${ele.emoji} ${ele.name}`)
                    }}
                    placeHolder='Choose'
                  />
                  {errors.country && <p className='mb-1.5 text-red-500'>{errors.country}</p>}
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
                {errors.email && <p className='mb-1.5 text-red-500'>{errors.email}</p>}
              </div>
              {account ? (
                <PrimaryButton onClick={handleSubmit} disabled={!isFormValid} className='w-full'>
                  {t('Join now')}
                </PrimaryButton>
              ) : (
                <ConnectButton className='w-full' />
              )}
            </div>
          </form>
        )}
      </Box>
    </div>
  )
}
