'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'
import Avatar from 'public/images/home/stats/socials/social-1.png'
import { useCallback, useMemo } from 'react'

import Box from '@/components/box'
import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import { TextHeading, TextSubHeading } from '@/components/typography'
import { useCurrentUserFollow, useFollow } from '@/hooks/useUserFollow'

export function FollowedProfileItem({ user }) {
  const t = useTranslations()

  const { followUser } = useFollow(user?.id)

  const onFollow = useCallback(async () => {
    await followUser()
  }, [followUser])

  const { following } = useCurrentUserFollow()

  const isFollowed = useMemo(() => following?.find(follow => follow?.user?.id === user.id), [following, user.id])

  return (
    <Box className='group/item flex cursor-pointer items-center justify-between gap-5 p-4 lg:p-4'>
      <div className='flex items-center gap-5'>
        <Image alt='avatar' src={Avatar} className='h-10 w-10 rounded-full' width={40} height={40} />
        <div className='flex flex-col gap-1'>
          <TextHeading className='text-nowrap text-base'>First last</TextHeading>
          <TextSubHeading className='text-sm'>address</TextSubHeading>
        </div>
      </div>
      {isFollowed ? (
        <EmphasisButton className='invisible px-2 py-1 text-base group-hover/item:visible' onClick={onFollow}>
          {t('UnFollow')}
        </EmphasisButton>
      ) : (
        <PrimaryButton className='invisible px-2 py-1 text-base group-hover/item:visible' onClick={onFollow}>
          {t('Follow')}
        </PrimaryButton>
      )}
    </Box>
  )
}
