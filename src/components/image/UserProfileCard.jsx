import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import Avatar from 'public/images/home/stats/socials/social-1.png'
import React, { useCallback } from 'react'

import { cn, sliceAddress } from '@/lib/utils'
import { Verified } from '@/svgs'

import CircleImage from './CircleImage'
import Tag from '../tag'
import { Paragraph, TextHeading } from '../typography'

export function UserProfileCard({
  avatar,
  username,
  id,
  nameColor,
  verifyImage,
  isAdmin,
  isSuperAdmin,
  showVerified = false,
  disableLink = false,
}) {
  const LinkComponent = useCallback(
    ({ children }) => {
      if (disableLink) return <div className='flex cursor-pointer items-center justify-center gap-2'>{children}</div>
      return (
        <Link
          className='flex cursor-pointer items-center justify-center gap-2'
          href={`/arena/profile/${id.toLowerCase()}`}
        >
          {children}
        </Link>
      )
    },
    [disableLink, id],
  )

  const t = useTranslations()

  return (
    <LinkComponent>
      <CircleImage src={avatar ?? Avatar} alt='avatar' className='size-8' />

      <div className='flex flex-col gap-1'>
        <TextHeading className={cn('text-nowrap text-base', nameColor ?? '')}>
          {username || sliceAddress(id)}
        </TextHeading>
        {username && <Paragraph>{sliceAddress(id)}</Paragraph>}
      </div>
      {showVerified &&
        (verifyImage ? (
          <Image src={verifyImage} width={20} height={20} className='h-5 w-5' alt='demo-checkmark' />
        ) : (
          <Verified className='h-5 w-5' />
        ))}
      {isAdmin && <Tag>{t('Admin')}</Tag>}
      {isSuperAdmin && <Tag>{t('Super Admin')}</Tag>}
    </LinkComponent>
  )
}
