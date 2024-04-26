import Link from 'next/link'
import Avatar from 'public/images/home/stats/socials/social-1.png'
import React from 'react'

import { cn, sliceAddress } from '@/lib/utils'
import { Verified } from '@/svgs'

import CircleImage from './CircleImage'
import { Paragraph, TextHeading } from '../typography'

export function UserProfileCard({ avatar, username, id, nameColor, showVerified = false }) {
  return (
    <Link className='flex cursor-pointer items-center justify-center gap-2' href={`/arena/profile/${id.toLowerCase()}`}>
      <CircleImage src={avatar ?? Avatar} alt='avatar' className='size-8' />

      <div className='flex flex-col gap-1'>
        {username && (
          <TextHeading className={cn('text-nowrap text-base', nameColor ? `text-[#${nameColor}]` : '')}>
            {username.length > 12 ? sliceAddress(username) : username}
          </TextHeading>
        )}
        <Paragraph>{sliceAddress(id)}</Paragraph>
      </div>
      {showVerified && <Verified className='h-5 w-5' />}
    </Link>
  )
}
