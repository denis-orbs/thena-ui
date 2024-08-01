'use client'

import { getLatestAuthType, isSocialAuthType } from '@particle-network/auth-core'
import { useAuthCore } from '@particle-network/auth-core-modal'
import { useAccountModal, useChainModal, useConnectModal } from '@rainbow-me/rainbowkit'
import { useTranslations } from 'next-intl'
import React from 'react'

import useWallet from '@/hooks/useWallet'
import { formatAddress } from '@/lib/utils'

import { EmphasisButton, PrimaryButton, SecondaryButton } from './Button'
import NextImage from '../image/NextImage'

export default function ConnectButton({ className }) {
  const { openConnectModal } = useConnectModal()
  const { openAccountModal } = useAccountModal()
  const { openChainModal } = useChainModal()
  const { account, isWrong } = useWallet()
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

  if (isWrong) {
    return (
      <SecondaryButton className={className} onClick={() => openChainModal()}>
        {t('Wrong Network')}
      </SecondaryButton>
    )
  }

  if (account) {
    const isSocial = isSocialAuthType(getLatestAuthType())
    return isSocial ? (
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
        {formatAddress(account)}
      </EmphasisButton>
    )
  }

  return (
    <PrimaryButton className={className} onClick={() => openConnectModal()}>
      {t('Connect Wallet')}
    </PrimaryButton>
  )
}
