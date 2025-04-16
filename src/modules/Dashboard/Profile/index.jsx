import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Avatar from 'public/images/home/stats/socials/social-1.png'
import React, { useMemo } from 'react'
import useSWR from 'swr'

import { fetchAchievements } from '@/app/arena/profile/UserCompletedAchievements'
import { NeutralBadge } from '@/components/badges/Badge'
import Box from '@/components/box'
import { EmphasisButton } from '@/components/buttons/Button'
import NextImage from '@/components/image/NextImage'
import Skeleton from '@/components/skeleton'
import { Paragraph, TextHeading } from '@/components/typography'
import { fetchUserInfo } from '@/context/userInfoContext'
import { useVeTHEsContext } from '@/context/veTHEsContext'
import useWallet from '@/hooks/useWallet'
import { cn, formatAddress, formatAmount, sortAchievements } from '@/lib/utils'
import AchievementBasicIcon from '@/modules/Achievements/AchievementBasicIcon'

function DashboardProfile() {
  const t = useTranslations()
  const { push } = useRouter()
  const { account } = useWallet()
  const { veTHEs } = useVeTHEsContext()
  const { data: userInfo, isLoading } = useSWR(['user info', account], () => fetchUserInfo(account), {
    refreshInterval: 60000,
  })
  const { data: userAchievementsCompleted } = useSWR(['userAchievementsCompleted', account], () =>
    fetchAchievements(account.toLowerCase()),
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

  return !isLoading && !userInfo ? (
    <Box className='flex h-full flex-col gap-1.5 !p-4 max-md:mt-4 md:gap-6'>
      <div className='my-16 flex flex-col gap-2 text-center'>
        <TextHeading>{t('Account not available')}</TextHeading>
        <Paragraph className='text-sm'>{t('Your account not available')}</Paragraph>
      </div>
    </Box>
  ) : (
    <Box className='flex h-full flex-col gap-1.5 !p-4 max-md:mt-4 md:gap-6'>
      <TextHeading className='font-archia text-xl font-semibold md:text-xl'>{t('My Profile')}</TextHeading>
      {isLoading ? (
        <Skeleton className='h-full w-full' />
      ) : (
        <>
          <div className='hidden h-full flex-col justify-between md:flex'>
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
                <TextHeading className='font-archia text-xl font-semibold !leading-6 text-neutral-500 lg:text-xl'>
                  {userInfo?.isVerified ? 'Verified' : 'Unverified'}
                </TextHeading>
                {userInfo?.username && (
                  <TextHeading className='flex gap-2 font-archia text-xl font-semibold !leading-6 lg:text-xl'>
                    <span className='text-neutral-500'>{t('Thena ID')}:</span>
                    <span className='text-warn-600'>{userInfo?.username}</span>
                  </TextHeading>
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

            {sortedData.length && (
              <div className={cn('mt-10 flex flex-wrap items-center')}>
                {sortedData.map(item => (
                  <AchievementBasicIcon item={item} key={item.achievement.id} className='gap-0 p-0' />
                ))}
              </div>
            )}

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
            <EmphasisButton className='w-full' onClick={() => push('/arena/profile')}>
              {t('View')}
            </EmphasisButton>
          </div>
        </>
      )}
    </Box>
  )
}

export default DashboardProfile
