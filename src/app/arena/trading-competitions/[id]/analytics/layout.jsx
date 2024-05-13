import { gql } from 'graphql-request'

import { siteConfig } from '@/constant/config'
import { v4Client } from '@/lib/graphql'

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

  const { tradingCompetitionById: competition } = await v4Client.request(V4_COMPETITION_DATA, { id })

  const metadata = {
    name: `Analytics of ${competition.name}`,
    image: [competition.bannerUrl, `${siteConfig.url}/cover.png`],
    description: `Analyze ${competition.name} on THENA Arena and see the volume traded, 
the number of transactions and a lot more.`,
  }

  return {
    title: metadata.name,
    description: metadata.description,
    openGraph: {
      url: `${siteConfig.url}/arena/trading-competitions/${id}/analytics`,
      title: metadata.name,
      description: metadata.description,
      siteName: `Analytics of ${metadata.name} | THENA Arena`,
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
