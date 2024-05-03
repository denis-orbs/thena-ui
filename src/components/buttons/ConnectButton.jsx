'use client'

import { useWeb3Modal } from '@web3modal/wagmi/react'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect } from 'react'
import useSWR from 'swr'

import { fetchUserInfo } from '@/context/userInfoContext'
import { formatAddress } from '@/lib/utils'
import { useSignWallet } from '@/lib/wallets/useSignWallet'
import useWallet from '@/lib/wallets/useWallet'

import { EmphasisButton, PrimaryButton, SecondaryButton } from './Button'

export default function ConnectButton({ className }) {
  const { open } = useWeb3Modal()
  const { account, isWrong, active } = useWallet()
  const t = useTranslations()

  const { data: userInfo } = useSWR(['user info', account], () => fetchUserInfo(account), {
    refreshInterval: 60000,
  })

  const { signWallet, deleteToken } = useSignWallet()

  const getSign = useCallback(() => {
    if (account) {
      signWallet()
    }
  }, [account, signWallet])

  useEffect(() => {
    getSign()
  }, [getSign])

  useEffect(() => {
    if (!active && !account) {
      deleteToken()
    }
  }, [active, account, deleteToken])

  if (isWrong) {
    return (
      <SecondaryButton className={className} onClick={() => open()}>
        {t('Wrong Network')}
      </SecondaryButton>
    )
  }

  if (account) {
    return (
      <EmphasisButton className={className} onClick={() => open()}>
        {userInfo?.username || formatAddress(account)}
      </EmphasisButton>
    )
  }

  return (
    <PrimaryButton className={className} onClick={() => open()}>
      {t('Connect Wallet')}
    </PrimaryButton>
  )
}
