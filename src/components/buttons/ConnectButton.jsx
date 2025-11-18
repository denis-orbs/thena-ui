'use client'

import { useChainModal, useConnectModal } from '@rainbow-me/rainbowkit'
import { useTranslations } from 'next-intl'

import useWallet from '@/hooks/useWallet'
import cn from '@/utils/classes'

import { PrimaryButton, SecondaryButton } from './Button'

export default function ConnectButton({ className }) {
  const { openConnectModal } = useConnectModal()
  const { openChainModal } = useChainModal()
  const { isWrong } = useWallet()
  const t = useTranslations()

  if (isWrong) {
    return (
      <SecondaryButton className={className} onClick={() => openChainModal()}>
        {t('Wrong Network')}
      </SecondaryButton>
    )
  }

  return (
    <PrimaryButton className={cn('leading-5', className)} onClick={() => openConnectModal()}>
      {t('Connect Wallet')}
    </PrimaryButton>
  )
}
