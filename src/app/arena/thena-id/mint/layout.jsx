import React from 'react'

import { siteConfig } from '@/constant/config'

export const metadata = {
  title: 'Mint your THENA ID',
  description:
    'Mint your own THENA ID to be able to show off your custom name and be able to customize your profile on THENA Arena.',
  openGraph: {
    url: `${siteConfig.url}/arena/thena-id/mint`,
    title: 'Mint your THENA ID',
    description:
      'Mint your own THENA ID to be able to show off your custom name and be able to customize your profile on THENA Arena.',
    siteName: 'Mint your THENA ID | THENA Arena',
    images: siteConfig.thenaCover,
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mint your THENA ID',
    description:
      'Mint your own THENA ID to be able to show off your custom name and be able to customize your profile on THENA Arena.',
    images: siteConfig.thenaCover,
  },
}

export default function ThenaIdLayout({ children }) {
  return <section className='pt-0'>{children}</section>
}
