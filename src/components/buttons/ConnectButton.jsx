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
import { useSpaceIdBNB } from '@/hooks/useSpaceIdBNB'
import useWallet from '@/hooks/useWallet'
import { getFromLocalStorage } from '@/lib/helper'
import { cn, formatAddress } from '@/lib/utils'

import PowerIcon from '~/svgs/power-icon.svg'

import { EmphasisButton, PrimaryButton, SecondaryButton } from './Button'
import NextImage from '../image/NextImage'

export default function ConnectButton({ className, isHeader = false, isMobile = false, isMini = false }) {
  const { openConnectModal } = useConnectModal()
  const { openAccountModal } = useAccountModal()
  const { openChainModal } = useChainModal()
  const { account, isWrong, active } = useWallet()
  const t = useTranslations()
  const { openWallet } = useAuthCore()

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
    const auth = getLatestAuthType()
    return auth ? (
      <div className={`flex items-center gap-2 ${className}`}>
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
        {isHeader && (
          <NextImage
            className={cn('size-4 cursor-pointer rounded-full lg:size-5', isMobile && '!size-5')}
            alt='particle icon'
            src={userInfo?.avatar?.replace('ipfs.io', 'w3s.link') ?? '/svgs/wallet-fold.svg'}
            onClick={() => {
              openWallet({
                windowSize: 'small',
                topMenuType: 'close',
              })
            }}
          />
        )}
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
      {isHeader && isMini ? <PowerIcon className='!size-4' /> : t('Connect Wallet')}
    </PrimaryButton>
  )
}
