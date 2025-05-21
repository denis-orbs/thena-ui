import React, { Suspense } from 'react'

import { siteConfig } from '@/constant/config'

import { ArenaContextProviders } from './ArenaContextProviders'
import Loading from '../loading'

export const metadata = {
  title: {
    template: '%s | THENA Arena',
    default: 'Browse Trading Competitions',
    absolute: 'Browse Trading Competitions | THENA Arena',
  },
  description: 'Browse or create decentralized trading competitions on THENA Arena and win big!',
  openGraph: {
    url: `${siteConfig.url}/arena`,
    title: {
      template: '%s | THENA Arena',
      default: 'Browse Trading Competitions',
      absolute: 'Browse Trading Competitions | THENA Arena',
    },
    description: 'Browse or create decentralized trading competitions on THENA Arena and win big!',
    siteName: 'Browse Trading Competitions | THENA Arena',
    images: siteConfig.thenaCover,
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: {
      template: '%s | THENA Arena',
      default: 'Browse Trading Competitions',
      absolute: 'Browse Trading Competitions | THENA Arena',
    },
    description: 'Browse or create decentralized trading competitions on THENA Arena and win big!',
    images: siteConfig.thenaCover,
  },
}

export default function ArenaLayout({ children }) {
  return (
    <ArenaContextProviders>
      <section className='layout-container'>
        <Suspense fallback={<Loading />}>{children}</Suspense>
      </section>
    </ArenaContextProviders>
  )
}
