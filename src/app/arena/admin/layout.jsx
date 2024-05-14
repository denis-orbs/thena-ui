import React from 'react'

import { siteConfig } from '@/constant/config'

export const metadata = {
  title: {
    default: 'Admin Panel',
    template: '%s | THENA Arena',
  },
  description: 'Edit user profiles, verify users, hide or unhide trading competitions on THENA Arena.',
  openGraph: {
    url: `${siteConfig.url}/arena/admin`,
    title: {
      default: 'Admin Panel',
      template: '%s | THENA Arena',
    },
    description: 'Edit user profiles, verify users, hide or unhide trading competitions on THENA Arena.',
    images: [`${siteConfig.url}/cover.png`],
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: {
      default: 'Admin Panel',
      template: '%s | THENA Arena',
    },
    description: 'Edit user profiles, verify users, hide or unhide trading competitions on THENA Arena.',
    images: [`${siteConfig.url}/cover.png`],
  },
}

const layout = ({ children }) => <div>{children}</div>

export default layout
