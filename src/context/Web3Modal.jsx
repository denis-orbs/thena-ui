'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createWeb3Modal } from '@web3modal/wagmi/react'
import { ChainId } from 'thena-sdk-core/dist'
import { bsc, opBNB } from 'viem/chains'
import { cookieStorage, createConfig, createStorage, http, WagmiProvider } from 'wagmi'
import { coinbaseWallet, injected, walletConnect } from 'wagmi/connectors'

import { getRpcUrl } from '@/lib/utils'

// 0. Setup queryClient
const queryClient = new QueryClient()

// 1. Get projectId at https://cloud.walletconnect.com

const projectId = 'ef887b5d8b57dc20643189f60792dc3d'
// 2. Create wagmiConfig
const metadata = {
  name: 'THENA',
  description: 'THENA',
  url: 'https://thena.fi',
  icons: ['https://cdn.thena.fi/assets/THE.png'],
}

const chains = [bsc, opBNB]

export const wagmiConfig = createConfig({
  chains,
  transports: {
    [bsc.id]: http(getRpcUrl(ChainId.BSC)),
    [opBNB.id]: http(getRpcUrl(ChainId.OPBNB)),
  },
  connectors: [
    walletConnect({ projectId, metadata, showQrModal: false }),
    injected({ shimDisconnect: true }),
    coinbaseWallet({
      appName: metadata.name,
      appLogoUrl: metadata.icons[0],
    }),
  ],
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
})

// 3. Create modal
createWeb3Modal({
  wagmiConfig,
  projectId,
  chains,
  themeVariables: {
    '--w3m-font-family': 'Inter',
    '--w3m-accent': '#DC00D4',
  },
})

export function Web3Modal({ children, initialState }) {
  return (
    <WagmiProvider config={wagmiConfig} initialState={initialState}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
}
