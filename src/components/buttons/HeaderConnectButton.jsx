'use client'

import { useAccountModal, useChainModal, useConnectModal } from '@rainbow-me/rainbowkit'
import { useTranslations } from 'next-intl'
import { useEffect } from 'react'
import useSWR from 'swr'

import { fetchUserInfo } from '@/app/arena/UserInfoContext'
import { ThenaAuthToken } from '@/constant'
import { useSignWallet } from '@/hooks/useSignWallet'
import { useSpaceIdBNB } from '@/hooks/useSpaceIdBNB'
import useWallet from '@/hooks/useWallet'
import { getFromLocalStorage } from '@/lib/helper'
import cn from '@/utils/classes'
import { formatAddress } from '@/utils/utils'

import PowerIcon from '~/svgs/power-icon.svg'

import { EmphasisButton, PrimaryButton, SecondaryButton } from './Button'
import NextImage from '../image/NextImage'

export default function HeaderConnectButton({ className, isMobile = false, isMini = false }) {
  const { openConnectModal } = useConnectModal()
  const { openAccountModal } = useAccountModal()
  const { openChainModal } = useChainModal()
  const { account, isWrong, active } = useWallet()
  const t = useTranslations()

  const { spaceIdName } = useSpaceIdBNB(account)
  // const [walletURL, setWalletURL] = useState(null) // Change type to string | null
  // const [isIframeVisible, setIsIframeVisible] = useState(false)

  // const fetchWalletUrl = async () => {
  //   try {
  //     if (!isIframeVisible) {
  //       const url = buildWalletUrl()
  //       setWalletURL(url)
  //     }
  //     setIsIframeVisible(!isIframeVisible)
  //   } catch (error) {
  //     console.error('Error building wallet URL:', error)
  //   }
  // }

  const { data: userInfo } = useSWR(account ? ['fetchUserInfo', account] : null, () => fetchUserInfo(account), {
    refreshInterval: 60000,
  })

  const { deleteToken } = useSignWallet()

  useEffect(() => {
    if (!active && !account && getFromLocalStorage(ThenaAuthToken)) {
      deleteToken()
    }
  }, [active, account, deleteToken])

  if (isWrong) {
    return (
      <SecondaryButton className={className} onClick={() => openChainModal()}>
        {t('Wrong Network')}
      </SecondaryButton>
    )
  }

  if (userInfo || account) {
    return (
      <EmphasisButton
        className={className}
        onClick={() => {
          openAccountModal()
        }}
      >
        <NextImage
          className={cn('size-4 cursor-pointer rounded-full lg:size-5', isMobile && '!size-5')}
          alt='wallet icon'
          src={userInfo?.avatar?.replace('ipfs.io', 'ipfs.io') ?? '/svgs/wallet-fold.svg'}
        />
        <span
          style={{
            color: userInfo?.nameColor ? (String(userInfo?.nameColor).startsWith('#') ? userInfo?.nameColor : '') : '',
          }}
        >
          {userInfo?.username || spaceIdName || formatAddress(account)}
        </span>
      </EmphasisButton>
    )
  }

  return (
    <PrimaryButton className={cn('leading-5', className)} onClick={() => openConnectModal()}>
      {isMini ? <PowerIcon className='!size-4' /> : t('Connect Wallet')}
    </PrimaryButton>
  )
}
