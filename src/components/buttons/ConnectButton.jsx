'use client'

import { useWeb3Modal } from '@web3modal/wagmi/react'
import React from 'react'

import { PrimaryButton } from './Button'

export default function ConnectButton({ className }) {
  const { open } = useWeb3Modal()

  return (
    <PrimaryButton className={className} onClick={() => open()}>
      Connect Wallet
    </PrimaryButton>
  )
}
