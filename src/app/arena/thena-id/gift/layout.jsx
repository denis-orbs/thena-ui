import React from 'react'

import { siteConfig } from '@/constant/config'

export const metadata = {
  title: 'Gift a THENA ID | THENA Arena',
  description:
    'Gift a own THENA ID to anyone to help them acquire their custom name and be able to customize their profiles on THENA Arena',
  openGraph: {
    url: `${siteConfig.url}/arena/thena-id/gift`,
    title: 'Gift a THENA ID | THENA Arena',
    description:
      'Gift a own THENA ID to anyone to help them acquire their custom name and be able to customize their profiles on THENA Arena',
    siteName: 'Gift a THENA ID | THENA Arena',
    images: [`${siteConfig.url}/cover.png`],
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gift a THENA ID',
    description:
      'Gift a own THENA ID to anyone to help them acquire their custom name and be able to customize their profiles on THENA Arena',
    images: [`${siteConfig.url}/cover.png`],
  },
}

export default function ThenaIdLayout({ children }) {
  return <section className='layout-container pt-0'>{children}</section>
}
