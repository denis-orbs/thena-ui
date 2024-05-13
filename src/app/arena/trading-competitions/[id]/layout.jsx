import { gql } from 'graphql-request'
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
      prize {
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

  const findAsset = assets.data.find(asset => asset.address === competition.prize.token.toLowerCase())

  const metadata = {
    name: competition.name,
    token: findAsset.symbol,
    prize: formatAmount(fromWei(competition.prize.totalPrize, findAsset.decimals)),
    image: [competition.bannerUrl, `${siteConfig.url}/cover.png`],
  }

  return {
    title: `${metadata.name}`,
    description: `Compete in ${metadata.name} for ${metadata.prize} ${metadata.token} today! 
Fully decentralized trading competition on THENA Arena!`,
    openGraph: {
      url: `${siteConfig.url}/arena/trading-competitions/${id}`,
      title: `${metadata.name}`,
      description: `Compete in ${metadata.name} for ${metadata.prize} ${metadata.token} today! 
Fully decentralized trading competition on THENA Arena!`,
      siteName: `${metadata.name} | THENA Arena`,
      images: metadata.image,
      type: 'website',
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${metadata.name}`,
      description: `Compete in ${metadata.name} for ${metadata.prize} ${metadata.token} today! 
Fully decentralized trading competition on THENA Arena!`,
      images: metadata.image,
    },
  }
}
function layout({ children, params }) {
  return <CompetitionDetailLayout params={params}>{children}</CompetitionDetailLayout>
}

export default layout
