import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useRouter } from 'nextjs-toploader/app'
import React, { useCallback, useContext, useEffect, useState } from 'react'

import { THEStoryContext } from '@/app/story/provider'
import Box from '@/components/box'
import { PrimaryButton } from '@/components/buttons/Button'
import ConnectButton from '@/components/buttons/ConnectButton'
import Input from '@/components/input'
import LabelTooltip from '@/components/label/LabelTooltip'
import useWallet from '@/hooks/useWallet'
import ChevronRightIcon from '@/icons/ChevronRightIcon'
import { errorToast } from '@/lib/notify'

import { useRegisterToTHEStory } from '.'
import SelectCountry from './SelectCountry'

const initialFormState = {
  country: '',
  email: '',
  evmAddress: '',
  referralCode: '',
}

export default function StoryRegister({ isRegistered }) {
  const { setIsRegistered, setCampaignParticipantInfo } = useContext(THEStoryContext)
  const { account } = useWallet()
  const t = useTranslations()
  const searchParams = useSearchParams()
  const router = useRouter()

  const [formState, setFormState] = useState({
    ...initialFormState,
    evmAddress: account || '',
    referralCode: searchParams.get('ref') || '',
  })
  const [isSubmit, setIsSubmit] = useState(false)

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

    setIsSubmit(true)
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
          setCampaignParticipantInfo(res)
          setIsRegistered(true)
        }
        setIsSubmit(false)
      },
      () => {
        setIsSubmit(false)
      },
    )
  }

  if (isRegistered) {
    return <></>
  }

  return (
    <div className='border-gradient-secondary hidden w-full rounded-xl p-px md:w-[610px]'>
      <Box className='z-10 h-full rounded-[11px] bg-neutral-900 px-4 md:px-6 lg:px-8'>
        {isRegistered ? (
          <div className='flex flex-col justify-center'>
            <Image src='/svgs/successicon.svg' className='mx-auto size-20' />
            <p className='font-archia mx-auto mb-10 max-w-[400px] text-center text-[26px] font-semibold md:text-[30px]'>
              {t('You Have Successfully Registered for THE Story of THENA Adventure')}
            </p>
            <PrimaryButton className='w-full' onClick={() => router.push('/story/chapters')}>
              {t('Go to Chapters page')}
              <ChevronRightIcon className='text-white' />
            </PrimaryButton>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className='my-auto flex flex-col gap-5 md:gap-6'>
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
                  classNames={{
                    input: 'leading-5',
                  }}
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
                  classNames={{
                    input: 'leading-5',
                  }}
                />
              </div>
              {account ? (
                <PrimaryButton type='submit' disabled={!validateForm() || isSubmit} className='w-full'>
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
