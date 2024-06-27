import React from 'react'

import { siteConfig } from '@/constant/config'

export const metadata = {
  title: 'Recently Gifted THENA IDs',
  description: 'See all recently gifted THENA IDs on THENA Arena.',
  openGraph: {
    url: `${siteConfig.url}/arena/thena-id/recently-gifted`,
    title: 'Recently Gifted THENA IDs',
    description: 'See all recently gifted THENA IDs on THENA Arena.',
    siteName: 'Recently Gifted THENA IDs | THENA Arena',
    images: siteConfig.thenaCover,
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Recently Gifted THENA IDs',
    description: 'See all recently gifted THENA IDs on THENA Arena.',
    images: siteConfig.thenaCover,
  },
}

export default function RecentlyGiftedLayout({ children }) {
  return <section className='layout-container pt-0'>{children}</section>
}
