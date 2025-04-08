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
import Highlight from '@/components/highlight'
import NextImage from '@/components/image/NextImage'
import { Paragraph, TextHeading, TextSubHeading } from '@/components/typography'
import { fetchUserInfo } from '@/context/userInfoContext'
import useWallet from '@/hooks/useWallet'
import { formatAddress, sortAchievements } from '@/lib/utils'
import AchievementBasicIcon from '@/modules/Achievements/AchievementBasicIcon'
import { InfoCircleWhite } from '@/svgs'

function DashBoardProfile() {
  const t = useTranslations()
  const { push } = useRouter()
  const { account } = useWallet()
  const { data: userInfo, isLoading } = useSWR(['user info', account], () => fetchUserInfo(account), {
    refreshInterval: 60000,
  })

  const { data: userAchievementsCompleted, isLoading: loadingAchievements } = useSWR(
    ['userAchievementsCompleted', account],
    () => fetchAchievements(account.toLowerCase()),
  )

  console.log({ loadingAchievements })

  const sortedData = useMemo(() => {
    if (Array.isArray(userAchievementsCompleted) && userAchievementsCompleted.length) {
      return userAchievementsCompleted.sort(sortAchievements)
    }

    return []
  }, [userAchievementsCompleted])

  if (isLoading || !userInfo) {
    return <Loading />
  }
  return (
    <Box className='flex h-full flex-col gap-1.5 max-md:mt-4 md:gap-6'>
      <TextHeading className='font-archia text-xl font-semibold'>{t('My Profile')}</TextHeading>
      <div className='hidden h-full flex-col justify-between md:flex'>
        <div className='flex gap-4'>
          <Image
            alt='avatar'
            src={userInfo?.avatar?.replace('ipfs.io', 'w3s.link') ?? Avatar}
            className='rounded-[36px]'
            width={145}
            height={145}
          />
          <div className='flex flex-col gap-4'>
            <TextSubHeading className='font-archia text-xl font-semibold'>
              {userInfo?.isVerified ? 'Verified' : 'Unverified'}
            </TextSubHeading>
            {userInfo?.username && (
              <TextSubHeading className='font-archia text-xl font-semibold'>
                {t('Thena ID')}: <span className='text-warn-600'>{userInfo?.username}</span>
              </TextSubHeading>
            )}
            <TextSubHeading className='font-archia text-xl font-semibold'>
              {`${t('Wallet')}: ${formatAddress(account)}`}
            </TextSubHeading>
            {userInfo?.xProfileUrl && (
              <div className='flex gap-8'>
                <TextSubHeading className='font-archia text-xl font-semibold'>{t('X profile')}: </TextSubHeading>
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
        <div className='flex flex-wrap gap-8'>
          <TextSubHeading className='font-archia text-xl font-semibold'>
            {t('veTHE Power')}
            <TextHeading className='ml-4'>TODO</TextHeading>
          </TextSubHeading>
          <TextSubHeading className='font-archia text-xl font-semibold'>
            {t('Thena ID´s')}
            <TextHeading className='ml-4'>{userInfo?.usernameNfts?.length || 0}</TextHeading>
          </TextSubHeading>
          <TextSubHeading className='font-archia text-xl font-semibold'>
            {t('Rank')}
            <TextHeading className='ml-4'>{userInfo?.rank}</TextHeading>
          </TextSubHeading>
        </div>
        <div className='flex flex-wrap items-center gap-4'>
          {Object.keys(sortedData).length ? (
            <>
              {sortedData.slice(0, 5).map(item => (
                <AchievementBasicIcon item={item} key={item.achievement.id} className='gap-0 p-0' />
              ))}
              {sortedData.length > 5 && (
                <div className='flex size-14 items-center justify-center rounded-full bg-primary-800 font-archia text-xl font-semibold text-primary-200'>
                  +{sortedData.length - 5}
                </div>
              )}
            </>
          ) : (
            <div className='px-6'>
              <div className='flex w-full flex-col items-center justify-center gap-4 '>
                <Highlight>
                  <InfoCircleWhite className='h-4 w-4' />
                </Highlight>
                <div className='flex w-72 flex-col items-center gap-3 lg:w-[416px]'>
                  <h2>{t('No Achievement found')}</h2>

                  <Paragraph className='mt-3 text-center'>{t('User Have Not Achievement Yet')}</Paragraph>
                </div>
              </div>
            </div>
          )}
        </div>
        <EmphasisButton className='w-full' onClick={() => push('/arena/profile')}>
          {t('Manage')}
        </EmphasisButton>
      </div>
      <div className='flex flex-col gap-4 md:hidden'>
        <TextSubHeading className='font-archia text-xl font-semibold'>
          {userInfo?.username && <span className='text-warn-600'>{userInfo.username}</span>} {formatAddress(account)}
        </TextSubHeading>
        <Image
          alt='avatar'
          src={userInfo?.avatar?.replace('ipfs.io', 'w3s.link') ?? Avatar}
          className='mx-auto rounded-full'
          width={124}
          height={124}
        />
      </div>
    </Box>
  )
}

export default DashBoardProfile
