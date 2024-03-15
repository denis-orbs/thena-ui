import { ConnectButton as RainbowConnectButton } from '@rainbow-me/rainbowkit'
import React from 'react'

import { EmphasisButton, PrimaryButton, SecondaryButton } from './Button'

export default function ConnectButton({ className }) {
  return (
    <RainbowConnectButton.Custom>
      {({ account, chain, openAccountModal, openChainModal, openConnectModal, authenticationStatus, mounted }) => {
        // Note: If your app doesn't use authentication, you
        // can remove all 'authenticationStatus' checks
        const ready = mounted && authenticationStatus !== 'loading'
        const connected =
          ready && account && chain && (!authenticationStatus || authenticationStatus === 'authenticated')
        if (!connected) {
          return (
            <PrimaryButton className={className} onClick={openConnectModal}>
              Connect Wallet
            </PrimaryButton>
          )
        }

        if (chain.unsupported) {
          return (
            <SecondaryButton className={className} onClick={openChainModal}>
              Wrong network
            </SecondaryButton>
          )
        }

        return (
          <EmphasisButton className={className} onClick={openAccountModal}>
            {account.displayName}
          </EmphasisButton>
        )
      }}
    </RainbowConnectButton.Custom>
  )
}
