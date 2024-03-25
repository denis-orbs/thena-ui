'use client'

import { useWeb3Modal } from '@web3modal/wagmi/react'
import { useTranslations } from 'next-intl'
import React from 'react'

import { formatAddress } from '@/lib/utils'
import useWallet from '@/lib/wallets/useWallet'

import { EmphasisButton, PrimaryButton, SecondaryButton } from './Button'

export default function ConnectButton({ className }) {
  const { open } = useWeb3Modal()
  const { account, isWrong } = useWallet()
  const t = useTranslations()

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
