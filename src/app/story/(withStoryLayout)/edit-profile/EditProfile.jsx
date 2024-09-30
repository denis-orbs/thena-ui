import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'use-intl'

import { PrimaryButton } from '@/components/buttons/Button'
import Input from '@/components/input'
import { TextHeading, TextSubHeading } from '@/components/typography'
import { useUpdateParticipantProfile } from '@/modules/Story'
import SelectCountry from '@/modules/Story/SelectCountry'
import { ArrowBackwardIcon } from '@/svgs'

import { SelectAvatar } from './SelectAvatar'

export function EditProfile({ userInfo, updateUserInfo }) {
  const t = useTranslations()
  const { updateParticipantProfile } = useUpdateParticipantProfile()

  const [isSubmit, setIsSubmit] = useState(false)
  const [errors, setErrors] = useState({})
  const [dataUpdate, setDataUpdate] = useState({ ...userInfo })
  const isFormValid = useMemo(() => Object.keys(errors).length === 0, [errors])

  useEffect(() => {
    setDataUpdate({ ...userInfo })
  }, [userInfo])

  const validateForm = useCallback(() => {
    const err = {}

    if (!dataUpdate.email) {
      err.email = 'Please enter your email.'
    } else if (!/\S+@\S+\.\S+/.test(dataUpdate.email)) {
      err.email = 'Email is invalid.'
    }

    if (!dataUpdate.country) {
      err.country = 'Please select your country'
    }

    setErrors(err)
  }, [dataUpdate])

  useEffect(() => {
    if (dataUpdate) {
      validateForm()
    }
  }, [dataUpdate, validateForm])

  const handleUpdateProfile = useCallback(async () => {
    if (isFormValid) {
      setIsSubmit(true)
      await updateParticipantProfile(
        dataUpdate,
        newData => {
          if (newData !== false) {
            updateUserInfo({
              ...userInfo,
              ...newData,
            })
          }
          setIsSubmit(false)
        },
        () => {
          setIsSubmit(false)
        },
      )
    }
  }, [isFormValid, dataUpdate, updateUserInfo, updateParticipantProfile, userInfo])

  return (
    <form onSubmit={handleUpdateProfile}>
      <div className='mt-[10px]'>
        <Link className='text-gray-100 ' href='/story/profile'>
          <ArrowBackwardIcon className='inline-block h-5 w-5 opacity-40' />
          <span className='opacity-40'>{t('Back')}</span>
        </Link>

        <h5 className='mt-9 block font-archia text-3xl font-semibold leading-9'>{t('Edit Profile')}</h5>
      </div>
      <div className='mt-10 rounded-xl bg-neutral-900 p-6'>
        <div className='grid grid-cols-1 gap-x-[40px] gap-y-0 lg:grid-cols-3 lg:gap-y-[50px]'>
          <div className='col-span-3 mt-8 lg:col-span-1 lg:mt-0'>
            <TextHeading className='block text-xl'>{t('Avatar')}</TextHeading>
            <TextSubHeading className='my-3 block text-[16px] font-normal leading-5 lg:my-0'>
              {t('Avatar description')}
            </TextSubHeading>
          </div>
          <div className='col-span-3 mb-5 mt-1 lg:col-span-2 lg:m-0'>
            <SelectAvatar avatarUrl={dataUpdate.avatarUrl} />
          </div>

          <div className='col-span-3 mt-8 lg:col-span-1 lg:mt-0'>
            <TextHeading className='block text-xl'>{t('Country')}</TextHeading>
            <TextSubHeading className='my-3 block text-[16px] font-normal leading-5 lg:my-0'>
              {t('Country description')}
            </TextSubHeading>
          </div>
          <div className='col-span-3 mb-5 mt-1 lg:col-span-2 lg:m-0'>
            <SelectCountry
              className='w-full lg:max-w-[550px]'
              selected={dataUpdate.country}
              setSelected={value => {
                setDataUpdate({
                  ...dataUpdate,
                  country: value,
                })
              }}
            />
            {errors.country && <p className='mb-1.5 text-red-500'>{errors.country}</p>}
          </div>

          <div className='col-span-3 mt-8 lg:col-span-1 lg:mt-0'>
            <TextHeading className='block text-xl'>{t('Email')}</TextHeading>
            <TextSubHeading className='my-3 block text-[16px] font-normal leading-5 lg:my-0'>
              {t('Email description')}
            </TextSubHeading>
          </div>
          <div className='col-span-3 mb-5 mt-1 lg:col-span-2 lg:m-0'>
            <Input
              className='w-full lg:max-w-[550px]'
              type='email'
              placeholder={t('Email Address')}
              val={dataUpdate.email}
              onChange={ele => {
                setDataUpdate({
                  ...dataUpdate,
                  email: ele.target.value,
                })
              }}
              required
            />
            {errors.email && <p className='mb-1.5 text-red-500'>{errors.email}</p>}
          </div>

          <div className='col-span-3 mt-8 lg:col-span-1 lg:mt-0'>
            <TextHeading className='block text-xl'>{t('X Profile Username')}</TextHeading>
            <TextSubHeading className='my-3 block text-[16px] font-normal leading-5 lg:my-0'>
              {t('Enter Your X Profile Username To Update X')}
            </TextSubHeading>
          </div>
          <div className='col-span-3 mb-5 mt-1 lg:col-span-2 lg:m-0'>
            <Input
              className='w-full lg:max-w-[550px]'
              type='text'
              val={dataUpdate.xProfileUsername ?? ''}
              prefix='@'
              placeholder='xprofilehandle'
              onChange={e => {
                setDataUpdate({
                  ...dataUpdate,
                  xProfileUsername: e.target.value,
                })
              }}
            />
          </div>

          <div className='col-span-3 mt-8 lg:col-span-1 lg:mt-0' />
          <div className='col-span-3 mb-5 mt-1 lg:col-span-2 lg:mb-6 lg:mt-0'>
            <PrimaryButton
              className='w-full lg:w-auto'
              disabled={!isFormValid || isSubmit}
              onClick={handleUpdateProfile}
            >
              {t('Save changes')}
            </PrimaryButton>
          </div>
        </div>
      </div>
    </form>
  )
}
