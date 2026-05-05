'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useCallback, useMemo } from 'react'

import Box from '@/components/box'
import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import CircleImage from '@/components/image/CircleImage'
import Tag from '@/components/tag'
import { TextHeading } from '@/components/typography'
import { useCurrentUserFollow, useFollow } from '@/hooks/useUserFollow'
import useWallet from '@/hooks/useWallet'
import { VerifyPopover } from '@/modules/Profile/VerifyPopover'
import cn from '@/utils/classes'
import { sliceAddress } from '@/utils/utils'

export function FollowedProfileItem({ user }) {
  const t = useTranslations()
  const { account } = useWallet()
  const searchParams = useSearchParams()
  const { followUser } = useFollow(user?.user?.id, user?.user?.username)

  const { following } = useCurrentUserFollow()

  const onFollow = useCallback(async () => {
    await followUser()
  }, [followUser])

  const isFollowed = useMemo(
    () => following?.find(follow => follow?.user?.id?.toLowerCase() === user?.user?.id?.toLowerCase()),
    [following, user?.user?.id],
  )

  const hightLight = useMemo(
    () => searchParams.get('user')?.toLowerCase() === user?.user?.id?.toLowerCase(),
    [searchParams, user?.user?.id],
  )

  const { avatar, username, id, nameColor, checkMarkIcon, isAdmin, isSuperAdmin, verifiedAt, isVerified } =
    user.user ?? {}

  return (
    <Box
      className={cn(
        'flex cursor-pointer items-center justify-between p-4 lg:p-4',
        hightLight ? 'animate-gradient bg-linear-to-r from-[#B386FF] to-[#FF86FA]' : '',
      )}
    >
      <Link
        className={cn('flex w-2/3 cursor-pointer items-center justify-start gap-1 md:gap-2')}
        href={`/arena/profile/${username ? encodeURIComponent(username?.toLowerCase()) : id?.toLowerCase()}`}
      >
        <CircleImage
          src={avatar?.replace('ipfs.io', 'ipfs.filebase.io') ?? '/images/home/stats/socials/social-1.png'}
          alt='avatar'
          className='size-8'
        />

        <TextHeading className={cn('text-base', nameColor && !String(nameColor).startsWith('#') ? nameColor : '')}>
          <span
            style={{
              color: nameColor ? (String(nameColor).startsWith('#') ? nameColor : '') : '',
            }}
          >
            {username || sliceAddress(id)}
          </span>
        </TextHeading>

        {isVerified && <VerifyPopover verifyImage={checkMarkIcon} verifiedAt={verifiedAt} />}
        {isAdmin && <Tag>{t('Admin')}</Tag>}
        {isSuperAdmin && <Tag>{t('Super Admin')}</Tag>}
      </Link>
      <div className='flex w-1/3 items-center justify-end'>
        {account &&
          account?.toLowerCase() !== user?.user?.id?.toLowerCase() &&
          (isFollowed ? (
            <EmphasisButton className='ml-1 px-2 py-1 text-sm' onClick={onFollow}>
              {t('UnFollow')}
            </EmphasisButton>
          ) : (
            <PrimaryButton className='ml-1 px-2 py-1 text-sm' onClick={onFollow}>
              {t('Follow')}
            </PrimaryButton>
          ))}
      </div>
    </Box>
  )
}
