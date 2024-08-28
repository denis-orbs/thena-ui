import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useCallback, useContext, useEffect, useState } from 'react'

import Box from '@/components/box'
import { PrimaryButton } from '@/components/buttons/Button'
import ConnectButton from '@/components/buttons/ConnectButton'
import Input from '@/components/input'
import LabelTooltip from '@/components/label/LabelTooltip'
import { THEStoryContext } from '@/context/THEStoryContext'
import { errorToast } from '@/lib/notify'
import { cn } from '@/lib/utils'
import useWallet from '@/lib/wallets/useWallet'
import { ChevronRightIcon, SuccessIcon } from '@/svgs'

import { useRegisterToTHEStory } from '.'
import SelectCountry from './SelectCountry'

const initialFormState = {
  country: '',
  email: '',
  evmAddress: '',
  referralCode: '',
}

export default function StoryRegister({ isRegistered }) {
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

  const { registerToTHEStory } = useRegisterToTHEStory()

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

    await registerToTHEStory(
      {
        ...formState,
        evmAddress: formState.evmAddress.toLowerCase(),
      },
      res => {
        if (res) {
          setFormState({
            ...initialFormState,
            evmAddress: account,
            referralCode: searchParams.get('ref'),
          })
          // TODO: Set campaign user info
          setIsRegistered(true)
        }
      },
    )
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
            <PrimaryButton className='w-full' onClick={() => router.push('/story/dashboard')}>
              {t('Go to Chapters page')}
              <ChevronRightIcon className={cn('h-4 w-4 text-white')} />
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
                  {validateForm() ? t('Start Your Chapter') : t('Enter all details')}
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
