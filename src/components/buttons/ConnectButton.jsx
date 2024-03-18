'use client'

import { useWeb3Modal } from '@web3modal/wagmi/react'
import React from 'react'

import { formatAddress } from '@/lib/utils'
import useWallet from '@/lib/wallets/useWallet'

import { EmphasisButton, PrimaryButton } from './Button'

export default function ConnectButton({ className }) {
  const { open } = useWeb3Modal()
  const { account } = useWallet()

  if (account) {
    return (
      <EmphasisButton className={className} onClick={() => open()}>
        {formatAddress(account)}
      </EmphasisButton>
    )
  }

  return (
    <PrimaryButton className={className} onClick={() => open()}>
      Connect Wallet
    </PrimaryButton>
  )
}
