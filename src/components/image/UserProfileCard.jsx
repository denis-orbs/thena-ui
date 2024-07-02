import Link from 'next/link'
import { useTranslations } from 'next-intl'
import Avatar from 'public/images/home/stats/socials/social-1.png'
import React, { useCallback, useMemo, useState } from 'react'

import { useUserInfo } from '@/context/userInfoContext'
import { useCurrentUserFollow, useFollow } from '@/hooks/useUserFollow'
import { cn, sliceAddress } from '@/lib/utils'
import useWallet from '@/lib/wallets/useWallet'
import { VerifyPopover } from '@/modules/Profile/VerifyPopover'

import CircleImage from './CircleImage'
import { EmphasisButton } from '../buttons/Button'
import Spinner from '../spinner'
import Tag from '../tag'
import { TextHeading } from '../typography'

export function UserProfileCard({
  user,
  showVerified = false,
  disableLink = false,
  enableFollow = true,
  userClassName,
  avatarSize = 'size-8',
}) {
  const { avatar, username, id, nameColor, checkMarkIcon, isAdmin, isSuperAdmin, verifiedAt } = user
  const t = useTranslations()
  const { userInfo } = useUserInfo()
  const { account } = useWallet()
  const { followUser } = useFollow(id, username)
  const isOwnProfile = useMemo(() => id.toLowerCase() === account?.toLowerCase(), [account, id])

  const { following } = useCurrentUserFollow()
  const isFollowed = useMemo(() => following?.find(follow => follow?.user?.id === id.toLowerCase()), [following, id])
  const [loading, setLoading] = useState(false)
  const LinkComponent = useCallback(
    ({ children }) => {
      if (disableLink) return <div className='flex cursor-pointer items-center justify-center gap-2'>{children}</div>
      return (
        <Link
          className='flex cursor-pointer items-center justify-center gap-2'
          href={`/arena/profile/${username ? encodeURIComponent(username.toLowerCase()) : id.toLowerCase()}`}
        >
          {children}
        </Link>
      )
    },
    [disableLink, id, username],
  )

  const onFollow = useCallback(async () => {
    setLoading(true)
    setTimeout(async () => {
      await followUser(() => {
        setLoading(false)
      })
    }, 1000)
  }, [followUser])

  return (
    <div className='flex items-center gap-1'>
      <LinkComponent>
        <CircleImage src={avatar?.replace('ipfs.io', 'w3s.link') ?? Avatar} alt='avatar' className={avatarSize} />
        <div className='mr-1 flex flex-col gap-1'>
          <TextHeading
            className={cn(
              'text-nowrap text-base',
              nameColor && !String(nameColor).startsWith('#') ? nameColor : '',
              userClassName,
            )}
          >
            <span
              style={{
                color: nameColor ? (String(nameColor).startsWith('#') ? nameColor : '') : '',
              }}
            >
              {sliceAddress(username || id)}
            </span>
          </TextHeading>
        </div>
        {showVerified && <VerifyPopover verifyImage={checkMarkIcon} verifiedAt={verifiedAt} />}
        {isAdmin && <Tag>{t('Admin')}</Tag>}
        {isSuperAdmin && <Tag>{t('Super Admin')}</Tag>}
      </LinkComponent>
      {enableFollow && !isOwnProfile && userInfo && (
        <div>
          <EmphasisButton className='p-1 text-xs lg:p-1 lg:px-2 lg:text-xs' onClick={onFollow} disabled={loading}>
            {!loading ? t(isFollowed ? 'UnFollow' : 'Follow') : <Spinner />}
          </EmphasisButton>
        </div>
      )}
    </div>
  )
}
