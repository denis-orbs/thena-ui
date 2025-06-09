import { gql } from 'graphql-request'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useMemo, useState } from 'react'

import ShareProfileStatsModal from '@/app/arena/profile/ShareProfileStatsModal'
import { EmphasisButton } from '@/components/buttons/Button'
import { EmphasisIconButton } from '@/components/buttons/IconButton'
import Spinner from '@/components/spinner'
import { useUserInfo } from '@/context/userInfoContext'
import { useCurrentUserFollow, useFollow } from '@/hooks/useUserFollow'
import useWallet from '@/hooks/useWallet'
import { v4Client } from '@/lib/graphql'
import { successToast } from '@/lib/notify'
import { CheckIcon, PublicIcon, ShareProfileIcon } from '@/svgs'

const V4_USER_INFO = gql`
  query V4_USER_USERNAME($id: String!) {
    userById(id: $id) {
      id
      username
    }
  }
`

export function ProfileButton({ isOwnProfile, userInfo, handleClickThenaButton, hasThenaId, username = null }) {
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const { account } = useWallet()
  const t = useTranslations()
  const [currentUserRef, setCurrentUserRef] = useState('')
  const [openShareProfileStatsModal, setOpenShareProfileStatsModal] = useState(false)

  useEffect(() => {
    async function getUserRef() {
      try {
        if (account) {
          const { userById } = await v4Client.request(V4_USER_INFO, { id: account.toLowerCase() })
          if (userById && userById.username) {
            setCurrentUserRef(userById.username)
          } else {
            setCurrentUserRef(account.toLowerCase())
          }
        }
      } catch (_) {
        setCurrentUserRef('')
      }
    }

    getUserRef()
  }, [account])

  const onShare = useCallback(async () => {
    let link = isOwnProfile ? `${window.location.href}/${userInfo.username ?? userInfo.id}` : window.location.href
    if (currentUserRef) {
      const urlLink = new URL(link)
      urlLink.searchParams.set('r', currentUserRef)
      link = urlLink.toString()
    }

    navigator.clipboard.writeText(link)
    setCopied(true)
    successToast(t('Link Has Been Copied'))
  }, [isOwnProfile, userInfo.username, userInfo.id, currentUserRef, t])

  const shareIconButton = useMemo(() => (copied ? CheckIcon : PublicIcon), [copied])
  const { following } = useCurrentUserFollow()
  const { userInfo: currentUserInfo } = useUserInfo()

  const isFollowed = useMemo(
    () => following?.find(follow => follow?.user?.id === userInfo.id),
    [following, userInfo.id],
  )

  const { followUser } = useFollow(userInfo.id, username, isFollowed)

  const onFollow = useCallback(async () => {
    setLoading(true)
    setTimeout(async () => {
      await followUser(() => {
        setLoading(false)
      })
    }, 1000)
  }, [followUser])

  useEffect(() => {
    if (copied) {
      const timeOut = setTimeout(() => setCopied(false), 2000)

      return () => clearTimeout(timeOut)
    }
  }, [copied])

  return (
    <div className='flex items-center justify-end gap-2'>
      {isOwnProfile && !!currentUserInfo?.usernameNfts?.length && (
        <Link href='/arena/profile/edit'>
          <EmphasisButton className='p-2 text-xs lg:py-3 lg:text-base'>{t('Edit Profile')}</EmphasisButton>
        </Link>
      )}
      <EmphasisButton
        onClick={() => handleClickThenaButton(isOwnProfile ? 'get' : 'gift')}
        className='animate-gradient bg-linear-to-r from-[#B386FF] to-[#FF86FA] p-2 text-xs lg:py-3 lg:text-base'
      >
        {t(isOwnProfile ? (!hasThenaId ? 'Get ID' : 'Get More IDs') : 'Gift Thena ID')}
      </EmphasisButton>
      {!isOwnProfile && currentUserInfo && (
        <EmphasisButton className='p-2 text-xs lg:p-3 lg:py-3 lg:text-base' onClick={onFollow} disabled={loading}>
          {!loading ? t(isFollowed ? 'UnFollow' : 'Follow') : <Spinner />}
        </EmphasisButton>
      )}
      {isOwnProfile && (
        <EmphasisIconButton
          Icon={ShareProfileIcon}
          onClick={() => {
            setOpenShareProfileStatsModal(true)
          }}
        />
      )}
      <EmphasisIconButton Icon={shareIconButton} onClick={onShare} />
      {openShareProfileStatsModal && (
        <ShareProfileStatsModal
          isOpen={openShareProfileStatsModal}
          userInfo={userInfo}
          onClose={() => {
            setOpenShareProfileStatsModal(false)
          }}
        />
      )}
    </div>
  )
}
