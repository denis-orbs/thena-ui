'use client'

import { AuthCoreContextProvider } from '@particle-network/auth-core-modal'
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
const web3Modal = createWeb3Modal({
  wagmiConfig,
  projectId,
  chains,
  themeVariables: {
    '--w3m-font-family': 'Inter',
    '--w3m-accent': '#DC00D4',
  },
})

let connecteFlag = 1

web3Modal.wagmiConfig.subscribe(state => {
  if (typeof window === 'undefined') return
  if (state.status === 'connected') {
    connecteFlag = 1
  }
  const particle = window?.particle
  if (state.status === 'disconnected' && particle && particle.ethereum.isConnected() && connecteFlag !== 0) {
    const config = web3Modal?.wagmiConfig
    const connector = config.connectors.find(item => item.id === 'network.particle')
    if (connector) {
      connector.connect({ isReconnecting: true }).then(data => {
        const connections = new Map(new Map()).set(connector.uid, {
          accounts: data.accounts,
          chainId: data.chainId,
          connector,
        })
        const stateData = {
          ...config.state,
          current: connector.uid,
          connections,
          status: 'connected',
        }
        web3Modal.wagmiConfig.setState(stateData)
      })
    }
  }
})

web3Modal.subscribeEvents(event => {
  if (typeof window === 'undefined') return
  const particle = window?.particle
  if (
    particle &&
    event.data.event === 'MODAL_CLOSE' &&
    web3Modal.wagmiConfig.state.status === 'disconnected' &&
    particle.ethereum.isConnected()
  ) {
    connecteFlag = 0
    particle.ethereum.disconnect().then(() => {
      web3Modal.wagmiConfig.setState({
        chainId: ChainId.BSC,
        connections: {},
        status: 'disconnected',
      })
    })
  }
})

export function Web3Modal({ children, initialState }) {
  return (
    <AuthCoreContextProvider
      options={{
        projectId: process.env.NEXT_PUBLIC_PARTICLE_PROJECT_ID,
        clientKey: process.env.NEXT_PUBLIC_PARTICLE_CLIENT_KEY,
        appId: process.env.NEXT_PUBLIC_PARTICLE_APP_ID,
        themeType: 'dark',
        customStyle: {
          logo: 'https://cdn.thena.fi/assets/THE.png',
          projectName: 'THENA',
          primaryBtnBorderRadius: '8px',
          modalBorderRadius: '12px',
          cardBorderRadius: '12px',
          fontFamily: 'Inter',
          theme: {
            dark: {
              primaryBtnColor: '#FCE6FB',
              primaryBtnBackgroundColor: '#DC00D4',
              secondaryBtnColor: '#ECEAED',
              secondaryBtnBackgroundColor: '#35243D',
              textColor: '#F3F2F4',
              secondaryTextColor: '#B3ABB7',
              themeBackgroundColor: '#1A121E',
              iconBorderColor: '#35243D',
              accentColor: '#DC00D4',
              inputBackgroundColor: '#35243D',
              inputBorderColor: '#685770',
              inputPlaceholderColor: '#8E8194',
              cardBorderColor: '#35243D',
              cardUnclickableBackgroundColor: 'none',
              cardUnclickableBorderColor: '#35243D',
              cardDividerColor: '#35243D',
            },
          },
        },
        wallet: {
          visible: false,
        },
      }}
    >
      <WagmiProvider config={wagmiConfig} initialState={initialState}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </WagmiProvider>
    </AuthCoreContextProvider>
  )
}
