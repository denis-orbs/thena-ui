'use client'

import { useWeb3Modal } from '@web3modal/wagmi/react'
import { useTranslations } from 'next-intl'
import React, { useCallback, useEffect } from 'react'

import { useSignWallet } from '@/hooks/useSignWallet'
import { getFromLocalStorage } from '@/lib/helper'
import { formatAddress } from '@/lib/utils'
import useWallet from '@/lib/wallets/useWallet'

import { EmphasisButton, PrimaryButton, SecondaryButton } from './Button'

export default function ConnectButton({ className }) {
  const { open } = useWeb3Modal()
  const { account, isWrong, active } = useWallet()
  const t = useTranslations()
  const { signWallet, deleteToken } = useSignWallet()

  const getSign = useCallback(() => {
    if (!getFromLocalStorage('token')) {
      signWallet()
    }
  }, [signWallet])

  useEffect(() => {
    getSign()
  }, [getSign])

  useEffect(() => {
    if (!active && !account && getFromLocalStorage('token')) {
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
        {formatAddress(account)}
      </EmphasisButton>
    )
  }

  return (
    <PrimaryButton className={className} onClick={() => open()}>
      {t('Connect Wallet')}
    </PrimaryButton>
  )
}
