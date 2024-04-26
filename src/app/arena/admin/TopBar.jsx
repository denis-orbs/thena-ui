'use client'

import { useWeb3Modal } from '@web3modal/wagmi/react'
import moment from 'moment'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import Avatar from 'public/images/home/stats/socials/social-1.png'
import React, { useCallback, useMemo, useState } from 'react'

import Box from '@/components/box'
import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import CircleImage from '@/components/image/CircleImage'
import Tag from '@/components/tag'
import { TextHeading, TextSubHeading } from '@/components/typography'
import { sliceAddress } from '@/lib/utils'
import useWallet from '@/lib/wallets/useWallet'
import { Verified } from '@/svgs'

import ThenaIdModal from '../profile/ThenaIdModal'

function TopBar({ userInfo }) {
  const { account } = useWallet()
  const t = useTranslations()
  const [thenaModalTab, setThenaModalTab] = useState()
  const { open: openConnectWallet } = useWeb3Modal()
  const isOwnProfile = useMemo(() => userInfo.id.toLowerCase() === account?.toLowerCase(), [account, userInfo?.id])
  const hasThenaId = useMemo(() => userInfo?.usernameNfts?.length, [userInfo?.usernameNfts?.length])

  const handleClickThenaButton = useCallback(
    (tab = 'get') => {
      if (!account) {
        openConnectWallet()
      }
      setThenaModalTab(tab)
    },
    [account, openConnectWallet],
  )

  return userInfo && userInfo.id ? (
    <Box className='flex flex-col-reverse md:flex-row md:justify-between'>
      <div className='flex flex-row items-start gap-4 md:items-center'>
        <CircleImage src={Avatar} alt='avatar' className='size-14 md:size-[124px]' />
        <div className='flex flex-col gap-2 md:gap-3'>
          <div className='flex flex-col gap-1 md:flex-row md:items-center md:gap-3'>
            <div className='flex flex-row items-center gap-3'>
              <TextHeading className='text-xl md:text-3xl'>{sliceAddress(userInfo.id)}</TextHeading>
              {userInfo.isVerified && (
                <div className='size-4 md:size-5'>
                  <Verified />
                </div>
              )}
            </div>
            {userInfo.isSuperAdmin ? <Tag>Super admin</Tag> : <Tag>Admin</Tag>}
          </div>
          <TextSubHeading>
            Joined {moment(userInfo.firstInteractAt).utc().format('ll')} at{' '}
            {moment(userInfo.firstInteractAt).utc().format('LT')} +3 UTC
          </TextSubHeading>
          {/* <TextSubHeading>Joined Jan 24, 2024 at 11:40 AM +3 UTC</TextSubHeading> */}
        </div>
      </div>
      <div className='flex flex-row justify-end'>
        {Boolean(isOwnProfile && hasThenaId) && (
          <Link href='/arena/admin/edit'>
            <EmphasisButton className='text-base'>Edit profile</EmphasisButton>
          </Link>
        )}
        {isOwnProfile && !hasThenaId && (
          <div>
            <PrimaryButton className='ml-4 text-base text-black' onClick={() => handleClickThenaButton('get')}>
              {t('Get ID')}
            </PrimaryButton>
          </div>
        )}
        {!isOwnProfile && (
          <div>
            <PrimaryButton className='ml-4 text-base text-black' onClick={() => handleClickThenaButton('gift')}>
              {t('Gift Thena ID')}
            </PrimaryButton>
          </div>
        )}
        {thenaModalTab && (
          <ThenaIdModal
            tab={thenaModalTab}
            targetAddress={account?.toLowerCase() !== userInfo.id.toLowerCase() ? userInfo.id.toLowerCase() : undefined}
            onClose={() => setThenaModalTab(undefined)}
          />
        )}
      </div>
    </Box>
  ) : null
}

export default TopBar
