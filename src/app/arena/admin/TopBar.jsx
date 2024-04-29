'use client'

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
import { cn, sliceAddress } from '@/lib/utils'
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
              <TextHeading className={cn('text-xl md:text-3xl', userInfo.nameColor ?? '')}>
                {sliceAddress(userInfo.id)}
              </TextHeading>
              {userInfo.isVerified && (
                <div className='size-4 md:size-5'>
                  <Verified />
                </div>
              )}
            </div>
            {userInfo.isSuperAdmin ? <Tag>Super admin</Tag> : <Tag>Admin</Tag>}
          </div>
          <TextSubHeading>
            {t('Joined')} {dayjs(userInfo.firstInteractAt).tz().format('MMM DD, YYYY')} {`${t('at')} `}
            {dayjs(userInfo.firstInteractAt).tz().format('hh:mm a Z')} UTC
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
