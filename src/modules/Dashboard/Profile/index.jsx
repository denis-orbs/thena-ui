import dayjs from 'dayjs'
import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useRouter } from 'nextjs-toploader/app'
import React, { useMemo } from 'react'
import useSWR from 'swr'

import { fetchAchievements } from '@/app/arena/profile/UserCompletedAchievements'
import { fetchUserInfo } from '@/app/arena/UserInfoContext'
import { useVeTHEsContext } from '@/app/dashboard/VeTHEsContext'
import Box from '@/components/box'
import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import NextImage from '@/components/image/NextImage'
import Skeleton from '@/components/skeleton'
import { NewTextHeading, Paragraph, TextHeading } from '@/components/typography'
import { fetchFollower, fetchFollowing } from '@/hooks/useUserFollow'
import useWallet from '@/hooks/useWallet'
import AchievementBasicIcon from '@/modules/Achievements/AchievementBasicIcon'
import cn from '@/utils/classes'
import { formatAddress, formatAmount, sortAchievements } from '@/utils/utils'

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

  const { data: following } = useSWR(['following', account], () => fetchFollowing(account.toLowerCase()), {
    refreshInterval: 60000,
  })

  const { data: followers } = useSWR(['followers', account], () => fetchFollower(account.toLowerCase()), {
    refreshInterval: 60000,
  })

  const followingCount = useMemo(() => following?.length ?? '-', [following?.length])

  const followersCount = useMemo(() => followers?.length ?? '-', [followers?.length])

  return (
    <div
      className={cn(
        'rounded-xl max-md:mb-16 md:col-span-2',
        (!userInfo || !userInfo.usernameNfts?.length) &&
          'bg-[url("/images/profile-bg.png")] bg-cover bg-center bg-no-repeat p-4 md:col-span-1',
      )}
    >
      <Box
        className={cn(
          'flex h-full flex-col gap-1.5 p-0! md:gap-6',
          (!userInfo || !userInfo.usernameNfts?.length) && 'bg-transparent',
        )}
      >
        {isLoading ? (
          <Skeleton className='h-[428px] w-full' />
        ) : !userInfo || !userInfo.usernameNfts?.length ? (
          <div className='flex h-full flex-col justify-between gap-4'>
            <div className='flex flex-col gap-4'>
              <div className='flex h-[130px] flex-col justify-end'>
                <NewTextHeading className='text-gradient-primary-b text-5xl leading-tight md:text-5xl'>
                  {t('Mint your ID')}
                </NewTextHeading>
              </div>

              <div className='flex flex-col gap-2'>
                <NewTextHeading className='text-xl md:text-xl'>{t('Account not available title')}</NewTextHeading>
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

              <PrimaryButton className='w-full max-md:h-8 max-md:text-xs' onClick={() => push('/arena/thena-id/mint')}>
                GET THENA ID
              </PrimaryButton>
            </div>
          </div>
        ) : (
          <>
            <div className='hidden h-full flex-col justify-between md:flex'>
              <div className='flex h-full'>
                <div
                  className='flex min-h-[432px] flex-col justify-between rounded-l-xl bg-cover bg-center bg-no-repeat pb-4 md:w-[211px]!'
                  style={{
                    backgroundImage: `url('${
                      userInfo?.avatar?.replace('ipfs.io', 'w3s.link') || '/images/profile-bg.png'
                    }')`,
                  }}
                >
                  <NewTextHeading
                    className={cn(
                      'w-full rounded-tl-xl p-4 text-3xl md:text-3xl',
                      userInfo?.avatar && 'bg-linear-to-b from-black/60 to-[#666666]/0',
                    )}
                  >
                    {t('My Profile')}
                  </NewTextHeading>
                  <Link href='/arena/profile' className='mx-2'>
                    <EmphasisButton className='w-full'>{t('Manage')}</EmphasisButton>
                  </Link>
                </div>

                <div className='flex h-full flex-1 flex-col justify-between gap-4 p-4 max-md:hidden'>
                  <div className='flex flex-col gap-4'>
                    {userInfo?.username && (
                      <NewTextHeading className='flex gap-2 py-2.5 text-xl leading-6! uppercase md:text-xl'>
                        <span className='text-neutral-500'>{t('Thena ID')}:</span>
                        <span className='text-warn-600'>{userInfo.username}</span>
                      </NewTextHeading>
                    )}
                    <div className='flex flex-col gap-2'>
                      <TextHeading className='font-archia flex h-10 items-center gap-2 text-xl leading-6! font-semibold lg:text-xl'>
                        <NewTextHeading className='text-xl text-neutral-500 md:text-xl'>
                          {userInfo?.isVerified ? 'Verified' : 'Unverified'}
                        </NewTextHeading>
                        <span className='text-neutral-500'>{formatAddress(account)}</span>
                      </TextHeading>
                      <div className='flex h-10 flex-wrap items-center gap-4'>
                        <TextHeading className='font-archia text-xl font-semibold'>
                          <span className='text-neutral-500'>{t('Follower')}</span>
                          <span className='ml-2'>{followersCount}</span>
                        </TextHeading>
                        <TextHeading className='font-archia text-xl font-semibold'>
                          <span className='text-neutral-500'>{t('Following')}</span>
                          <span className='ml-2'>{followingCount}</span>
                        </TextHeading>
                      </div>
                      <div className='flex min-h-10 flex-wrap items-center gap-8'>
                        <TextHeading className='font-archia text-xl font-semibold lg:text-xl'>
                          <span className='text-neutral-500'>{t('veTHE Power')}</span>
                          <span className='ml-4'>{formatAmount(veTHEPower)}</span>
                        </TextHeading>
                        <TextHeading className='font-archia text-xl font-semibold lg:text-xl'>
                          <span className='text-neutral-500'>{t('Thena ID(s)')}</span>
                          <span className='ml-4'>{userInfo?.usernameNfts?.length || 0}</span>
                        </TextHeading>
                        <TextHeading className='font-archia text-xl font-semibold lg:text-xl'>
                          <span className='text-neutral-500'>{t('Rank')}</span>
                          <span className='ml-4'>{userInfo?.rank}</span>
                        </TextHeading>
                      </div>
                      {userInfo?.xProfileUrl && (
                        <div className='flex h-11 w-full items-center gap-2'>
                          <TextHeading className='font-archia text-xl leading-6! font-semibold text-neutral-500 lg:text-xl'>
                            {t('Socials')}:{' '}
                          </TextHeading>
                          <Link
                            href={`https://x.com/${userInfo?.xProfileUrl}`}
                            rel='nofollow noopener size-8'
                            target='_blank'
                          >
                            <div className='flex size-8 items-center justify-center rounded-md bg-neutral-700'>
                              <NextImage alt='svg' className='size-4' src='/images/footer/x.svg' />
                            </div>
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={cn('flex flex-wrap items-center gap-2 overflow-hidden', 'max-h-[138px]')}>
                    {sortedData.map(item => (
                      <AchievementBasicIcon
                        item={item}
                        key={item.achievement.id}
                        className='gap-0 p-0'
                        classNames={{ item: 'h-[65px] w-[65px]' }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className='flex flex-col gap-4 p-4 md:hidden'>
              <div className='gap-1.5'>
                <NewTextHeading className='text-xl'>{t('My Profile')}</NewTextHeading>
                <TextHeading className='font-archia flex items-center gap-2 text-xl font-semibold'>
                  {userInfo?.username && <span className='text-warn-600'>{userInfo.username}</span>}
                  <span className='text-neutral-500'>{formatAddress(account)}</span>
                </TextHeading>
              </div>
              <Image
                alt='avatar'
                src={userInfo?.avatar?.replace('ipfs.io', 'w3s.link') ?? '/images/home/stats/socials/social-1.png'}
                className='mx-auto rounded-full'
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

      <SectionDivider className='mt-4' />
    </div>
  )
}

export default DashboardProfile
