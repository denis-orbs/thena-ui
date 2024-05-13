import React from 'react'

import { siteConfig } from '@/constant/config'

export async function generateMetadata({ params }) {
  const { address } = params

  const metadata = {
    name: 'Following of username',
    image: [`${siteConfig.url}/cover.png`],
    description: 'See the full following list of username on THENA Arena.',
  }

  return {
    title: metadata.name,
    description: metadata.description,
    openGraph: {
      url: `${siteConfig.url}/arena/profile/${address}/following`,
      title: metadata.name,
      description: metadata.description,
      siteName: 'Following of username | THENA Arena',
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
