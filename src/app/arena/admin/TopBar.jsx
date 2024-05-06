'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import Avatar from 'public/images/home/stats/socials/social-1.png'
import React from 'react'

import Box from '@/components/box'
import { EmphasisButton } from '@/components/buttons/Button'
import CircleImage from '@/components/image/CircleImage'
import Tag from '@/components/tag'
import { TextHeading, TextSubHeading } from '@/components/typography'
import dayjs from '@/lib/arenaDayjs'
import { sliceAddress } from '@/lib/utils'
import { Verified } from '@/svgs'

function TopBar({ userInfo }) {
  const t = useTranslations()

  return (
    <Box className='flex flex-col-reverse md:flex-row md:justify-between'>
      <div className='flex flex-row items-start gap-4 md:items-center'>
        <CircleImage src={Avatar} alt='avatar' className='size-14 md:size-[124px]' />
        <div className='flex flex-col gap-2 md:gap-3'>
          <div className='flex flex-col gap-1 md:flex-row md:items-center md:gap-3'>
            <div className='flex flex-row items-center gap-3'>
              <TextHeading
                className={`text-xl md:text-3xl ${
                  userInfo.nameColor && !String(userInfo.nameColor).startsWith('#') ? userInfo.nameColor : ''
                }`}
              >
                <span
                  style={{
                    color: userInfo.nameColor
                      ? String(userInfo.nameColor).startsWith('#')
                        ? userInfo.nameColor
                        : ''
                      : '',
                  }}
                >
                  {userInfo.username || sliceAddress(userInfo.id)}
                </span>
              </TextHeading>
              {userInfo.isVerified &&
                (userInfo?.checkMarkIcon ? (
                  <Image src={userInfo.checkMarkIcon} width={20} height={20} className='h-5 w-5' alt='demo-checkmark' />
                ) : (
                  <Verified className='h-5 w-5' />
                ))}
            </div>
            {userInfo.isSuperAdmin ? <Tag>{t('Super Admin')}</Tag> : <Tag>{t('Admin')}</Tag>}
          </div>
          <TextSubHeading>
            {t('Joined')} {dayjs(userInfo.firstInteractAt).tz().format('MMM DD, YYYY')} {`${t('at')} `}
            {dayjs(userInfo.firstInteractAt).tz().format('h:ma')}
          </TextSubHeading>
        </div>
      </div>
      <div className='flex flex-row justify-end'>
        <Link href='/arena/admin/edit'>
          <EmphasisButton className='text-base'>{t('Edit profile')}</EmphasisButton>
        </Link>
      </div>
    </Box>
  )
}

export default TopBar
