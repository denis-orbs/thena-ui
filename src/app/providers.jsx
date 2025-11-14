'use client'

import { AuthCoreContextProvider, PromptSettingType } from '@particle-network/auth-core-modal'
import { BNBChain, opBNB } from '@particle-network/chains'
import { NextIntlClientProvider } from 'next-intl'
import { useMemo } from 'react'
import { Provider } from 'react-redux'
import { ToastContainer, Zoom } from 'react-toastify'
import { SWRConfig } from 'swr'

import { LOCALES, THE_LOGO } from '@/constant'
import { AssetsContextProvider } from '@/context/assetsContext'
import { CustomAssetsContextProvider } from '@/context/customAssetsContext'
import { FusionsContextProvider } from '@/context/fusionsContext'
import { ManualsContextProvider } from '@/context/manualsContext'
import { PairsContextProvider } from '@/context/pairsContext'
import { RewardsContextProvider } from '@/context/rewardsContext'
import { TCContextProvider } from '@/context/tcContext'
import { TitleNotiContextProvider } from '@/context/titleNotiContext'
import { TokensContextProvider } from '@/context/tokensContext'
import { VaultsContextProvider } from '@/context/vaultsContext'
import { VeTHEsContextProvider } from '@/context/veTHEsContext'
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
                <TokensContextProvider>
                  <VeTHEsContextProvider>
                    <RewardsContextProvider>
                      <TitleNotiContextProvider>
                        <TCContextProvider>{children}</TCContextProvider>
                      </TitleNotiContextProvider>
                    </RewardsContextProvider>
                  </VeTHEsContextProvider>
                </TokensContextProvider>
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
    <AuthCoreContextProvider
      options={{
        projectId: process.env.NEXT_PUBLIC_PARTICLE_PROJECT_ID,
        clientKey: process.env.NEXT_PUBLIC_PARTICLE_CLIENT_KEY,
        appId: process.env.NEXT_PUBLIC_PARTICLE_APP_ID,
        themeType: 'dark',
        fiatCoin: 'USD',
        language: 'en',
        customStyle: {
          logo: THE_LOGO,
          projectName: 'THENA',
          primaryBtnBorderRadius: '8px',
          modalBorderRadius: '12px',
          cardBorderRadius: '12px',
          fontFamily: 'Inter',
          zIndex: 2147483647,
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
        promptSettingConfig: {
          promptPaymentPasswordSettingWhenSign: PromptSettingType.first,
          promptMasterPasswordSettingWhenLogin: PromptSettingType.first,
        },
        wallet: {
          visible: true,
          themeType: 'dark',
          customStyle: {
            supportChains: [BNBChain, opBNB],
            dark: {
              colorAccent: 'rgba(220,0,212,1)',
              colorPrimary: 'rgba(26,18,30,1)',
              colorOnPrimary: 'rgba(209,209,224,1)',
              primaryButtonBackgroundColors: ['rgba(220,0,212,1)', 'rgba(220,0,212,1)'],
              primaryIconButtonBackgroundColors: ['rgba(220,0,212,1)', 'rgba(220,0,212,1)'],
              primaryButtonTextColor: 'rgba(255,255,255,1)',
              cancelButtonBackgroundColor: 'rgba(102,102,102,1)',
              backgroundColors: [
                'rgba(13,9,15,1)',
                [
                  ['#e6b1f766', '#e6b1f700'],
                  ['#7dd5f94d', 'rgba(96,181,216,0)'],
                ],
              ],
              messageColors: ['rgba(249,119,102,1)', 'rgba(249,119,102,1)'],
              borderGlowColors: ['#7bd5f940', '#323233'],
              modalMaskBackgroundColor: '#141430b3',
              primaryTextColor: 'rgba(167,161,169,1)',
            },
          },
        },
      }}
    >
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
    </AuthCoreContextProvider>
  )
}
