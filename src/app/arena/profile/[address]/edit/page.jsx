'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useCallback, useMemo, useState } from 'react'

import Box from '@/components/box'
import { EmphasisButton, PrimaryButton, TextButton } from '@/components/buttons/Button'
import Dropdown from '@/components/dropdown'
import Input from '@/components/input'
import { TextArea } from '@/components/textarea'
import Toggle from '@/components/toggle'
import { TextHeading, TextSubHeading } from '@/components/typography'
import { useUpdateProfile } from '@/hooks/useProfile'
import { errorToast } from '@/lib/notify'
import { ArrowLeftIcon } from '@/svgs'

import { SelectTheme } from './SelectTheme'

function EditProfilePage({ params }) {
  const t = useTranslations()
  const timeZoneData = useMemo(
    () =>
      Intl.supportedValuesOf('timeZone').map(value => ({
        label: value,
      })),
    [],
  )

  const currentTimeZone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, [])

  const [dataUpdate, setDataUpdate] = useState({
    biography: null,
    avatar: null,
    nameColor: null,
    theme: null,
    timezone: null,
    username: null,
    websiteUrl: null,
    xProfileUrl: null,
    isPublicProfile: true,
  })

  const { updateProfile } = useUpdateProfile()

  const handleUpdate = useCallback(async () => {
    if (dataUpdate.websiteUrl) {
      const regex = /^(https?):\/\/[^\s/$.?#].[^\s]*$/
      const validUrl = dataUpdate.xProfileUrl.match(regex)
      if (!validUrl) {
        return errorToast('Error', 'Invalid Website URL')
      }
    }
    if (dataUpdate.xProfileUrl) {
      const regex = /(?:https?:\/\/)?(?:www\.)?(twitter.com|x.com)\/(?:#!\/)?(\w+)/
      const validUrl = dataUpdate.xProfileUrl.match(regex)
      if (!validUrl) {
        return errorToast('Error', 'Invalid X URL')
      }
    }
    await updateProfile(...dataUpdate)
  }, [dataUpdate, updateProfile])

  return (
    <div className='flex flex-col space-y-10 pt-10'>
      <div>
        <Link href={`/arena/profile/${params.address}`}>
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
          <div className='flex flex-2 flex-col-reverse space-y-4 lg:flex-col lg:space-y-2'>
            <TextHeading className='text-3xl'>{t('No TheNFTs Found')}</TextHeading>
            <EmphasisButton className='w-32 text-nowrap'>{t('Buy TheNFT')}</EmphasisButton>
          </div>
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
            <TextArea
              placeholder={t('About Content')}
              value={dataUpdate.biography ?? ''}
              onChange={e => {
                setDataUpdate({
                  ...dataUpdate,
                  biography: e.target.value,
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
          <div className='grid flex-2 grid-cols-2 gap-3 lg:grid-cols-4'>
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
