'use client'

import { gql } from 'graphql-request'
import { cloneDeep } from 'lodash'
import React, { useMemo } from 'react'
import useSWR from 'swr'

import { useAssets } from '@/context/assetsContext'
import { v4Client } from '@/lib/graphql'

import CompetitionCard from './CompetitionCard'
import DetailCompetition from './DetailCompetition'
import Sidebar from './SideBar'

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
        ownerFee
        weights
      }
      owner {
        id
      }
      participants {
        id
        pnl
      }
      participantCount
      maxParticipants
      competitionRules {
        winningToken
        startingBalance
        tradingTokens
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
  const { data: competition } = useSWR('competition detail api', () => fetchCompetition(id), {
    refreshInterval: 60000,
  })

  const assets = useAssets()

  const _competition = useMemo(() => {
    if (competition) {
      const clone = cloneDeep(competition)

      clone.prize.token = assets.find(ele => ele.address.toLowerCase() === competition?.prize.token.toLowerCase())

      clone.competitionRules.tradingTokens = assets.filter(ele =>
        competition?.competitionRules.tradingTokens.map(sub => sub.toLowerCase()).includes(ele.address),
      )

      clone.competitionRules.winningToken = assets.find(
        ele => ele.address.toLowerCase() === competition?.competitionRules.winningToken.toLowerCase(),
      )
      return clone
    }
    return undefined
  }, [assets, competition])

  if (!competition) {
    return null
  }

  return (
    <div className='grid grid-cols-12 gap-4 lg:gap-12'>
      <div className='col-span-12 lg:col-span-7'>
        <CompetitionCard competition={_competition} />
        <DetailCompetition competition={_competition} />
      </div>
      <Sidebar competition={_competition} />
    </div>
  )
}
