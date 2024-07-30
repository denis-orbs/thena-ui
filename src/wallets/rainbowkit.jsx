'use client'

import { connectorsForWallets, darkTheme, RainbowKitProvider } from '@rainbow-me/rainbowkit'
import {
  coinbaseWallet,
  injectedWallet,
  metaMaskWallet,
  rabbyWallet,
  trustWallet,
  walletConnectWallet,
} from '@rainbow-me/rainbowkit/wallets'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import merge from 'lodash/merge'
import { ChainId } from 'thena-sdk-core'
import { createConfig, http, WagmiProvider } from 'wagmi'
import { bsc, opBNB } from 'wagmi/chains'

import { getRpcUrl } from '@/lib/utils'

import {
  particleAppleWallet,
  particleDiscordWallet,
  particleFacebookWallet,
  particleGithubWallet,
  particleGoogleWallet,
  particleLinkedinWallet,
  particleMicrosoftWallet,
  particleTwitchWallet,
  particleTwitterWallet,
} from './particleWallet'

const connectors = connectorsForWallets(
  [
    {
      groupName: 'Wallets',
      wallets: [rabbyWallet, metaMaskWallet, walletConnectWallet, coinbaseWallet, trustWallet, injectedWallet],
    },
    {
      groupName: 'Social login',
      wallets: [
        particleFacebookWallet,
        particleGoogleWallet,
        particleAppleWallet,
        particleDiscordWallet,
        particleGithubWallet,
        particleTwitchWallet,
        particleTwitterWallet,
        particleMicrosoftWallet,
        particleLinkedinWallet,
      ],
    },
  ],
  {
    appName: 'THENA',
    projectId: 'ef887b5d8b57dc20643189f60792dc3d',
  },
)

export const wagmiConfig = createConfig({
  connectors,
  chains: [bsc, opBNB],
  transports: {
    [bsc.id]: http(getRpcUrl(ChainId.BSC)),
    [opBNB.id]: http(getRpcUrl(ChainId.OPBNB)),
  },
  ssr: true,
})

const walletTheme = merge(darkTheme(), {
  colors: {
    modalBackground: '#1A121E',
    accentColor: '#DC00D4',
    menuItemBackground: '#281B2E',
  },
  radii: {
    modal: '12px',
    menuButton: '4px',
  },
})

const queryClient = new QueryClient()

export function ParticleProvider({ children }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={walletTheme} modalSize='compact'>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
