'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import Avatar from 'public/images/home/stats/socials/social-1.png'
import React, { useState } from 'react'

import Box from '@/components/box'
import { EmphasisButton } from '@/components/buttons/Button'
import CircleImage from '@/components/image/CircleImage'
import Skeleton from '@/components/skeleton'
import Tag from '@/components/tag'
import { TextHeading, TextSubHeading } from '@/components/typography'
import dayjs from '@/lib/arenaDayjs'
import { ModalCreateNotification } from '@/modules/Admin/ModalCreateNotification'
import { VerifyPopover } from '@/modules/Profile/VerifyPopover'
import { sliceAddress } from '@/utils/utils'

function TopBar({ userInfo, isLoading }) {
  const t = useTranslations()
  const [openModalNotification, setOpenModalNotification] = useState(false)

  return (
    <Box className='flex flex-col-reverse gap-4 md:flex-row md:justify-between'>
      <div className='flex flex-row items-start gap-4 md:items-center'>
        <CircleImage
          src={userInfo?.avatar?.replace('ipfs.io', 'w3s.link') || Avatar}
          alt='avatar'
          className='size-14 md:size-[124px]'
        />
        {!isLoading && userInfo ? (
          <div className='flex flex-col gap-2 md:gap-3'>
            <div className='flex flex-col gap-1 md:flex-row md:items-center md:gap-3'>
              <div className='flex flex-row items-center gap-3'>
                <TextHeading
                  className={`text-xl md:text-3xl ${
                    userInfo?.nameColor && !String(userInfo?.nameColor).startsWith('#') ? userInfo?.nameColor : ''
                  }`}
                >
                  <span
                    style={{
                      color: userInfo?.nameColor
                        ? String(userInfo?.nameColor).startsWith('#')
                          ? userInfo?.nameColor
                          : ''
                        : '',
                    }}
                  >
                    {userInfo?.username || (userInfo?.id ? sliceAddress(userInfo?.id) : '')}
                  </span>
                </TextHeading>
                {userInfo?.isVerified && (
                  <VerifyPopover verifyImage={userInfo?.checkMarkIcon} verifiedAt={userInfo?.verifiedAt} />
                )}
              </div>
              {userInfo && userInfo?.isSuperAdmin ? <Tag>{t('Super Admin')}</Tag> : <Tag>{t('Admin')}</Tag>}
            </div>
            <TextSubHeading>
              {t('Joined')} {dayjs(userInfo?.firstInteractAt).tz().format('MMM D, YYYY')} {`${t('at')} `}
              {dayjs(userInfo?.firstInteractAt).tz().format('h:mma')}
            </TextSubHeading>
          </div>
        ) : (
          <div className='flex flex-col gap-2 md:gap-3'>
            <div className='flex flex-col gap-1 md:flex-row md:items-center md:gap-3'>
              <div className='flex flex-row items-center gap-3'>
                <Skeleton className='h-6 w-[140px]' />
                <Skeleton className='h-6 w-[20px]' />
              </div>
              <Skeleton className='h-6 w-[100px]' />
            </div>
            <Skeleton className='h-6 w-[240px]' />
          </div>
        )}
      </div>
      <div className='flex flex-row items-center justify-end gap-2'>
        <Link href='/arena/admin/edit'>
          <EmphasisButton className='text-base'>{t('Edit Profile')}</EmphasisButton>
        </Link>
        <EmphasisButton className='text-base' onClick={() => setOpenModalNotification(true)}>
          {t('Create Notification')}
        </EmphasisButton>
      </div>
      {openModalNotification && (
        <ModalCreateNotification isOpen={openModalNotification} onClose={() => setOpenModalNotification(false)} />
      )}
    </Box>
  )
}

export default TopBar
