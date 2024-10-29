/* eslint-disable max-len */
import { gql } from 'graphql-request'
import { compact } from 'lodash'
import React from 'react'

import { siteConfig } from '@/constant/config'
import { v4Client } from '@/lib/graphql'
import { formatAmount, fromWei } from '@/lib/utils'

import CompetitionDetailLayout from './CompetitionDetailLayout'

const V4_COMPETITION_DATA = gql`
  query V4_COMPETITION($id: String!) {
    tradingCompetitionById(id: $id) {
      description
      id
      name
      bannerUrl
      defaultBannerUrl
      prizeUpdate {
        totalPrize
        token
      }
    }
  }
`
export async function generateMetadata({ params }) {
  const { id } = params

  const assets = await fetch('https://api.thena.fi/api/v1/assets', {
    method: 'get',
  }).then(res => res.json())

  const { tradingCompetitionById: competition } = await v4Client.request(V4_COMPETITION_DATA, { id })

  const findAssets = (competition?.prizeUpdate?.token || []).map(token => {
    const asset = assets?.data.find(ele => ele.address.toLowerCase() === token.toLowerCase())
    return asset
  })

  const prizeData = findAssets.reduce(
    (sum, asset, index) => sum + fromWei(competition?.prizeUpdate?.totalPrize[index], asset.decimals) * asset.price,
    0,
  )

  const metadata = {
    name: competition?.name ?? 'competition',
    image: compact([competition?.bannerUrl, competition?.defaultBannerUrl, siteConfig.tcBanner])[0],
    prizeData: `$${formatAmount(prizeData)}`,
  }

  return {
    title: {
      template: '%s | THENA Arena',
      default: metadata.name,
    },
    description: `Compete in ${metadata.name} for ${metadata.prizeData} today!  Fully decentralized trading competition on THENA Arena!`,
    openGraph: {
      url: `${siteConfig.url}/arena/trading-competitions/${id}`,
      title: {
        template: '%s | THENA Arena',
        default: `${metadata.name}`,
      },
      siteName: `${metadata.name} | THENA Arena`,
      description: `Compete in ${metadata.name} for ${metadata.prizeData} today! Fully decentralized trading competition on THENA Arena!`,
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
      description: `Compete in ${metadata.name} for ${metadata.prizeData} today! 
Fully decentralized trading competition on THENA Arena!`,
      images: metadata.image,
    },
  }
}
function layout({ children, params }) {
  return <CompetitionDetailLayout params={params}>{children}</CompetitionDetailLayout>
}

export default layout
