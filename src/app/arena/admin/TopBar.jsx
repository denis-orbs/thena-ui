'use client'

import Link from 'next/link'
import Avatar from 'public/images/home/stats/socials/social-1.png'
import React from 'react'

import Box from '@/components/box'
import { EmphasisButton } from '@/components/buttons/Button'
import CircleImage from '@/components/image/CircleImage'
import Tag from '@/components/tag'
import { TextHeading, TextSubHeading } from '@/components/typography'
import { Verified } from '@/svgs'

function TopBar() {
  return (
    <Box className='flex flex-col-reverse md:flex-row md:justify-between'>
      <div className='flex flex-row items-start gap-4 md:items-center'>
        <CircleImage src={Avatar} alt='avatar' className='size-14 md:size-[124px]' />
        <div className='flex flex-col gap-2 md:gap-3'>
          <div className='flex flex-col gap-1 md:flex-row md:items-center md:gap-3'>
            <div className='flex flex-row items-center gap-3'>
              <TextHeading className='text-xl md:text-3xl'>Apollo.thena</TextHeading>
              <div className='size-4 md:size-5'>
                <Verified />
              </div>
            </div>
            <Tag>Super admin</Tag>
          </div>
          <TextSubHeading>Joined Jan 24, 2024 at 11:40 AM +3 UTC</TextSubHeading>
        </div>
      </div>
      <div className='flex flex-row justify-end'>
        <Link href='/arena/admin/edit'>
          <EmphasisButton className='text-xs md:text-base'>Edit profile</EmphasisButton>
        </Link>
      </div>
    </Box>
  )
}

export default TopBar
