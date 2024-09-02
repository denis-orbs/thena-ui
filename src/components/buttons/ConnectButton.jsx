'use client'

import { getLatestAuthType } from '@particle-network/auth-core'
import { useAuthCore } from '@particle-network/auth-core-modal'
import { useAccountModal, useChainModal, useConnectModal } from '@rainbow-me/rainbowkit'
import { useTranslations } from 'next-intl'
import { useEffect } from 'react'
import useSWR from 'swr'

import { ThenaAuthToken } from '@/constant'
import { fetchUserInfo } from '@/context/userInfoContext'
import { useSignWallet } from '@/hooks/useSignWallet'
import useWallet from '@/hooks/useWallet'
import { getFromLocalStorage } from '@/lib/helper'
import { formatAddress } from '@/lib/utils'

import { EmphasisButton, PrimaryButton, SecondaryButton } from './Button'
import NextImage from '../image/NextImage'

export default function ConnectButton({ className }) {
  const { openConnectModal } = useConnectModal()
  const { openAccountModal } = useAccountModal()
  const { openChainModal } = useChainModal()
  const { account, isWrong, active } = useWallet()
  const t = useTranslations()
  const { openWallet } = useAuthCore()
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
    const auth = getLatestAuthType()
    return auth ? (
      <div className={`flex items-center space-x-2 ${className}`}>
        <EmphasisButton
          className={className}
          onClick={() => {
            openAccountModal()
          }}
        >
          {formatAddress(account)}
        </EmphasisButton>
        <NextImage
          className='h-[20px] w-[20px] cursor-pointer'
          alt='particle icon'
          src='/images/socials/particle-logo.png'
          onClick={() => {
            openWallet({
              windowSize: 'small',
              topMenuType: 'close',
            })
          }}
        />
      </div>
    ) : (
      <EmphasisButton
        className={className}
        onClick={() => {
          openAccountModal()
        }}
      >
        <span
          style={{
            color: userInfo?.nameColor ? (String(userInfo?.nameColor).startsWith('#') ? userInfo?.nameColor : '') : '',
          }}
        >
          {userInfo?.username || formatAddress(account)}
        </span>
      </EmphasisButton>
    )
  }

  return (
    <PrimaryButton className={className} onClick={() => openConnectModal()}>
      {t('Connect Wallet')}
    </PrimaryButton>
  )
}
