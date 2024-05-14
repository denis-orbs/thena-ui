import { gql } from 'graphql-request'
import React from 'react'

import { siteConfig } from '@/constant/config'
import { v4Client } from '@/lib/graphql'
import { formatAddress } from '@/lib/utils'

const V4_USER_META_DATA = gql`
  query V4_USER_META($address: String!) {
    users(
      where: { OR: [{ username_eq: $address }, { id_eq: $address }, { usernameNfts_some: { name_eq: $address } }] }
      limit: 1
    ) {
      id
      username
    }
  }
`

export async function generateMetadata({ params }) {
  const { address } = params

  const { users } = await v4Client.request(V4_USER_META_DATA, { address })

  const username = users?.[0] ? users[0]?.username || formatAddress(users[0]?.id) : 'username'

  const metadata = {
    name: username,
    image: [`${siteConfig.url}/cover.png`],
    description: `See the profile of ${username} on THENA Arena. 
Follow them, engage with them or check their analytics and THENA
IDs out on the decentralized social media platform of THENA Arena`,
  }

  return {
    title: {
      template: '%s | THENA Arena',
      default: `${metadata.name} | THENA Arena`,
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
