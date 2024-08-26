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

import { ProfileButton } from './ProfileButton'
import { RewardIconTooltip } from './RewardIconTooltip'
import { RewardType } from '../../constant'

dayjs.extend(localizedFormat)

export function UserInfo({ userInfo, completedChapter, totalChapter, totalSuccessfulReferral }) {
  const t = useTranslations()
  return (
    <>
      <Box className='space-y-4'>
        <div className='flex flex-col-reverse justify-between gap-4 lg:flex-row'>
          <div className='flex flex-1 flex-col items-start justify-between gap-4 lg:flex-row lg:items-center'>
            <div className='flex items-start gap-5 lg:items-center'>
              <Image
                alt='avatar'
                src={userInfo.avatar?.replace('ipfs.io', 'w3s.link') ?? Avatar}
                className='h-14 w-14 rounded-full lg:h-32 lg:w-32'
                width={100}
                height={100}
              />
              <div className='flex flex-col gap-2 lg:gap-3'>
                <div className='flex items-center'>
                  <TextHeading
                    className={cn(
                      ' text-xl lg:text-3xl',
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
                <div className='flex flex-col gap-1 md:flex-row'>
                  {userInfo.xProfileUsername && (
                    <Link href={`https://x.com/${userInfo.xProfileUsername}`} rel='nofollow noopener' target='_blank'>
                      <NeutralBadge className='flex w-fit items-center lg:text-xs'>
                        <NextImage alt='svg' className='mr-2 w-fit' src='/images/footer/x.svg' />
                        <span className='line-clamp-1'>@{userInfo.xProfileUsername}</span>
                      </NeutralBadge>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
          <ProfileButton />
        </div>
        <div className='grid grid-cols-2 gap-4 lg:grid-cols-5'>
          <Link href='/' className='rounded-xl bg-neutral-800'>
            <Box className='flex flex-col gap-1  bg-neutral-800 p-3 pr-0  lg:p-3 lg:pr-3'>
              <TextHeading className='text-lg'>{userInfo.rank ?? '-'}</TextHeading>
              <TextSubHeading className='text-sm'>{t('Rank')}</TextSubHeading>
            </Box>
          </Link>
          <Link href='/' className='rounded-xl bg-neutral-800'>
            <Box className='flex flex-col gap-1  bg-neutral-800 p-3 pr-0  lg:p-3 lg:pr-3'>
              <div className='flex items-center'>
                <RewardIconTooltip rewardType={RewardType.Point} id='user-info_earned-point' className='mb-1 mr-1' />
                <TextHeading className='text-lg'>{userInfo.totalPoints ?? '-'}</TextHeading>
              </div>
              <TextSubHeading className='text-sm'>{t('Earned points')}</TextSubHeading>
            </Box>
          </Link>
          <Link href='/' className='rounded-xl bg-neutral-800'>
            <Box className='flex flex-col gap-1  bg-neutral-800 p-3 pr-0  lg:p-3 lg:pr-3'>
              <div className='flex items-center'>
                <RewardIconTooltip
                  rewardType={RewardType.Fragment}
                  id='user-info_earned-fragments'
                  className='mb-1 mr-1'
                />
                <TextHeading className='text-lg'>{userInfo.totalFragments ?? '-'}</TextHeading>
              </div>
              <TextSubHeading className='text-sm'>{t('Earned fragments')}</TextSubHeading>
            </Box>
          </Link>
          <Link href='/' className='rounded-xl bg-neutral-800'>
            <Box className='flex flex-col gap-1  bg-neutral-800 p-3 pr-0  lg:p-3 lg:pr-3'>
              <TextHeading className='text-lg'>
                {completedChapter} / {totalChapter}
              </TextHeading>
              <TextSubHeading className='text-sm'>{t('Chapters completed')}</TextSubHeading>
            </Box>
          </Link>
          <Link href='/' className='col-span-2 rounded-xl bg-neutral-800 lg:col-span-1'>
            <Box className='flex flex-col gap-1  bg-neutral-800 p-3 pr-0  lg:p-3 lg:pr-3'>
              <TextHeading className='text-lg'>{totalSuccessfulReferral}</TextHeading>
              <TextSubHeading className='text-sm'>{t('Successful Referrals')}</TextSubHeading>
            </Box>
          </Link>
        </div>
      </Box>
    </>
  )
}
