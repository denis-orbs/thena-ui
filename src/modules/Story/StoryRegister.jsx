import { gql } from 'graphql-request'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useCallback, useContext, useEffect, useState } from 'react'

import Box from '@/components/box'
import { PrimaryButton } from '@/components/buttons/Button'
import ConnectButton from '@/components/buttons/ConnectButton'
import Input from '@/components/input'
import LabelTooltip from '@/components/label/LabelTooltip'
import { THEStoryContext } from '@/context/THEStoryContext'
import { v4Client } from '@/lib/graphql'
import { errorToast, successToast } from '@/lib/notify'
import { cn } from '@/lib/utils'
import useWallet from '@/lib/wallets/useWallet'
import { ChevronRightIcon, SuccessIcon } from '@/svgs'

import SelectCountry from './SelectCountry'

const initialFormState = {
  country: '',
  email: '',
  evmAddress: '',
  referralCode: '',
}

const V4_REGISTER_CAMPAIGN = gql`
  mutation V4_REGISTER_CAMPAIGN($evmAddress: String!, $email: String!, $country: String!, $referralCode: String = "") {
    registerCampaign(input: { evmAddress: $evmAddress, email: $email, country: $country, referralCode: $referralCode })
  }
`

export default function StoryRegister({ isRegistered, isUpcoming }) {
  const { setIsRegistered } = useContext(THEStoryContext)
  const { account } = useWallet()
  const t = useTranslations()
  const searchParams = useSearchParams()
  const router = useRouter()

  const [formState, setFormState] = useState({
    ...initialFormState,
    evmAddress: account || '',
    referralCode: searchParams.get('ref') || '',
  })

  const registerFn = async ({ evmAddress, email, country, referralCode = '' }) => {
    try {
      const { registerCampaign } = await v4Client.request(V4_REGISTER_CAMPAIGN, {
        evmAddress,
        email,
        country,
        referralCode,
      })

      if (registerCampaign) {
        successToast('Successfully')
        return registerCampaign
      }

      errorToast('Error')
      return false
    } catch (e) {
      if (e?.response && e?.response?.errors && e?.response?.errors.length > 0) {
        const error = e?.response?.errors[0]
        if (
          error?.extensions?.exception?.validationErrors &&
          error?.extensions?.exception?.validationErrors.length > 0
        ) {
          const validator = error?.extensions?.exception?.validationErrors[0]
          errorToast(validator?.constraints?.isEmail)
        } else if (error?.extensions?.exception?.detail) {
          errorToast(error?.extensions?.exception?.detail)
        } else {
          errorToast(error?.message)
        }
      }
      return false
    }
  }

  const validateForm = useCallback(() => {
    if (formState.country && formState.email && formState.evmAddress) return true
    return false
  }, [formState.country, formState.email, formState.evmAddress])

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
      evmAddress: account || '',
      referralCode: searchParams.get('ref') || '',
    }))
  }, [account, searchParams])

  const handleSubmit = async e => {
    e.preventDefault()
    if (account && account !== formState.evmAddress) {
      errorToast('Your Wallet ID is not connected')
      return
    }

    const res = await registerFn({
      ...formState,
      evmAddress: formState.evmAddress.toLowerCase(),
    })

    if (res) {
      setFormState({
        ...initialFormState,
        evmAddress: account,
        referralCode: searchParams.get('ref'),
      })
    }

    setIsRegistered(res)
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
            <PrimaryButton
              className='w-full'
              disabled={isRegistered && isUpcoming}
              onClick={() => router.push('/story/dashboard')}
            >
              {t('Go to dashboard')}
              <ChevronRightIcon
                className={cn('h-4 w-4', isRegistered && isUpcoming ? 'opacity-[0.1]' : 'text-white')}
              />
            </PrimaryButton>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className='my-auto flex flex-col gap-6'>
              <h2 className='font-archia'>{t('Become a Thenian')} 💜🏛</h2>
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
              </div>
              <div>
                <div>
                  <LabelTooltip
                    className='mb-1.5'
                    required
                    label='Select Country'
                    showInfoIcon
                    id='country-label'
                    tooltip='This field can be changed later'
                  />
                  <SelectCountry
                    className='w-full'
                    selected={formState.country}
                    setSelected={value => {
                      setFormState(prev => ({
                        ...prev,
                        country: value,
                      }))
                    }}
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
              {account ? (
                <PrimaryButton type='submit' disabled={!validateForm()} className='w-full'>
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
