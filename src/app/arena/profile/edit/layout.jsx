import React from 'react'

import { siteConfig } from '@/constant/config'

export const metadata = {
  title: 'Edit Profile',
  description: 'Edit your profile on THENA Arena.',
  openGraph: {
    url: `${siteConfig.url}/arena/profile/edit`,
    title: 'Edit Profile',
    description: 'Edit your profile on THENA Arena.',
    siteName: 'Edit Profile | THENA Arena',
    images: [`${siteConfig.url}/cover.png`],
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Edit Profile',
    description: 'Edit your profile on THENA Arena.',
    images: [`${siteConfig.url}/cover.png`],
  },
}

const layout = ({ children }) => <div>{children}</div>

export default layout
