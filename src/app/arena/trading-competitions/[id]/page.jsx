import { gql } from 'graphql-request'
import React from 'react'

import { v4Client } from '@/lib/graphql'

import CompetitionDetailPage from './CompetitionDetailPage'

const V4_COMPETITION_DATA = gql`
  query V4_COMPETITION($id: String!) {
    tradingCompetitionById(id: $id) {
      description
      id
      name
    }
  }
`
export async function generateMetadata({ params }) {
  const { id } = params

  const { tradingCompetitionById: competition } = await v4Client.request(V4_COMPETITION_DATA, { id })

  return {
    title: `${competition.name} - THENA`,
    description: `${competition.name} - Compete for rewards on THENA’s Trading Competitions!`,
  }
}

function CompetitionDefaultPage({ params }) {
  const { id } = params

  return <CompetitionDetailPage id={id} />
}

export default CompetitionDefaultPage
