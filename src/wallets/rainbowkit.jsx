'use client'

import { connectorsForWallets, darkTheme, RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { coinbaseWallet, metaMaskWallet, walletConnectWallet } from '@rainbow-me/rainbowkit/wallets'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ChainId } from 'thena-sdk-core'
import { createConfig, http, WagmiProvider } from 'wagmi'
import { bsc, opBNB } from 'wagmi/chains'

import { getRpcUrl } from '@/lib/utils'

import { particleGoogleWallet, particleTwitterWallet } from './particleWallet'

const connectors = connectorsForWallets(
  [
    {
      groupName: 'Wallets',
      wallets: [metaMaskWallet, coinbaseWallet, walletConnectWallet],
    },
    {
      groupName: 'Social login',
      wallets: [particleGoogleWallet, particleTwitterWallet],
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

const queryClient = new QueryClient()

export function ParticleProvider({ children }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          modalSize='compact'
          theme={darkTheme({
            accentColor: '#DC00D4',
            accentColorForeground: 'white',
            borderRadius: 'medium',
            fontStack: 'system',
            overlayBlur: 'small',
          })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
