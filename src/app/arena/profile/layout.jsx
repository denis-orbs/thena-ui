import React from 'react'

import { siteConfig } from '@/constant/config'

export async function generateMetadata({ params }) {
  const { address } = params

  const metadata = {
    name: 'user',
    image: [`${siteConfig.url}/cover.png`],
    description:
      'See the profile of user on THENA Arena. Follow them, engage with them or check their analytics and THENA IDs out on the decentralized social media platform of THENA Arena',
  }

  return {
    title: {
      default: metadata.name,
      template: '%s | THENA Arena',
    },
    description: metadata.description,
    openGraph: {
      url: `${siteConfig.url}/arena/profile/${address}`,
      title: {
        default: metadata.name,
        template: '%s | THENA Arena',
      },
      description: metadata.description,
      images: metadata.image,
      type: 'website',
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title: {
        default: metadata.name,
        template: '%s | THENA Arena',
      },
      description: metadata.description,
      images: metadata.image,
    },
  }
}

const layout = ({ children }) => <div>{children}</div>

export default layout
