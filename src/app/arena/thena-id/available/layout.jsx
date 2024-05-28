import React from 'react'

import { siteConfig } from '@/constant/config'

export const metadata = {
  title: 'Available THENA IDs',
  description: 'See all available THENA IDs on THENA Arena.',
  openGraph: {
    url: `${siteConfig.url}/arena/thena-id/available`,
    title: 'Available THENA IDs',
    description: 'See all available THENA IDs on THENA Arena.',
    siteName: 'Available THENA IDs | THENA Arena',
    images: [`${siteConfig.url}/cover.png`],
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Available THENA IDs',
    description: 'See all available THENA IDs on THENA Arena.',
    images: [`${siteConfig.url}/cover.png`],
  },
}

export default function AvailableThenaIdsLayout({ children }) {
  return <section className='layout-container pt-0'>{children}</section>
}
