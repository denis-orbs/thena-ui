'use client'

import { useTranslations } from 'next-intl'
import { useCallback, useMemo } from 'react'

import Box from '@/components/box'
import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import { UserProfileCard } from '@/components/image/UserProfileCard'
import { useCurrentUserFollow, useFollow } from '@/hooks/useUserFollow'
import useWallet from '@/lib/wallets/useWallet'

export function FollowedProfileItem({ user }) {
  const t = useTranslations()
  const { account } = useWallet()

  const { followUser } = useFollow(user?.user.id)

  const { following } = useCurrentUserFollow()

  const onFollow = useCallback(async () => {
    await followUser()
  }, [followUser])

  const isFollowed = useMemo(
    () => following?.find(follow => follow?.user?.id === user.user.id),
    [following, user.user.id],
  )

  return (
    <Box className='group/item flex cursor-pointer items-center justify-between gap-5 p-4 lg:p-4'>
      <div className='flex items-center gap-5'>
        <UserProfileCard
          avatar={user?.user.avatar}
          id={user?.user.id}
          username={user?.user.username}
          showVerified={user?.user.isVerified}
          verifyImage={user?.user.checkMarkIcon}
          nameColor={user?.user.nameColor}
          enableFollow={false}
        />
      </div>
      {account &&
        (isFollowed ? (
          <EmphasisButton className='invisible px-2 py-1 text-base text-sm group-hover/item:visible' onClick={onFollow}>
            {t('UnFollow')}
          </EmphasisButton>
        ) : (
          <PrimaryButton className='invisible px-2 py-1 text-base text-sm group-hover/item:visible' onClick={onFollow}>
            {t('Follow')}
          </PrimaryButton>
        ))}
    </Box>
  )
}
