'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useState } from 'react'

import 'react-quill/dist/quill.snow.css'
import 'react-quill-emoji/dist/quill-emoji.css'
import './style.css'

import Box from '@/components/box'
import { PrimaryButton, TextButton } from '@/components/buttons/Button'
import Dropdown from '@/components/dropdown'
import Input from '@/components/input'
import Toggle from '@/components/toggle'
import { TextHeading, TextSubHeading } from '@/components/typography'
import { useUserInfo } from '@/context/userInfoContext'
import { useUpdateProfile } from '@/hooks/useProfile'
import { errorToast } from '@/lib/notify'
import { isValidHttpUrl } from '@/lib/utils'
import { ArrowLeftIcon } from '@/svgs'

import { SelectAvatar } from './SelectAvatar'
import { SelectTheme } from './SelectTheme'

const QuillEditor = dynamic(() => import('@/components/editor/QuillEditor'), { ssr: false })

function EditProfilePage() {
  const t = useTranslations()
  const { userInfo, isLoading } = useUserInfo()

  const [timeZoneData, setTimeZoneData] = useState([])

  const [currentTimeZone, setCurrentTimeZone] = useState('')

  const [dataUpdate, setDataUpdate] = useState({
    biography: userInfo?.biography ?? null,
    avatar: userInfo?.avatar ?? null,
    theme: userInfo?.theme ?? null,
    timezone: userInfo?.timezone ?? currentTimeZone,
    username: userInfo?.username ?? null,
    websiteUrl: userInfo?.websiteUrl ?? null,
    xProfileUrl: userInfo?.xProfileUrl ?? null,
    isPublicProfile: userInfo?.isPublicProfile ?? true,
  })

  const { updateProfile } = useUpdateProfile()

  const handleUpdate = useCallback(async () => {
    if (dataUpdate.websiteUrl) {
      if (!isValidHttpUrl(dataUpdate.websiteUrl)) {
        return errorToast('Error', 'Invalid Website URL')
      }
    }
    await updateProfile(...dataUpdate)
  }, [dataUpdate, updateProfile])

  useEffect(() => {
    if (!isLoading && !userInfo && !userInfo?.usernameNfts.length) {
      redirect('/arena/profile')
    }
  }, [isLoading, userInfo, userInfo?.usernameNfts])

  useEffect(() => setCurrentTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone), [])

  useEffect(
    () =>
      setTimeZoneData(
        Intl.supportedValuesOf('timeZone').map(value => ({
          label: value,
        })),
      ),
    [],
  )

  return (
    <div className='flex flex-col space-y-10 pt-10'>
      <div>
        <Link href='/arena/profile'>
          <TextButton className='pl-0' LeadingIcon={ArrowLeftIcon}>
            {t('Back')}
          </TextButton>
        </Link>
      </div>
      <TextHeading className='text-3xl'>{t('Edit Profile')}</TextHeading>

      <Box className='space-y-10'>
        <div className='flex flex-col gap-6 lg:flex-row'>
          <div className='flex flex-1 flex-col gap-3'>
            <TextHeading className='text-xl'>{t('Avatar')}</TextHeading>
            <TextSubHeading className='text-base'>
              {t('You Must Own An TheNFT To Select It As Your Avatar')}
            </TextSubHeading>
          </div>
          <SelectAvatar dataUpdate={dataUpdate} setDataUpdate={setDataUpdate} />
        </div>
        <div className='flex flex-col gap-6 lg:flex-row'>
          <div className='flex flex-1 flex-col gap-3'>
            <TextHeading className='text-xl'>{t('Website URL')}</TextHeading>
            <TextSubHeading className='text-base'>{t('Enter Your Website URL To Update Your Site')}</TextSubHeading>
          </div>
          <div className='flex-2'>
            <Input
              type='text'
              placeholder='yourwebsite'
              className='w-full lg:w-72'
              val={dataUpdate.websiteUrl ?? ''}
              onChange={e => {
                setDataUpdate({
                  ...dataUpdate,
                  websiteUrl: e.target.value,
                })
              }}
            />
          </div>
        </div>
        <div className='flex flex-col gap-6 lg:flex-row'>
          <div className='flex flex-1 flex-col gap-3'>
            <TextHeading className='text-xl'>{t('X Profile Link')}</TextHeading>
            <TextSubHeading className='text-base'>{t('Enter Your X Profile URL To Update X')}</TextSubHeading>
          </div>
          <div className='flex-2'>
            <Input
              type='text'
              placeholder='xprofilehandle'
              className='w-full lg:w-72'
              val={dataUpdate.xProfileUrl ?? ''}
              onChange={e => {
                setDataUpdate({
                  ...dataUpdate,
                  xProfileUrl: e.target.value,
                })
              }}
            />
          </div>
        </div>
        <div className='flex flex-col gap-6 lg:flex-row'>
          <div className='flex flex-1 flex-col gap-3'>
            <TextHeading className='text-xl'>{t('About You Text')}</TextHeading>
            <TextSubHeading className='text-base'>{t('Enter Your Biography')}</TextSubHeading>
          </div>
          <div className='flex-2'>
            <QuillEditor
              value={dataUpdate.biography}
              onChange={value => {
                setDataUpdate({
                  ...dataUpdate,
                  biography: value,
                })
              }}
            />
          </div>
        </div>
        <div className='flex flex-col gap-6 lg:flex-row'>
          <div className='flex flex-1 flex-col gap-3'>
            <TextHeading className='text-xl'>{t('Time Zone')}</TextHeading>
            <TextSubHeading className='text-base'>{t('Select Your Preferred Time Zone')}</TextSubHeading>
          </div>
          <div className='flex-2'>
            <Dropdown
              className='w-full lg:w-80'
              listClassNames='max-h-64 overflow-y-auto'
              data={timeZoneData}
              selected={dataUpdate.timezone ?? currentTimeZone}
              setSelected={e => {
                setDataUpdate({
                  ...dataUpdate,
                  timezone: e.label,
                })
              }}
              isLocale={false}
            />
          </div>
        </div>
        <div className='flex flex-col gap-10 lg:flex-row'>
          <div className='flex flex-1 flex-col gap-3'>
            <TextHeading className='text-xl'>{t('Suggest My Profile To Others')}</TextHeading>
            <TextSubHeading className='text-base'>
              {t('Toggling This On Allows Your Profile To Be Discovered Throughout The Platform')}
            </TextSubHeading>
          </div>
          <div className='flex-2'>
            <Toggle
              className='my-2 lg:flex'
              checked={dataUpdate.isPublicProfile}
              onChange={e => {
                setDataUpdate({
                  ...dataUpdate,
                  isPublicProfile: e.target.checked,
                })
              }}
              toggleId='free-join'
            />
          </div>
        </div>
        <div className='flex flex-col gap-10 lg:flex-row'>
          <div className='flex flex-1 flex-col gap-3'>
            <TextHeading className='text-xl'>{t('Theme')}</TextHeading>
            <TextSubHeading className='text-base'>
              {t('Personalize Your Experience By Choosing From A Variety Of Background Themes')}
            </TextSubHeading>
          </div>
          <div className='grid flex-2 grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4'>
            <SelectTheme dataUpdate={dataUpdate} setDataUpdate={setDataUpdate} />
          </div>
        </div>
        <div className='flex flex-col lg:flex-row'>
          <div className='flex flex-1 flex-col gap-3' />
          <div className='flex-2'>
            <PrimaryButton onClick={() => handleUpdate()}>{t('Save Changes')}</PrimaryButton>
          </div>
        </div>
      </Box>
    </div>
  )
}

export default EditProfilePage
