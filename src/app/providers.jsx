'use client'

import { AuthCoreContextProvider } from '@particle-network/auth-core-modal'
import { Provider } from 'react-redux'
import { ToastContainer, Zoom } from 'react-toastify'
import { SWRConfig } from 'swr'

import { AssetsContextProvider } from '@/context/assetsContext'
import { FusionsContextProvider } from '@/context/fusionsContext'
import { ManualsContextProvider } from '@/context/manualsContext'
import { PairsContextProvider } from '@/context/pairsContext'
import { RewardsContextProvider } from '@/context/rewardsContext'
import { TokensContextProvider } from '@/context/tokensContext'
import { VaultsContextProvider } from '@/context/vaultsContext'
import { VeTHEsContextProvider } from '@/context/veTHEsContext'
import { swrGCMiddleware } from '@/lib/swrMiddlewares'
import store from '@/state'

function ContextProviders({ children }) {
  return (
    <AssetsContextProvider>
      <VaultsContextProvider>
        <PairsContextProvider>
          <FusionsContextProvider>
            <ManualsContextProvider>
              <TokensContextProvider>
                <VeTHEsContextProvider>
                  <RewardsContextProvider>{children}</RewardsContextProvider>
                </VeTHEsContextProvider>
              </TokensContextProvider>
            </ManualsContextProvider>
          </FusionsContextProvider>
        </PairsContextProvider>
      </VaultsContextProvider>
    </AssetsContextProvider>
  )
}

export function Providers({ children }) {
  return (
    <AuthCoreContextProvider
      options={{
        projectId: process.env.NEXT_PUBLIC_PARTICLE_PROJECT_ID,
        clientKey: process.env.NEXT_PUBLIC_PARTICLE_CLIENT_KEY,
        appId: process.env.NEXT_PUBLIC_PARTICLE_APP_ID,
        customStyle: {
          zIndex: 2147483650, // must greater than 2147483646
        },
      }}
    >
      <Provider store={store}>
        <SWRConfig
          value={{
            refreshInterval: 30000,
            refreshWhenHidden: false,
            refreshWhenOffline: false,
            use: [swrGCMiddleware],
          }}
        >
          <ToastContainer
            className='notify-class'
            position='bottom-left'
            theme='dark'
            closeOnClick={false}
            transition={Zoom}
            autoClose={5000}
            hideProgressBar
            closeButton={false}
          />
          <ContextProviders>{children}</ContextProviders>
        </SWRConfig>
      </Provider>
    </AuthCoreContextProvider>
  )
}
