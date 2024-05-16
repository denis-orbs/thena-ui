import { gql } from 'graphql-request'
import React from 'react'

import { siteConfig } from '@/constant/config'
import { v4Client } from '@/lib/graphql'

const V4_USERNAME_NFTS = gql`
  query V4_USERNAME_NFTS($username: String) {
    usernameNfts(where: { name_eq: $username }) {
      id
      name
    }
  }
`
export async function generateMetadata({ params }) {
  const { thenaId } = params

  const { usernameNfts } = await v4Client.request(V4_USERNAME_NFTS, {
    username: decodeURIComponent(thenaId).toLowerCase(),
  })

  const metadata = {
    name: usernameNfts?.[0]?.name ?? 'thena',
    description: `See all the details about ${usernameNfts?.[0]?.name ?? 'thena'}.thena on THENA Arena, 
whether it is available or not and more.`,
    image: [`${siteConfig.url}/cover.png`],
  }

  return {
    title: {
      template: '%s | THENA Arena',
      default: `${metadata.name}.thena THENA ID`,
    },
    description: metadata.description,
    openGraph: {
      url: `${siteConfig.url}/arena/thena-id/browse/${thenaId}`,
      title: {
        template: '%s | THENA Arena',
        default: `${metadata.name}`,
      },
      description: metadata.description,
      images: metadata.image,
      type: 'website',
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title: {
        template: '%s | THENA Arena',
        default: `${metadata.name}`,
      },
      description: metadata.description,
      images: metadata.image,
    },
  }
}
function layout({ children }) {
  return <div>{children}</div>
}

export default layout
