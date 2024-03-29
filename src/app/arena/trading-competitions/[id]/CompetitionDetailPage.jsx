'use client'

import { gql } from 'graphql-request'
import React from 'react'
import useSWRImmutable from 'swr/immutable'

import { v4Client } from '@/lib/graphql'

import CompetitionCard from './CompetitionCard'
import DetailCompetition from './DetailCompetition'
// import Sidebar from './SideBar'

const V4_COMPETITION_DATA = gql`
  query V4_COMPETITION($id: String!) {
    tradingCompetitionById(id: $id) {
      description
      id
      name
      entryFee
      timestamp {
        endTimestamp
        registrationEnd
        startTimestamp
      }
      market
      prize {
        totalPrize
        token
        winType
        hostContribution
      }
      owner {
        id
      }
      participantCount
      maxParticipants
      competitionRules {
        winningToken
        startingBalance
      }
    }
  }
`

const fetchCompetition = async id => {
  try {
    const { tradingCompetitionById: competition } = await v4Client.request(V4_COMPETITION_DATA, { id })
    return competition
  } catch (error) {
    return { error: true }
  }
}

export default function CompetitionDetailPage({ id }) {
  const { data: competition } = useSWRImmutable('competition detail api', () => fetchCompetition(id))

  if (!competition) return null
  return (
    <div className='grid grid-cols-12 gap-12'>
      <div className='col-span-12 lg:col-span-7'>
        <CompetitionCard competition={competition} />
        <DetailCompetition />
      </div>
      {/* <Sidebar /> */}
    </div>
  )
}
