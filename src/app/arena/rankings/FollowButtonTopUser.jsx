import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { EmphasisButton } from '@/components/buttons/Button'
import Spinner from '@/components/spinner'
import { useUserInfo } from '@/context/userInfoContext'
import { useCurrentUserFollow, useFollow } from '@/hooks/useUserFollow'
import useWallet from '@/hooks/useWallet'

export function FollowButtonTopUser({ userInfoId, username = null }) {
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const t = useTranslations()

  const { account } = useWallet()
  const { userInfo } = useUserInfo()
  const { following } = useCurrentUserFollow()

  const isOwnProfile = useMemo(() => userInfoId?.toLowerCase() === account?.toLowerCase(), [account, userInfoId])
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
    <div className='flex items-center gap-2'>
      {isOwnProfile ? (
        <></>
      ) : (
        userInfo && (
          <EmphasisButton
            className='min-h-12 min-w-[92px] p-2 text-xs lg:p-3 lg:text-base'
            onClick={() => {
              if (!loading) {
                onFollow()
              }
            }}
            disabled={loading}
          >
            {!loading ? t(isFollowed ? 'UnFollow' : 'Follow') : <Spinner />}
          </EmphasisButton>
        )
      )}
    </div>
  )
}
