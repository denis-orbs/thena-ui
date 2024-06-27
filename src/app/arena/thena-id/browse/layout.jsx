import React from 'react'

import { siteConfig } from '@/constant/config'

export const metadata = {
  title: 'Browse THENA IDs',
  description: 'See all THENA IDs on THENA Arena.',
  openGraph: {
    url: `${siteConfig.url}/arena/thena-id/browse`,
    title: 'Browse THENA IDs',
    description: 'See all THENA IDs on THENA Arena.',
    siteName: 'Browse THENA IDs | THENA Arena',
    images: siteConfig.thenaCover,
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Browse THENA IDs',
    description: 'See all THENA IDs on THENA Arena.',
    images: siteConfig.thenaCover,
  },
}

export default function BrowseLayout({ children }) {
  return <section>{children}</section>
}
