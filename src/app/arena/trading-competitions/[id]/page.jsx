'use client'

import React from 'react'
import useSWR from 'swr'

import CompetitionDetail from './CompetitionDetail'

function CompetitionDefaultPage() {
  const { data: competition } = useSWR('competition detail api')

  return <CompetitionDetail competition={competition} />
}

export default CompetitionDefaultPage
