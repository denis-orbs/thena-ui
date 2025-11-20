'use client'

import { connectorsForWallets, darkTheme, RainbowKitProvider } from '@rainbow-me/rainbowkit'
import {
  binanceWallet,
  coinbaseWallet,
  injectedWallet,
  metaMaskWallet,
  rabbyWallet,
  safeWallet,
  trustWallet,
  walletConnectWallet,
} from '@rainbow-me/rainbowkit/wallets'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import merge from 'lodash/merge'
import { createConfig, fallback, http, unstable_connector, WagmiProvider } from 'wagmi'
import { bsc, bscTestnet, opBNB } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'

const connectors = connectorsForWallets(
  [
    {
      groupName: 'Wallets',
      wallets: [
        binanceWallet,
        rabbyWallet,
        metaMaskWallet,
        walletConnectWallet,
        coinbaseWallet,
        trustWallet,
        safeWallet,
        injectedWallet,
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
  chains: [bsc, opBNB, bscTestnet],
  transports: {
    [bsc.id]: fallback([
      http('https://bsc-dataseed2.ninicoin.io'),
      http('https://bsc.blockrazor.xyz'),
      http('https://binance.llamarpc.com'),
      unstable_connector(injected),
    ]),
    [opBNB.id]: fallback([http('https://opbnb-mainnet-rpc.bnbchain.org'), unstable_connector(injected)]),
    [bscTestnet.id]: http('https://bsc-testnet-rpc.publicnode.com'),
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
