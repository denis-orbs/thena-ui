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
    name: `Followers of ${username}`,
    image: [`${siteConfig.url}/cover.png`],
    description: `See the full followers list of ${username} on THENA Arena.`,
  }

  return {
    title: metadata.name,
    description: metadata.description,
    openGraph: {
      url: `${siteConfig.url}/arena/profile/${address}/followers`,
      title: metadata.name,
      description: metadata.description,
      siteName: `Followers of ${username} | THENA Arena`,
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
