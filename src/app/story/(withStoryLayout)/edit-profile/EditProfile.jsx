import Link from 'next/link'
import { useCallback, useState } from 'react'
import { useTranslations } from 'use-intl'

import { PrimaryButton } from '@/components/buttons/Button'
import Input from '@/components/input'
import { TextHeading, TextSubHeading } from '@/components/typography'
import { actionWithAuthentication, useSignWallet } from '@/hooks/useSignWallet'
import { v4Client } from '@/lib/graphql'
import { getFromLocalStorage } from '@/lib/helper'
import { successToast } from '@/lib/notify'
import useWallet from '@/lib/wallets/useWallet'
import { V4_UPDATE_PARTICIPANT_PROFILE } from '@/modules/Story'
import { ArrowBackwardIcon } from '@/svgs'

import { SelectAvatar } from './SelectAvatar'

export function EditProfile({ userInfo, updateUserInfo }) {
  const { account } = useWallet()
  const t = useTranslations()
  const [selectedImage, setSelectedImage] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  console.log({
    selectedImage,
    previewUrl,
  })

  const [dataUpdate, setDataUpdate] = useState({ ...userInfo })

  const { signWallet } = useSignWallet()
  const updateProfileFn = useCallback(
    async ({ country, email, xProfileUsername }) => {
      const { updateUserProfile } = await v4Client.request(
        V4_UPDATE_PARTICIPANT_PROFILE,
        {
          country,
          email,
          xProfileUsername,
          participantId: account?.toLocaleLowerCase() ?? null,
        },
        {
          authorization: getFromLocalStorage('token') ? `Bearer ${getFromLocalStorage('token')}` : '',
        },
      )
      if (updateUserProfile) {
        successToast('Successfully')

        return updateUserProfile
      }
      return false
    },
    [account],
  )

  const updateProfile = useCallback(
    (params, callOnSuccess) => actionWithAuthentication(updateProfileFn, signWallet, params, callOnSuccess),
    [updateProfileFn, signWallet],
  )

  const handleUpdateProfile = useCallback(async () => {
    if (dataUpdate) {
      await updateProfile(
        {
          data: dataUpdate,
        },
        data => {
          if (data !== false) {
            updateUserInfo({
              ...userInfo,
              data,
            })
          }
        },
      )
    }
  }, [dataUpdate, updateUserInfo, updateProfile, userInfo])

  return (
    <div>
      <div className='mt-[10px]'>
        <Link className='text-gray-100 ' href='/story'>
          <ArrowBackwardIcon className='inline-block h-5 w-5 opacity-40' />
          <span className='opacity-40'>{t('Back')}</span>
        </Link>

        <h5 className='mt-9 block font-archia text-3xl font-semibold leading-9'>{t('Edit Profile')}</h5>
      </div>
      <div className='mt-10 rounded-xl bg-neutral-900 p-6'>
        <div className='grid grid-cols-1 gap-x-[40px] gap-y-0 lg:grid-cols-3 lg:gap-y-[50px]'>
          <div className='col-span-3 lg:col-span-1'>
            <TextHeading className='block text-xl'>{t('Avatar')}</TextHeading>
            <TextSubHeading className='block text-[16px] font-normal leading-5'>
              {t('Avatar description')}
            </TextSubHeading>
          </div>
          <div className='col-span-3 mb-5 mt-1 lg:col-span-2 lg:m-0'>
            <SelectAvatar
              defaultAvatarURL={userInfo.avatarUrl}
              selectedImage={selectedImage}
              setSelectedImage={setSelectedImage}
              previewUrl={previewUrl}
              setPreviewUrl={setPreviewUrl}
            />
          </div>

          <div className='col-span-3 lg:col-span-1'>
            <TextHeading className='block text-xl'>{t('Country')}</TextHeading>
            <TextSubHeading className='block text-[16px] font-normal leading-5'>
              {t('Country description')}
            </TextSubHeading>
          </div>
          <div className='col-span-3 mb-5 mt-1 lg:col-span-2 lg:m-0'>
            <Input
              className='w-full lg:max-w-[550px]'
              type='text'
              val={dataUpdate.country ?? ''}
              onChange={e => {
                setDataUpdate({
                  ...dataUpdate,
                  country: e.target.value,
                })
              }}
              placeholder={t('Country description')}
              isLocale={false}
            />
          </div>

          <div className='col-span-3 lg:col-span-1'>
            <TextHeading className='block text-xl'>{t('Email')}</TextHeading>
            <TextSubHeading className='block text-[16px] font-normal leading-5'>
              {t('Email description')}
            </TextSubHeading>
          </div>
          <div className='col-span-3 mb-5 mt-1 lg:col-span-2 lg:m-0'>
            <Input
              className='w-full lg:max-w-[550px]'
              type='text'
              val={dataUpdate.email ?? ''}
              onChange={e => {
                setDataUpdate({
                  ...dataUpdate,
                  email: e.target.value,
                })
              }}
              placeholder={t('Email description')}
              isLocale={false}
            />
          </div>

          <div className='col-span-3 lg:col-span-1'>
            <TextHeading className='block text-xl'>{t('X profile link')}</TextHeading>
            <TextSubHeading className='block text-[16px] font-normal leading-5'>
              {t('X profile link description')}
            </TextSubHeading>
          </div>
          <div className='col-span-3 mb-5 mt-1 lg:col-span-2 lg:m-0'>
            <Input
              className='w-full lg:max-w-[550px]'
              type='text'
              val={dataUpdate.xProfileUsername ?? ''}
              onChange={e => {
                setDataUpdate({
                  ...dataUpdate,
                  email: e.target.value,
                })
              }}
              placeholder={t('X profile link description')}
              isLocale={false}
            />
          </div>

          <div className='col-span-3 lg:col-span-1' />
          <div className='col-span-3 mb-5 mt-1 lg:col-span-2 lg:mb-6 lg:mt-0'>
            <PrimaryButton onClick={() => handleUpdateProfile()}>{t('Save changes')}</PrimaryButton>
          </div>
        </div>
      </div>
    </div>
  )
}
