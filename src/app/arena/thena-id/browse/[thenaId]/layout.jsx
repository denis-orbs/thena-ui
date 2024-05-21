import { gql } from 'graphql-request'
import React from 'react'

import { siteConfig } from '@/constant/config'
import { v4Client } from '@/lib/graphql'

const V4_USERNAME_NFTS = gql`
  query V4_USERNAME_NFTS($username: String) {
    usernameNfts(where: { name_eq: $username }) {
      id
      name
      imageUrl
    }
  }
`
const V4_AVAILABLE = gql`
  query V4_AVAILABLE($username: String) {
    thenaIdAvailables(where: { name_eq: $username }) {
      id
      name
    }
  }
`

export async function generateMetadata({ params }) {
  const { thenaId } = params

  let thenaIdItem = {}

  const { usernameNfts } = await v4Client.request(V4_USERNAME_NFTS, {
    username: decodeURIComponent(thenaId).toLowerCase(),
  })

  if (usernameNfts && usernameNfts.length > 0) {
    thenaIdItem = usernameNfts?.[0]
  } else {
    const { thenaIdAvailables } = await v4Client.request(V4_AVAILABLE, {
      username: decodeURIComponent(thenaId).toLowerCase(),
    })
    if (thenaIdAvailables && thenaIdAvailables.length) {
      thenaIdItem = thenaIdAvailables?.[0]
    }
  }

  const imageUrl = thenaIdItem.imageUrl || 'https://thena-image-resource.s3.amazonaws.com/thena-id-image-default.png'

  const metadata = {
    name: thenaIdItem?.name ?? 'thena',
    description: `See all the details about ${thenaIdItem?.name ?? 'thena'}.thena on THENA Arena, 
whether it is available or not and more.`,
    image: [imageUrl],
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
