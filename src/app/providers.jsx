'use client'

import { NextIntlClientProvider } from 'next-intl'
import React from 'react'
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
// Preload default language to avoid layout shift
import enMessage from '@/lang/en.json'
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

// Lazy load other language files to reduce initial bundle size
const loadMessages = async locale => {
  // If English, return immediately (already imported)
  if (locale === LOCALES.en) {
    return enMessage
  }

  switch (locale) {
    case LOCALES.zh_CN:
      return (await import('@/lang/zh_cn.json')).default
    case LOCALES.zh_TW:
      return (await import('@/lang/zh_tw.json')).default
    case LOCALES.vi:
      return (await import('@/lang/vi.json')).default
    case LOCALES.pt:
      return (await import('@/lang/pt.json')).default
    case LOCALES.th:
      return (await import('@/lang/th.json')).default
    case LOCALES.ja:
      return (await import('@/lang/ja.json')).default
    case LOCALES.ko:
      return (await import('@/lang/ko.json')).default
    case LOCALES.es:
      return (await import('@/lang/es.json')).default
    default:
      return enMessage
  }
}

function IntlProvider({ children }) {
  const { locale } = useLocaleSettings()
  const [messages, setMessages] = React.useState(() =>
    // Initialize with English for default locale to avoid flash
    locale === LOCALES.en ? enMessage : null,
  )

  React.useEffect(() => {
    if (locale !== LOCALES.en) {
      loadMessages(locale).then(setMessages)
    }
  }, [locale])

  // Use English as fallback while loading other languages
  const currentMessages = messages || enMessage

  return (
    <NextIntlClientProvider locale={locale} messages={currentMessages} timeZone='America/Los_Angeles'>
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
