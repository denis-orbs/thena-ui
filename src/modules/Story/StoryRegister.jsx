import { gql } from 'graphql-request'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useCallback, useContext, useEffect, useState } from 'react'

import Box from '@/components/box'
import { PrimaryButton } from '@/components/buttons/Button'
import ConnectButton from '@/components/buttons/ConnectButton'
import Input from '@/components/input'
import LabelTooltip from '@/components/label/LabelTooltip'
import { THEStoryContext } from '@/context/THEStoryContext'
import { v4Client } from '@/lib/graphql'
import useWallet from '@/lib/wallets/useWallet'
import { ArrowForwardSmallIcon, SuccessIcon } from '@/svgs'

import { Countries as countries } from './Country'
import SelectCountry from './SelectCountry'

const initialFormState = {
  country: null,
  email: '',
  evmAddress: '',
  referralCode: '',
}

const V4_REGISTER_CAMPAIGN = gql`
  mutation V4_REGISTER_CAMPAIGN($evmAddress: String!, $email: String, $country: String, $referralCode: String = "") {
    registerCampaign(input: { evmAddress: $evmAddress, email: $email, country: $country, referralCode: $referralCode })
  }
`

export default function StoryRegister({ isRegistered }) {
  const { setIsRegistered } = useContext(THEStoryContext)
  const [errorsForm, setErrorsForm] = useState({})
  const [isFormValid, setIsFormValid] = useState(false)
  const [isSubmit, setIsSubmit] = useState(false)
  const { account } = useWallet()
  const [countryName, setCountryName] = useState('')
  const t = useTranslations()
  const searchParams = useSearchParams()
  const [formState, setFormState] = useState({
    ...initialFormState,
    evmAddress: account,
    referralCode: searchParams.get('ref'),
  })

  const registerFn = async ({ evmAddress, email, country, referralCode = '' }) => {
    const { registerCampaign, errors } = await v4Client.request(V4_REGISTER_CAMPAIGN, {
      evmAddress,
      email,
      country,
      referralCode,
    })

    if (errors) {
      throw errors
    }

    if (registerCampaign) {
      return registerCampaign
    }
    return false
  }

  const validateForm = useCallback(() => {
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

    if (isSubmit) {
      setErrorsForm(err)
    }
    setIsFormValid(Object.keys(err).length === 0)
  }, [account, formState.country, formState.email, formState.evmAddress, isSubmit])

  const handleChange = name => event => {
    validateForm()
    setFormState(prev => ({
      ...prev,
      [name]: event.target.value,
    }))
  }

  useEffect(() => {
    setFormState(prev => ({
      ...prev,
      evmAddress: account,
      referralCode: searchParams.get('ref'),
    }))
  }, [account, searchParams])

  useEffect(() => {
    validateForm()
  }, [formState, isSubmit, validateForm])

  const handleSubmit = async () => {
    setIsSubmit(true)
    if (validateForm()) return

    try {
      const res = await registerFn({
        ...formState,
        evmAddress: formState.evmAddress.toLowerCase(),
      })

      if (res) {
        setIsRegistered(true)
      } else {
        setIsRegistered(false)
      }
    } catch (e) {
      console.log(e)
    }
  }

  return (
    <div className='border-gradient-secondary rounded-xl p-px md:w-[610px]'>
      <Box className='z-10 h-full rounded-[11px] bg-neutral-900 px-8'>
        {isRegistered ? (
          <div className='flex flex-col justify-center'>
            <SuccessIcon className='mx-auto h-20 w-20' />
            <p className='mx-auto mb-10 max-w-[400px] text-center font-archia text-[26px] font-semibold md:text-[30px]'>
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
                {errorsForm.evmAddress && <p className='mb-1.5 text-red-500'>{errorsForm.evmAddress}</p>}
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
                  {setErrorsForm.country && <p className='mb-1.5 text-red-500'>{setErrorsForm.country}</p>}
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
                {setErrorsForm.email && <p className='mb-1.5 text-red-500'>{setErrorsForm.email}</p>}
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
