import { gql } from 'graphql-request'
import { compact } from 'lodash'

import { siteConfig } from '@/constant/config'
import { ArenaClient } from '@/lib/graphql'

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

  const { tradingCompetitionById: competition } = await ArenaClient.request(V4_COMPETITION_DATA, { id })

  const metadata = {
    name: `Analytics of ${competition.name ?? 'competition'}`,
    image: compact([competition?.bannerUrl, competition?.defaultBannerUrl, siteConfig.tcBanner])[0],
    description: `Analyze ${competition?.name ?? 'competition'} on THENA Arena and see the volume traded, 
the number of transactions and a lot more.`,
  }

  return {
    title: metadata.name,
    description: metadata.description,
    openGraph: {
      url: `${siteConfig.url}/arena/trading-competitions/${id}/analytics`,
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
