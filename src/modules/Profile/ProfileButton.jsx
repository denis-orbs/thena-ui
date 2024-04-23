import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { EmphasisButton } from '@/components/buttons/Button'
import { EmphasisIconButton } from '@/components/buttons/IconButton'
import { useCurrentUserFollow, useFollow } from '@/hooks/useUserFollow'
import { successToast } from '@/lib/notify'
import { CheckIcon, PublicIcon } from '@/svgs'

export function ProfileButton({ isOwnProfile, userInfoId }) {
  const [copied, setCopied] = useState(false)
  const t = useTranslations()
  const onShare = useCallback(() => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    successToast(t('Link Has Been Copied'))
  }, [t])

  const shareIconButton = useMemo(() => (copied ? CheckIcon : PublicIcon), [copied])
  const { following } = useCurrentUserFollow()

  const { followUser } = useFollow(userInfoId)

  const isFollowed = useMemo(() => following?.find(follow => follow?.user?.id === userInfoId), [following, userInfoId])

  const onFollow = useCallback(async () => {
    await followUser()
  }, [followUser])

  useEffect(() => {
    if (copied) {
      const timeOut = setTimeout(() => setCopied(false), 2000)

      return () => clearTimeout(timeOut)
    }
  }, [copied])

  return (
    <div className='flex items-center space-x-2'>
      {isOwnProfile ? (
        <>
          <Link href='/arena/profile/edit'>
            <EmphasisButton className='p-2 text-xs lg:py-3 lg:text-base'>{t('Edit Profile')}</EmphasisButton>
          </Link>
          <EmphasisButton className='p-2 text-xs lg:py-3 lg:text-base'>{t('Send THENA ID')}</EmphasisButton>
        </>
      ) : (
        <EmphasisButton className='p-2 text-xs lg:p-3 lg:text-base' onClick={onFollow}>
          {t(isFollowed ? 'UnFollow' : 'Follow')}
        </EmphasisButton>
      )}

      <EmphasisIconButton Icon={shareIconButton} onClick={onShare} />
    </div>
  )
}
