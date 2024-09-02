import React from 'react'

import { siteConfig } from '@/constant/config'

export async function generateMetadata({ params }) {
  const { address } = params

  const metadata = {
    name: 'Followers of user',
    image: siteConfig.thenaCover,
    description: 'See the full followers list of user on THENA Arena.',
  }

  return {
    title: metadata.name,
    description: metadata.description,
    openGraph: {
      url: `${siteConfig.url}/arena/profile/${encodeURIComponent(address)}/followers`,
      title: metadata.name,
      description: metadata.description,
      siteName: `${metadata.name} | THENA Arena`,
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
