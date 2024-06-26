import React from 'react'

import { siteConfig } from '@/constant/config'

export const metadata = {
  title: 'Recently Minted THENA IDs',
  description: 'See all recently minted THENA IDs on THENA Arena.',
  openGraph: {
    url: `${siteConfig.url}/arena/thena-id/recently-minted`,
    title: 'Recently Minted THENA IDs',
    description: 'See all recently minted THENA IDs on THENA Arena.',
    siteName: 'Recently Minted THENA IDs | THENA Arena',
    images: [`${siteConfig.url}/cover.png`],
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Recently Minted THENA IDs',
    description: 'See all recently minted THENA IDs on THENA Arena.',
    images: [`${siteConfig.url}/cover.png`],
  },
}

export default function RecentlyMintedLayout({ children }) {
  return <section className='layout-container pt-0'>{children}</section>
}
