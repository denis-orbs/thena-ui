import React from 'react'

import { siteConfig } from '@/constant/config'

export async function generateMetadata({ params }) {
  const { address } = params

  const metadata = {
    name: 'Following of user',
    image: [`${siteConfig.url}/cover.png`],
    description: 'See the full following list of user on THENA Arena.',
  }

  return {
    title: metadata.name,
    description: metadata.description,
    openGraph: {
      url: `${siteConfig.url}/arena/profile/${encodeURIComponent(address)}/following`,
      title: metadata.name,
      description: metadata.description,
      siteName: 'Following of user | THENA Arena',
      images: metadata.image,
      type: 'website',
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title: metadata.name,
      description: metadata.description,
      images: metadata.image,
    },
  }
}

const layout = ({ children }) => <div>{children}</div>

export default layout
