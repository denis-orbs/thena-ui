'use client'

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
  )
}
