import { gql } from 'graphql-request'
import { compact } from 'lodash'
import React from 'react'

import { siteConfig } from '@/constant/config'
import { v4Client } from '@/lib/graphql'

import { WrapLayout } from './WrapLayout'

const V4_COMPETITION_DATA = gql`
  query V4_COMPETITION($id: String!) {
    tradingCompetitionById(id: $id) {
      description
      id
      name
      bannerUrl
      defaultBannerUrl
      prize {
        totalPrize
        token
      }
    }
  }
`

export async function generateMetadata({ params }) {
  const { id } = params

  const { tradingCompetitionById: competition } = await v4Client.request(V4_COMPETITION_DATA, { id })

  const metadata = {
    name: `Trading Page of ${competition?.name ?? 'competition'}`,
    image: compact([competition?.bannerUrl, competition?.defaultBannerUrl, siteConfig.tcBanner])[0],
    description: `Trade within ${competition?.name ?? 'competition'} on THENA Arena using your deposited balance.`,
  }

  return {
    title: metadata.name,
    description: metadata.description,
    openGraph: {
      url: `${siteConfig.url}/arena/trading-competitions/${id}/trade`,
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

export default function layout({ children, params }) {
  return <WrapLayout params={params}>{children}</WrapLayout>
}
