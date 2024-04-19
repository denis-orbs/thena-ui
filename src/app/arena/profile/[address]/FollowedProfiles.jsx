'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'
import Avatar from 'public/images/home/stats/socials/social-1.png'
import { useState } from 'react'

import Box from '@/components/box'
import SearchInput from '@/components/input/SearchInput'
import { TextHeading, TextSubHeading } from '@/components/typography'

export function FollowedProfiles() {
  const t = useTranslations()
  const [searchText, setSearchText] = useState('')

  return (
    <div className='space-y-4'>
      <div className='flex flex-col items-start justify-between lg:flex-row lg:items-center'>
        <TextHeading className='flex-2 text-xl'>{t('Followed Profiles')}</TextHeading>
        <SearchInput className='w-full lg:flex-1' val={searchText} setVal={setSearchText} />
      </div>
      <div className='grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4'>
        {Array.from({
          length: 16,
        }).map((item, index) => (
          <Box key={index} className='flex items-center gap-5'>
            <Image alt='avatar' src={Avatar} className='h-10 w-10 rounded-full' width={40} height={40} />
            <div className='flex flex-col gap-1'>
              <TextHeading className='text-base'>First last</TextHeading>
              <TextSubHeading className='text-sm'>address</TextSubHeading>
            </div>
          </Box>
        ))}
      </div>
    </div>
  )
}
