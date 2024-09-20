import dynamic from 'next/dynamic'
import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import React, { useCallback, useEffect, useState } from 'react'
import { mutate } from 'swr'

import 'react-quill/dist/quill.snow.css'
import 'react-quill-emoji/dist/quill-emoji.css'
import './style.css'

import Box from '@/components/box'
import { EmphasisButton, PrimaryButton, TextButton } from '@/components/buttons/Button'
import Input from '@/components/input'
import Toggle from '@/components/toggle'
import { TextHeading, TextSubHeading } from '@/components/typography'
import useWallet from '@/hooks/useWallet'
import { errorToast } from '@/lib/notify'
import { cn, isValidHttpUrl } from '@/lib/utils'
import { ArrowLeftIcon, Verified } from '@/svgs'

import { SelectAvatar } from './SelectAvatar'
import { SelectNameColor } from './SelectNameColor'
import { SelectTheme } from './SelectTheme'
import { SelectUserName } from './SelectUserName'
import ModalEditCheckMark from '../Admin/ModalEditCheckMark'
import { useUpdateArenaProfile } from '../Arena/hooks/profile'

const QuillEditor = dynamic(() => import('@/components/editor/QuillEditor'), { ssr: false })

export function EditProfile({ userInfo, mutateUserInfo, isAdmin = false }) {
  const t = useTranslations()
  const { account } = useWallet()

  const [showCustomColor, setShowCustomColor] = useState(false)
  const [openCheckMarkIcon, setOpenCheckMarkIcon] = useState(false)

  const [dataUpdate, setDataUpdate] = useState({
    biography: userInfo?.biography ?? null,
    avatar: userInfo?.avatar ?? null,
    theme: userInfo?.theme ?? null,
    username: userInfo?.username ?? null,
    websiteUrl: userInfo?.websiteUrl ?? null,
    xProfileUrl: userInfo?.xProfileUrl ?? null,
    isPublicProfile: userInfo?.isPublicProfile ?? true,
    nameColor: userInfo?.nameColor ?? '#ffffff',
    checkMarkIcon: userInfo?.checkMarkIcon ?? null,
  })

  const { updateArenaProfile } = useUpdateArenaProfile(
    account?.toLowerCase() !== userInfo?.id?.toLowerCase() ? userInfo?.id : null,
  )

  const handleSave = useCallback(async () => {
    if (dataUpdate.websiteUrl) {
      if (!isValidHttpUrl(dataUpdate.websiteUrl)) {
        return errorToast('Error', 'Invalid Website URL')
      }
    }
    await updateArenaProfile({ ...dataUpdate }, data => {
      if (data !== false) {
        if (isAdmin && userInfo.id === account.toLowerCase()) {
          mutate(['fetchUserInfo', account])
        }
        mutateUserInfo({
          ...userInfo,
          ...data,
        })
      }
    })
  }, [account, dataUpdate, isAdmin, mutateUserInfo, updateArenaProfile, userInfo])

  useEffect(() => {
    if (dataUpdate?.nameColor) {
      if (isAdmin && dataUpdate.nameColor && String(dataUpdate.nameColor).startsWith('#')) {
        setShowCustomColor(true)
      } else {
        setShowCustomColor(false)
      }
    }
  }, [dataUpdate.nameColor, isAdmin])

  return (
    <div className='flex flex-col space-y-10 pt-10'>
      <div>
        <Link href={isAdmin ? '/arena/admin' : '/arena/profile'}>
          <TextButton className='pl-0' LeadingIcon={ArrowLeftIcon}>
            {t('Back')}
          </TextButton>
        </Link>
      </div>
      <TextHeading className='text-3xl'>{t('Edit Profile')}</TextHeading>

      <Box className='space-y-10'>
        {!!userInfo?.usernameNfts?.length && (
          <SelectUserName dataUpdate={dataUpdate} setDataUpdate={setDataUpdate} userInfo={userInfo} />
        )}
        <div className='flex flex-col gap-6 lg:flex-row'>
          <div className='flex flex-1 flex-col gap-3'>
            <TextHeading className='text-xl'>{t('Avatar')}</TextHeading>
            <TextSubHeading className='text-base'>
              {t('You Must Own An TheNFT To Select It As Your Avatar')}
            </TextSubHeading>
          </div>
          <SelectAvatar
            dataUpdate={dataUpdate}
            setDataUpdate={setDataUpdate}
            userInfo={userInfo}
            mutateUserInfo={mutateUserInfo}
            isAdmin={isAdmin}
          />
        </div>
        <div className='flex flex-col gap-6 md:flex-row'>
          <div className='flex flex-1 flex-col gap-3'>
            <TextHeading className='text-xl'>{t('Change Name Color')}</TextHeading>
            <TextSubHeading className='text-base'>{t('Pick A Color For Your Name')}</TextSubHeading>
          </div>
          <div className='flex flex-2 items-center gap-3 max-sm:flex-col'>
            <div>
              <TextSubHeading className={cn('mb-1 block', !showCustomColor && 'ml-[5px]')}>
                {t(!showCustomColor ? 'Basic Color' : 'Custom Color')}:
              </TextSubHeading>
              <div className='flex flex-col md:flex-row'>
                {!showCustomColor ? (
                  <SelectNameColor dataUpdate={dataUpdate} setDataUpdate={setDataUpdate} />
                ) : (
                  <Input
                    type='color'
                    className='w-full lg:w-[300px]'
                    classNames={{
                      input: 'h-[58px] py-1 px-2',
                    }}
                    val={
                      dataUpdate.nameColor && String(dataUpdate.nameColor).startsWith('#')
                        ? dataUpdate.nameColor
                        : '#32c343'
                    }
                    onChange={e => {
                      setDataUpdate({
                        ...dataUpdate,
                        nameColor: e.target.value,
                      })
                    }}
                  />
                )}
                {isAdmin && (
                  <PrimaryButton onClick={() => setShowCustomColor(!showCustomColor)} className='lg:ml-16'>
                    {t(showCustomColor ? 'Use Basic Color Instead' : 'Use Custom Color Instead')}
                  </PrimaryButton>
                )}
              </div>
            </div>
          </div>
        </div>
        {(isAdmin || userInfo?.isVerified) && (
          <div className='flex flex-col gap-6 md:flex-row'>
            <div className='flex flex-1 flex-col gap-3'>
              <TextHeading className='text-xl'>{t('Edit Checkmark Image')}</TextHeading>
              <TextSubHeading className='text-base'>{t('Edit What Your Checkmark Looks Like')}</TextSubHeading>
            </div>
            <div className='flex flex-2 items-center gap-3'>
              {userInfo?.isVerified ? (
                dataUpdate?.checkMarkIcon ? (
                  <Image
                    src={dataUpdate?.checkMarkIcon}
                    width={20}
                    height={20}
                    className='ml-2 size-5'
                    alt='demo-checkmark'
                  />
                ) : (
                  <Verified className='ml-2 size-5' />
                )
              ) : (
                <></>
              )}
              <EmphasisButton onClick={() => setOpenCheckMarkIcon(true)} className='my-3'>
                {t('Edit Checkmark Image')}
              </EmphasisButton>
            </div>
          </div>
        )}
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
            <TextHeading className='text-xl'>{t('X Profile Username')}</TextHeading>
            <TextSubHeading className='text-base'>{t('Enter Your X Profile Username To Update X')}</TextSubHeading>
          </div>
          <div className='flex-2'>
            <Input
              prefix='@'
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
          {/* eslint-disable-next-line prettier/prettier */}
          <div className='grid grid-cols-2 gap-3 lg:grid-cols-3 2xl:grid-cols-4'>
            <SelectTheme dataUpdate={dataUpdate} setDataUpdate={setDataUpdate} isAdmin={isAdmin} />
          </div>
        </div>
        <div className='flex flex-col lg:flex-row'>
          <div className='flex flex-1 flex-col gap-3' />
          <div className='flex-2'>
            <PrimaryButton onClick={handleSave}>{t('Save Changes')}</PrimaryButton>
          </div>
        </div>
      </Box>
      {openCheckMarkIcon && (
        <ModalEditCheckMark
          isOpen={openCheckMarkIcon}
          user={{
            biography: userInfo?.biography ?? null,
            avatar: userInfo?.avatar ?? null,
            theme: userInfo?.theme ?? null,
            username: userInfo?.username ?? null,
            websiteUrl: userInfo?.websiteUrl ?? null,
            xProfileUrl: userInfo?.xProfileUrl ?? null,
            isPublicProfile: userInfo?.isPublicProfile ?? true,
            nameColor: userInfo?.nameColor ?? '#ffffff',
            id: userInfo?.id,
          }}
          mutate={mutateUserInfo}
          closeModal={() => setOpenCheckMarkIcon(false)}
          onChange={data => {
            setDataUpdate({
              ...dataUpdate,
              checkMarkIcon: data,
            })
          }}
        />
      )}
    </div>
  )
}
