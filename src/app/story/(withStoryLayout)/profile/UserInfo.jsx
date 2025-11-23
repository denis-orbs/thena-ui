'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

import { NeutralBadge } from '@/components/badges/Badge'
import Box from '@/components/box'
import NextImage from '@/components/image/NextImage'
import { TextHeading, TextSubHeading } from '@/components/typography'
import { LOCALES } from '@/constant'
import { useCommonDayJs } from '@/lib/commonDayjs'
import { useLocaleSettings } from '@/state/settings/hooks'
import cn from '@/utils/classes'
import { formatAddress } from '@/utils/utils'

import { ProfileButton } from './ProfileButton'
import { RewardIconTooltip } from './RewardIconTooltip'
import { RewardType } from '../../constant'

export function UserInfo({ userInfo, completedChapter, totalChapter, totalSuccessfulReferral }) {
  const t = useTranslations()
  const { locale } = useLocaleSettings()
  const commonDayjs = useCommonDayJs()

  return (
    <>
      <Box className='flex flex-col gap-4'>
        <div className='flex flex-col-reverse justify-between gap-4 lg:flex-row'>
          <div className='flex flex-1 flex-col items-start justify-between gap-4 lg:flex-row lg:items-center'>
            <div className='flex items-start gap-5 lg:items-center'>
              <Image
                alt='avatar'
                src={userInfo.avatarUrl?.replace('ipfs.io', 'w3s.link') ?? '/images/home/stats/socials/social-1.png'}
                className='h-14 w-14 rounded-full lg:h-32 lg:w-32'
                width={100}
                height={100}
              />
              <div className='flex flex-col gap-2 lg:gap-3'>
                <div className='flex items-center'>
                  <TextHeading
                    className={cn(
                      'text-xl lg:text-3xl',
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
                      {userInfo?.participant?.username ||
                        userInfo?.participant?.spaceIdName ||
                        formatAddress(userInfo.id)}
                    </span>
                  </TextHeading>
                </div>
                <TextSubHeading className='text-sm'>
                  {locale === LOCALES.en
                    ? `${t('Joined')} ${commonDayjs(userInfo.createdAt).format('MMM D, YYYY')} at ${commonDayjs(
                        userInfo.createdAt,
                      ).format('h:mma')}`
                    : `${commonDayjs(userInfo.createdAt).format('YYYY 年 M 月 D 日a h:mm')} ${t('Joined')}`}
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
          <div className='rounded-xl bg-neutral-800'>
            <Box className='flex flex-col gap-1 bg-neutral-800 p-3 pr-0 lg:p-3 lg:pr-3'>
              <TextHeading className='text-lg'>{userInfo.rank === null ? '-' : userInfo.rank + 1}</TextHeading>
              <TextSubHeading className='text-sm'>{t('Rank')}</TextSubHeading>
            </Box>
          </div>
          <div className='rounded-xl bg-neutral-800'>
            <Box className='flex flex-col gap-1 bg-neutral-800 p-3 pr-0 lg:p-3 lg:pr-3'>
              <div className='flex items-center'>
                <RewardIconTooltip rewardType={RewardType.Point} id='user-info_earned-point' className='mr-1 mb-1' />
                <TextHeading className='text-lg'>{userInfo.totalPoints ?? '-'}</TextHeading>
              </div>
              <TextSubHeading className='text-sm'>{t('Earned points')}</TextSubHeading>
            </Box>
          </div>
          <div className='rounded-xl bg-neutral-800'>
            <Box className='flex flex-col gap-1 bg-neutral-800 p-3 pr-0 lg:p-3 lg:pr-3'>
              <div className='flex items-center'>
                <RewardIconTooltip
                  rewardType={RewardType.Fragment}
                  id='user-info_earned-fragments'
                  className='mr-1 mb-1'
                />
                <TextHeading className='text-lg'>{userInfo.totalFragments ?? '-'}</TextHeading>
              </div>
              <TextSubHeading className='text-sm'>{t('Earned fragments')}</TextSubHeading>
            </Box>
          </div>
          <div className='rounded-xl bg-neutral-800'>
            <Box className='flex flex-col gap-1 bg-neutral-800 p-3 pr-0 lg:p-3 lg:pr-3'>
              <TextHeading className='text-lg'>
                {completedChapter} / {totalChapter}
              </TextHeading>
              <TextSubHeading className='text-sm'>{t('Chapters completed')}</TextSubHeading>
            </Box>
          </div>
          <div className='col-span-2 rounded-xl bg-neutral-800 lg:col-span-1'>
            <Box className='flex flex-col gap-1 bg-neutral-800 p-3 pr-0 lg:p-3 lg:pr-3'>
              <TextHeading className='text-lg'>{totalSuccessfulReferral}</TextHeading>
              <TextSubHeading className='text-sm'>{t('Successful Referrals')}</TextSubHeading>
            </Box>
          </div>
        </div>
      </Box>
    </>
  )
}
