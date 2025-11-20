'use client'

import { NextIntlClientProvider } from 'next-intl'
import { useMemo } from 'react'
import { Provider } from 'react-redux'
import { ToastContainer, Zoom } from 'react-toastify'
import { SWRConfig } from 'swr'

import { LOCALES } from '@/constant'
import { AssetsContextProvider } from '@/context/assetsContext'
import { CustomAssetsContextProvider } from '@/context/customAssetsContext'
import { FusionsContextProvider } from '@/context/fusionsContext'
import { ManualsContextProvider } from '@/context/manualsContext'
import { PairsContextProvider } from '@/context/pairsContext'
import { TokensContextProvider } from '@/context/tokensContext'
import { VaultsContextProvider } from '@/context/vaultsContext'
import enMessage from '@/lang/en.json'
import esMessage from '@/lang/es.json'
import jaMessage from '@/lang/ja.json'
import koMessage from '@/lang/ko.json'
import ptMessage from '@/lang/pt.json' // Portuguese
import thMessage from '@/lang/th.json'
import viMessage from '@/lang/vi.json'
// import zhMessage from '@/lang/zh.json'
import zhCNMessage from '@/lang/zh_cn.json'
import zhTWMessage from '@/lang/zh_tw.json'
import { swrGCMiddleware } from '@/lib/swrMiddlewares'
import store from '@/state'
import { useLocaleSettings } from '@/state/settings/hooks'
import { ParticleProvider } from '@/wallets/rainbowkit'

function ContextProviders({ children }) {
  return (
    <AssetsContextProvider>
      <CustomAssetsContextProvider>
        <VaultsContextProvider>
          <PairsContextProvider>
            <FusionsContextProvider>
              <ManualsContextProvider>
                <TokensContextProvider>{children}</TokensContextProvider>
              </ManualsContextProvider>
            </FusionsContextProvider>
          </PairsContextProvider>
        </VaultsContextProvider>
      </CustomAssetsContextProvider>
    </AssetsContextProvider>
  )
}

function IntlProvider({ children }) {
  const { locale } = useLocaleSettings()
  // (locale === LOCALES.en ? enMessage : zhMessage)
  const messages = useMemo(() => {
    switch (locale) {
      case LOCALES.en:
        return enMessage
      case LOCALES.zh_CN:
        return zhCNMessage
      case LOCALES.zh_TW:
        return zhTWMessage
      case LOCALES.vi:
        return viMessage
      case LOCALES.pt:
        return ptMessage
      case LOCALES.th:
        return thMessage
      case LOCALES.ja:
        return jaMessage
      case LOCALES.ko:
        return koMessage
      case LOCALES.es:
        return esMessage
      default:
        return enMessage
    }
  }, [locale])
  return (
    <NextIntlClientProvider locale={locale} messages={messages} timeZone='America/Los_Angeles'>
      {children}
    </NextIntlClientProvider>
  )
}

export function Providers({ children }) {
  return (
    <ParticleProvider>
      <Provider store={store}>
        <IntlProvider>
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
        </IntlProvider>
      </Provider>
    </ParticleProvider>
  )
}
