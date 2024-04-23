import { useWeb3Modal } from '@web3modal/wagmi/react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useMemo, useState } from 'react'

import ThenaIdModal from '@/app/arena/profile/ThenaIdModal'
import { EmphasisButton } from '@/components/buttons/Button'
import { EmphasisIconButton } from '@/components/buttons/IconButton'
import { useUserInfo } from '@/context/userInfoContext'
import { useCurrentUserFollow, useFollow } from '@/hooks/useUserFollow'
import { successToast } from '@/lib/notify'
import useWallet from '@/lib/wallets/useWallet'
import { CheckIcon, PublicIcon } from '@/svgs'

export function ProfileButton({ isOwnProfile, userInfoId }) {
  const [copied, setCopied] = useState(false)
  const [thenaModalTab, setThenaModalTab] = useState()
  const t = useTranslations()
  const onShare = useCallback(() => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    successToast(t('Link Has Been Copied'))
  }, [t])
  const { open: openConnectWallet } = useWeb3Modal()
  const { account } = useWallet()

  const shareIconButton = useMemo(() => (copied ? CheckIcon : PublicIcon), [copied])
  const { following } = useCurrentUserFollow()

  const { followUser } = useFollow(userInfoId)

  const { userInfo } = useUserInfo()

  const isFollowed = useMemo(() => following?.find(follow => follow?.user?.id === userInfoId), [following, userInfoId])

  const onFollow = useCallback(async () => {
    await followUser()
  }, [followUser])

  const handleClickThenaButton = useCallback(
    (tab = 'get') => {
      if (!account) {
        openConnectWallet()
      }
      setThenaModalTab(tab)
    },
    [account, openConnectWallet],
  )

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
          {!!userInfo?.usernameNfts?.length && (
            <Link href='/arena/profile/edit'>
              <EmphasisButton className='p-2 text-xs lg:py-3 lg:text-base'>{t('Edit Profile')}</EmphasisButton>
            </Link>
          )}
          <EmphasisButton onClick={() => handleClickThenaButton('gift')} className='p-2 text-xs lg:py-3 lg:text-base'>
            {t('Gift Thena ID')}
          </EmphasisButton>
        </>
      ) : (
        <EmphasisButton className='p-2 text-xs lg:p-3 lg:text-base' onClick={onFollow}>
          {t(isFollowed ? 'UnFollow' : 'Follow')}
        </EmphasisButton>
      )}

      {thenaModalTab && <ThenaIdModal tab={thenaModalTab} onClose={() => setThenaModalTab(undefined)} />}
      <EmphasisIconButton Icon={shareIconButton} onClick={onShare} />
    </div>
  )
}
