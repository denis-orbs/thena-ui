import React from 'react'

import { siteConfig } from '@/constant/config'

export const metadata = {
  title: 'Admin Panel',
  description: 'Edit user profiles, verify users, hide or unhide trading competitions on THENA Arena.',
  openGraph: {
    url: `${siteConfig.url}/arena/admin`,
    title: 'Admin Panel',
    description: 'Edit user profiles, verify users, hide or unhide trading competitions on THENA Arena.',
    siteName: 'Admin Panel | THENA Arena',
    images: [`${siteConfig.url}/cover.png`],
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Admin Panel',
    description: 'Edit user profiles, verify users, hide or unhide trading competitions on THENA Arena.',
    images: [`${siteConfig.url}/cover.png`],
  },
}

const layout = ({ children }) => <div>{children}</div>

export default layout
