'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'
import Avatar from 'public/images/home/stats/socials/social-1.png'
import { useCallback, useMemo } from 'react'

import Box from '@/components/box'
import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import { TextHeading, TextSubHeading } from '@/components/typography'
import { useCurrentUserFollow, useFollow } from '@/hooks/useUserFollow'
import { formatAddress } from '@/lib/utils'
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
        <Image alt='avatar' src={Avatar} className='h-10 w-10 rounded-full' width={40} height={40} />
        <div className='flex flex-col gap-1'>
          <TextHeading className='text-nowrap text-base'>First last</TextHeading>
          <TextSubHeading className='text-sm'>{formatAddress(user.user.id)}</TextSubHeading>
        </div>
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
