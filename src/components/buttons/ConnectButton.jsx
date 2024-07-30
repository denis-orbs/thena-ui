'use client'

import { useAccountModal, useChainModal, useConnectModal } from '@rainbow-me/rainbowkit'
import { useTranslations } from 'next-intl'
import React from 'react'

import useWallet from '@/hooks/useWallet'
import { formatAddress } from '@/lib/utils'

import { EmphasisButton, PrimaryButton, SecondaryButton } from './Button'

export default function ConnectButton({ className }) {
  const { openConnectModal } = useConnectModal()
  const { openAccountModal } = useAccountModal()
  const { openChainModal } = useChainModal()
  const { account, isWrong } = useWallet()
  const t = useTranslations()

  if (isWrong) {
    return (
      <SecondaryButton className={className} onClick={() => openChainModal()}>
        {t('Wrong Network')}
      </SecondaryButton>
    )
  }

  if (account) {
    return (
      <EmphasisButton className={className} onClick={() => openAccountModal()}>
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
