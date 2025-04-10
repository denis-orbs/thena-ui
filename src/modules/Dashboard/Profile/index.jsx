import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Avatar from 'public/images/home/stats/socials/social-1.png'
import React, { useMemo } from 'react'
import useSWR from 'swr'

import { fetchAchievements } from '@/app/arena/profile/UserCompletedAchievements'
import Loading from '@/app/loading'
import { NeutralBadge } from '@/components/badges/Badge'
import Box from '@/components/box'
import { EmphasisButton } from '@/components/buttons/Button'
import NextImage from '@/components/image/NextImage'
import { NewTextHeading } from '@/components/typography'
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

  if (isLoading || !userInfo) {
    return <Loading />
  }

  return (
    <Box className='flex h-full flex-col gap-1.5 !p-4 max-md:mt-4 md:gap-6'>
      <NewTextHeading className='text-xl md:text-xl'>{t('My Profile')}</NewTextHeading>
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
            <NewTextHeading className='text-xl !leading-6 text-neutral-500 lg:text-xl'>
              {userInfo?.isVerified ? 'Verified' : 'Unverified'}
            </NewTextHeading>
            {userInfo?.username && (
              <NewTextHeading className='flex gap-2 text-xl !leading-6 lg:text-xl'>
                <span className='text-neutral-500'>{t('Thena ID')}:</span>
                <span className='text-warn-600'>{userInfo?.username}</span>
              </NewTextHeading>
            )}
            <NewTextHeading className='flex gap-2 text-xl !leading-6 lg:text-xl'>
              <span className='text-neutral-500'>{t('Wallet')}:</span>
              <span className='text-neutral-500'>{formatAddress(account)}</span>
            </NewTextHeading>
            {userInfo?.xProfileUrl && (
              <div className='flex gap-2'>
                <NewTextHeading className='text-xl !leading-6 text-neutral-500 lg:text-xl'>
                  {t('Socials')}:{' '}
                </NewTextHeading>
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
          <NewTextHeading className='text-xl lg:text-xl'>
            <span className='text-neutral-500'>{t('veTHE Power')}</span>
            <span className='ml-4'>{formatAmount(veTHEPower)}</span>
          </NewTextHeading>
          <NewTextHeading className='text-xl lg:text-xl'>
            <span className='text-neutral-500'>{t('Thena ID´s')}</span>
            <span className='ml-4'>{userInfo?.usernameNfts?.length || 0}</span>
          </NewTextHeading>
          <NewTextHeading className='text-xl lg:text-xl'>
            <span className='text-neutral-500'>{t('Rank')}</span>
            <span className='ml-4'>{userInfo?.rank}</span>
          </NewTextHeading>
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
        <NewTextHeading className='flex items-center gap-2 text-xl'>
          {userInfo?.username && <span className='text-warn-600'>{userInfo.username}</span>}
          <span className='text-neutral-500'>{formatAddress(account)}</span>
        </NewTextHeading>
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
    </Box>
  )
}

export default DashboardProfile
