'use client'

import { connectorsForWallets, darkTheme, RainbowKitProvider } from '@rainbow-me/rainbowkit'
import {
  bitgetWallet,
  coin98Wallet,
  coinbaseWallet,
  imTokenWallet,
  ledgerWallet,
  metaMaskWallet,
  okxWallet,
  rabbyWallet,
  tokenPocketWallet,
  trustWallet,
  walletConnectWallet,
} from '@rainbow-me/rainbowkit/wallets'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ChainId } from 'thena-sdk-core/dist'
import { bsc, opBNB } from 'viem/chains'
import { cookieStorage, createConfig, createStorage, http, WagmiProvider } from 'wagmi'

import '@rainbow-me/rainbowkit/styles.css'

import { getRpcUrl } from '@/lib/utils'

const queryClient = new QueryClient()

const projectId = 'ef887b5d8b57dc20643189f60792dc3d'

const chains = [bsc, opBNB]

const connectors = connectorsForWallets(
  [
    {
      groupName: 'Popular',
      wallets: [metaMaskWallet, rabbyWallet, coinbaseWallet, walletConnectWallet],
    },
    {
      groupName: 'More',
      wallets: [trustWallet, okxWallet, tokenPocketWallet, ledgerWallet, bitgetWallet, coin98Wallet, imTokenWallet],
    },
  ],
  {
    appName: 'THENA',
    projectId,
  },
)

export const wagmiConfig = createConfig({
  chains,
  transports: {
    [bsc.id]: http(getRpcUrl(ChainId.BSC)),
    [opBNB.id]: http(getRpcUrl(ChainId.OPBNB)),
  },
  connectors,
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
})

export function RainbowWallet({ children }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: '#DC00D4',
            accentColorForeground: '#FCE6FB',
            borderRadius: 'medium',
            fontStack: 'Inter',
            overlayBlur: 'small',
          })}
          appInfo={{
            appName: 'THENA',
            learnMoreUrl: 'https://thena.gitbook.io/',
          }}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
