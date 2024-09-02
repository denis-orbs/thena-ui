import { GoogleAnalytics } from '@next/third-parties/google'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import dynamic from 'next/dynamic'
import React, { Suspense } from 'react'

import '@/styles/globals.css'
import 'react-datepicker/dist/react-datepicker.css'
import 'react-toastify/dist/ReactToastify.css'
import '@rainbow-me/rainbowkit/styles.css'

import { siteConfig } from '@/constant/config'

import Loading from './loading'
import { Providers } from './providers'
import { Updaters } from './updaters'

const Header = dynamic(() => import('@/components/common/Header'), { ssr: false })

export const metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `Home | ${siteConfig.title}`,
    template: `%s | ${siteConfig.title}`,
  },
  description: siteConfig.description,
  robots: { index: true, follow: true },
  icons: {
    icon: '/favicon/favicon.ico',
    shortcut: '/favicon/favicon-16x16.png',
    apple: '/favicon/apple-touch-icon.png',
  },
  manifest: '/favicon/site.webmanifest',
  openGraph: {
    url: siteConfig.url,
    title: siteConfig.title,
    description: siteConfig.description,
    siteName: siteConfig.title,
    images: [`${siteConfig.url}/cover.png`],
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.title,
    description: siteConfig.description,
    images: [`${siteConfig.url}/cover.png`],
  },
}

export const revalidate = 30

const metaCrmConfig = {
  'data-entity-id': '64df0a122effea1f2889adcc',
  integrity: 'sha384-XXR5g7lSPTOllUzRbn8qgjH1nBfNmJ/wKfvyRO+7r4ldJxMGRCHpjY2jUm8mGsTr',
  apikey: 'n4crf9vaq9',
  ecosystem: 'EVM',
}

export default function RootLayout({ children }) {
  const analyticsId = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID
  return (
    <html lang='en'>
      <head>
        <script
          src='https://attribution.metacrm.inc/tracking-1-2-0.js'
          id='metacrm-tracking'
          crossOrigin='anonymous'
          {...metaCrmConfig}
          async
        />
      </head>
      <body suppressHydrationWarning>
        <Providers>
          <Updaters />
          <Header />
          <Suspense fallback={<Loading />}>{children}</Suspense>
          <SpeedInsights />
        </Providers>
        <Analytics />
        <div id='widget-dom-id' />
        <div id='metacrm-tracking' />
      </body>
      <GoogleAnalytics gaId={analyticsId} />
    </html>
  )
}
