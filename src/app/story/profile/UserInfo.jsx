'use client'

import localizedFormat from 'dayjs/plugin/localizedFormat'
import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import Avatar from 'public/images/home/stats/socials/social-1.png'

import { NeutralBadge } from '@/components/badges/Badge'
import Box from '@/components/box'
import NextImage from '@/components/image/NextImage'
import { TextHeading, TextSubHeading } from '@/components/typography'
import dayjs from '@/lib/dateFormat'
import { cn, formatAddress } from '@/lib/utils'
import { ExternalIcon } from '@/svgs'

import { ProfileButton } from './ProfileButton'

dayjs.extend(localizedFormat)
const tarea_regex = /^(http|https)/

export function UserInfo({ userInfo }) {
  const t = useTranslations()

  return (
    <>
      <Box className='space-y-4'>
        <div className='flex flex-col-reverse justify-between gap-4 lg:flex-row lg:items-center'>
          <div className='flex flex-1 flex-col items-start justify-between gap-4 lg:flex-row lg:items-center'>
            <div className='flex items-start gap-5 lg:items-center'>
              <Image
                alt='avatar'
                src={userInfo.avatar?.replace('ipfs.io', 'w3s.link') ?? Avatar}
                className='h-14 w-14 rounded-full lg:h-32 lg:w-32'
                width={100}
                height={100}
              />
              <div className='flex flex-col gap-3'>
                <div className='flex items-center'>
                  <TextHeading
                    className={cn(
                      'text-3xl',
                      userInfo.nameColor && !String(userInfo.nameColor).startsWith('#') ? userInfo.nameColor : '',
                    )}
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
                      {userInfo.username || formatAddress(userInfo.id)}
                    </span>
                  </TextHeading>
                </div>
                <TextSubHeading className='text-sm'>
                  {t('Joined')} {dayjs(userInfo.firstInteractAt).tz().format('MMM D, YYYY')} {`${t('at')} `}
                  {dayjs(userInfo.firstInteractAt).tz().format('h:mma')}
                </TextSubHeading>
                <div className='flex flex-col gap-2 md:flex-row'>
                  {userInfo.websiteUrl && (
                    <Link
                      href={tarea_regex.test(userInfo.websiteUrl) ? userInfo.websiteUrl : `//${userInfo.websiteUrl}`}
                      rel='nofollow noopener noreferrer'
                      target='_blank'
                      prefetch={false}
                    >
                      <NeutralBadge className='flex items-center lg:text-xs'>
                        <div>
                          <ExternalIcon className='mr-2 h-4 w-4 stroke-neutral-400' />
                        </div>
                        <span className='line-clamp-1'>{userInfo.websiteUrl}</span>
                      </NeutralBadge>
                    </Link>
                  )}
                  {userInfo.xProfileUrl && (
                    <Link href={`https://x.com/${userInfo.xProfileUrl}`} rel='nofollow noopener' target='_blank'>
                      <NeutralBadge className='flex items-center lg:text-xs'>
                        <NextImage alt='svg' className='mr-2 w-fit' src='/images/footer/x.svg' />
                        <span className='line-clamp-1'>@{userInfo.xProfileUrl}</span>
                      </NeutralBadge>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
          <ProfileButton />
        </div>
        <div className='grid grid-cols-2 gap-4 lg:grid-cols-4'>
          <Link href='/'>
            <Box className='flex flex-col gap-2 bg-neutral-800'>
              <TextHeading className='text-lg'>{userInfo.rank}</TextHeading>
              <TextSubHeading className='text-sm'>{t('Rank')}</TextSubHeading>
            </Box>
          </Link>
          <Link href='/'>
            <Box className='flex flex-col gap-2 bg-neutral-800'>
              <TextHeading className='text-lg'>43</TextHeading>
              <TextSubHeading className='text-sm'>{t('Earned fragments')}</TextSubHeading>
            </Box>
          </Link>
          <Link href='/'>
            <Box className='flex flex-col gap-2 bg-neutral-800'>
              <TextHeading className='text-lg'>2</TextHeading>
              <TextSubHeading className='text-sm'>{t('Tasks completed')}</TextSubHeading>
            </Box>
          </Link>
          <Link href='/'>
            <Box className='flex flex-col gap-2 bg-neutral-800'>
              <TextHeading className='text-lg'>14</TextHeading>
              <TextSubHeading className='text-sm'>{t('Tasks remained')}</TextSubHeading>
            </Box>
          </Link>
        </div>
      </Box>
    </>
  )
}
