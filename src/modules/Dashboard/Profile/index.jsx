import dayjs from 'dayjs'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Avatar from 'public/images/home/stats/socials/social-1.png'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import useSWR from 'swr'

import { fetchAchievements } from '@/app/arena/profile/UserCompletedAchievements'
import { NeutralBadge } from '@/components/badges/Badge'
import Box from '@/components/box'
import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import NextImage from '@/components/image/NextImage'
import Skeleton from '@/components/skeleton'
import { NewTextHeading, NewTextSubHeading, Paragraph, TextHeading } from '@/components/typography'
import { fetchUserInfo } from '@/context/userInfoContext'
import { useVeTHEsContext } from '@/context/veTHEsContext'
import useWallet from '@/hooks/useWallet'
import { useWindowSize } from '@/hooks/useWindowSize'
import { cn, formatAddress, formatAmount, sortAchievements } from '@/lib/utils'
import AchievementBasicIcon from '@/modules/Achievements/AchievementBasicIcon'

import SectionDivider from '../SectionDivider'

function DashboardProfile() {
  const t = useTranslations()
  const { push } = useRouter()
  const { account } = useWallet()
  const { veTHEs } = useVeTHEsContext()
  const { data: userInfo, isLoading } = useSWR(['user info', account], () => fetchUserInfo(account), {
    revalidateOnFocus: false,
  })
  const { data: userAchievementsCompleted } = useSWR(
    ['userAchievementsCompleted', account],
    () => fetchAchievements(account.toLowerCase()),
    { revalidateOnFocus: false },
  )

  const sortedData = useMemo(() => {
    if (Array.isArray(userAchievementsCompleted) && userAchievementsCompleted.length) {
      return userAchievementsCompleted.sort(sortAchievements)
    }
    return []
  }, [userAchievementsCompleted])

  const veTHEPower = useMemo(
    () => veTHEs.reduce((power, veTHE) => power + Number(veTHE?.voting_amount ?? 0), 0),
    [veTHEs],
  )

  const achievementsRef = useRef(null)
  const [visibleCount, setVisibleCount] = useState()

  useEffect(() => {
    if (sortedData.length === 0) return
    setVisibleCount(prev => {
      if (!prev || prev === 0) return sortedData.length
      return prev
    })
  }, [sortedData.length])

  const windowSize = useWindowSize()

  useEffect(() => {
    const { width } = windowSize

    if (width >= 834 && width < 1024) {
      setVisibleCount(7)
    } else if (width >= 1024 && width < 1280) {
      setVisibleCount(9)
    } else if (width >= 1280 && width < 1356) {
      setVisibleCount(10)
    } else if (width >= 1356 && width < 1536) {
      setVisibleCount(12)
    } else if (width >= 1536) {
      setVisibleCount(13)
    } else {
      setVisibleCount(8)
    }
  }, [windowSize])

  return (
    <div
      className={cn(
        'rounded-xl md:col-span-2',
        (!userInfo || !userInfo.usernameNfts?.length) &&
          'bg-[url("/images/profile-bg.png")] bg-cover bg-center bg-no-repeat md:col-span-1',
      )}
    >
      <Box
        className={cn(
          'flex h-full flex-col gap-1.5 !p-4 max-md:mt-4 md:gap-6',
          (!userInfo || !userInfo.usernameNfts?.length) && 'bg-transparent',
        )}
      >
        {isLoading ? (
          <Skeleton className='h-[428px] w-full' />
        ) : !userInfo || !userInfo.usernameNfts?.length ? (
          <div className='flex h-full flex-col justify-between gap-4'>
            <div className='flex flex-col gap-4'>
              <div className='flex h-[130px] flex-col justify-end'>
                <NewTextHeading className='text-gradient-primary-b text-5xl md:text-5xl'>
                  {t('Mint your ID')}
                </NewTextHeading>
              </div>

              <div className='flex flex-col gap-2'>
                <NewTextSubHeading className='text-xl md:text-xl'>{t('Account not available title')}</NewTextSubHeading>
                {userInfo && (
                  <Paragraph className='text-neutral-500 lg:text-sm'>
                    Joined {dayjs(userInfo.firstInteractAt).format('MMM DD, YYYY')} at{' '}
                    {dayjs(userInfo.firstInteractAt).format('hh:mm a')}
                  </Paragraph>
                )}
              </div>
            </div>

            <div className='flex flex-col gap-7'>
              <Paragraph className='font-medium text-neutral-500 lg:text-sm'>
                {t('Account not available desc')}
              </Paragraph>

              <PrimaryButton className='w-full max-md:h-8 max-md:text-xs' onClick={() => push('/dashboard/lock')}>
                GET THENA ID
              </PrimaryButton>
            </div>
          </div>
        ) : (
          <>
            <div className='hidden h-full flex-col justify-between md:flex' ref={achievementsRef}>
              <div className='flex gap-4'>
                <div className='size-[145px]'>
                  <Image
                    alt='avatar'
                    src={userInfo?.avatar?.replace('ipfs.io', 'w3s.link') ?? Avatar}
                    className='size-full rounded-[20px]'
                    width={0}
                    height={0}
                  />
                </div>

                <div className='flex flex-col gap-4 max-md:hidden'>
                  <NewTextHeading className='text-xl !leading-6 text-neutral-500 md:text-xl'>
                    {userInfo?.isVerified ? 'Verified' : 'Unverified'}
                  </NewTextHeading>
                  {userInfo?.username && (
                    <NewTextHeading className='flex gap-2 text-xl !leading-6 md:text-xl'>
                      <span className='text-neutral-500'>{t('Thena ID')}:</span>
                      <span className='text-warn-600'>{userInfo?.username}</span>
                    </NewTextHeading>
                  )}
                  <TextHeading className='flex gap-2 font-archia text-xl font-semibold !leading-6 lg:text-xl'>
                    <span className='text-neutral-500'>{t('Wallet')}:</span>
                    <span className='text-neutral-500'>{formatAddress(account)}</span>
                  </TextHeading>
                  {userInfo?.xProfileUrl && (
                    <div className='flex gap-2'>
                      <TextHeading className='font-archia text-xl font-semibold !leading-6 text-neutral-500 lg:text-xl'>
                        {t('Socials')}:{' '}
                      </TextHeading>
                      <Link href={`https://x.com/${userInfo?.xProfileUrl}`} rel='nofollow noopener' target='_blank'>
                        <NeutralBadge className='flex items-center lg:text-xs'>
                          <NextImage alt='svg' className='mr-2 w-fit' src='/images/footer/x.svg' />
                          <span className='line-clamp-1'>@{userInfo?.xProfileUrl}</span>
                        </NeutralBadge>
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              <div className='mt-6 flex flex-wrap gap-8'>
                <TextHeading className='font-archia text-xl font-semibold lg:text-xl'>
                  <span className='text-neutral-500'>{t('veTHE Power')}</span>
                  <span className='ml-4'>{formatAmount(veTHEPower)}</span>
                </TextHeading>
                <TextHeading className='font-archia text-xl font-semibold lg:text-xl'>
                  <span className='text-neutral-500'>{t('Thena ID´s')}</span>
                  <span className='ml-4'>{userInfo?.usernameNfts?.length || 0}</span>
                </TextHeading>
                <TextHeading className='font-archia text-xl font-semibold lg:text-xl'>
                  <span className='text-neutral-500'>{t('Rank')}</span>
                  <span className='ml-4'>{userInfo?.rank}</span>
                </TextHeading>
              </div>

              <div className={cn('mt-10 flex items-center')}>
                {sortedData.slice(0, visibleCount).map(item => (
                  <AchievementBasicIcon
                    item={item}
                    key={item.achievement.id}
                    className='gap-0 p-0'
                    classNames={{ item: 'h-[65px] w-[65px]' }}
                  />
                ))}
              </div>

              <EmphasisButton className='mt-6 w-full' onClick={() => push('/arena/profile')}>
                {t('Manage')}
              </EmphasisButton>
            </div>

            <div className='flex flex-col gap-4 md:hidden'>
              <TextHeading className='flex items-center gap-2 font-archia text-xl font-semibold'>
                {userInfo?.username && <span className='text-warn-600'>{userInfo.username}</span>}
                <span className='text-neutral-500'>{formatAddress(account)}</span>
              </TextHeading>
              <Image
                alt='avatar'
                src={userInfo?.avatar?.replace('ipfs.io', 'w3s.link') ?? Avatar}
                className='mx-auto rounded-[20px]'
                width={124}
                height={124}
              />
              <EmphasisButton className='w-full max-md:h-8 max-md:text-xs' onClick={() => push('/arena/profile')}>
                {t('View')}
              </EmphasisButton>
            </div>
          </>
        )}
      </Box>

      <SectionDivider />
    </div>
  )
}

export default DashboardProfile
