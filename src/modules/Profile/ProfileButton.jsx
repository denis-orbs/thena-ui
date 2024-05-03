import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { EmphasisButton } from '@/components/buttons/Button'
import { EmphasisIconButton } from '@/components/buttons/IconButton'
import Spinner from '@/components/spinner'
import { useUserInfo } from '@/context/userInfoContext'
import { useCurrentUserFollow, useFollow } from '@/hooks/useUserFollow'
import { successToast } from '@/lib/notify'
import { CheckIcon, PublicIcon } from '@/svgs'

export function ProfileButton({ isOwnProfile, userInfoId, handleClickThenaButton, username = null }) {
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)

  const t = useTranslations()
  const onShare = useCallback(() => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    successToast(t('Link Has Been Copied'))
  }, [t])

  const shareIconButton = useMemo(() => (copied ? CheckIcon : PublicIcon), [copied])
  const { following } = useCurrentUserFollow()
  const { userInfo } = useUserInfo()

  const isFollowed = useMemo(() => following?.find(follow => follow?.user?.id === userInfoId), [following, userInfoId])

  const { followUser } = useFollow(userInfoId, username, isFollowed)

  const onFollow = useCallback(async () => {
    setLoading(true)
    setTimeout(async () => {
      await followUser()
      setLoading(false)
    }, 1000)
  }, [followUser])

  useEffect(() => {
    if (copied) {
      const timeOut = setTimeout(() => setCopied(false), 2000)

      return () => clearTimeout(timeOut)
    }
  }, [copied])

  return (
    <div className='flex items-center space-x-2'>
      {isOwnProfile && !!userInfo?.usernameNfts?.length && (
        <Link href='/arena/profile/edit'>
          <EmphasisButton className='p-2 text-xs lg:py-3 lg:text-base'>{t('Edit Profile')}</EmphasisButton>
        </Link>
      )}
      <EmphasisButton
        onClick={() => handleClickThenaButton(isOwnProfile ? 'get' : 'gift')}
        className='p-2 text-xs lg:py-3 lg:text-base'
      >
        {t(isOwnProfile ? 'Gift ID' : 'Gift Thena ID')}
      </EmphasisButton>
      {!isOwnProfile && userInfo && (
        <EmphasisButton
          className='min-h-12 min-w-[92px] p-2 text-xs lg:p-3 lg:text-base'
          onClick={onFollow}
          disabled={loading}
        >
          {!loading ? t(isFollowed ? 'UnFollow' : 'Follow') : <Spinner />}
        </EmphasisButton>
      )}
      <EmphasisIconButton Icon={shareIconButton} onClick={onShare} />
    </div>
  )
}
