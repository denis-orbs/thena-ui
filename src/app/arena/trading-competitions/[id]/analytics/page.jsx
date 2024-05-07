'use client'

import { gql } from 'graphql-request'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useMemo } from 'react'
import useSWR from 'swr'

import Box from '@/components/box'
import { Paragraph, TextHeading } from '@/components/typography'
import { useAssets } from '@/context/assetsContext'
import { v4Client } from '@/lib/graphql'
import { formatAmount, fromWei } from '@/lib/utils'

const V4_TC_ANALYTICS = gql`
  query V4_TC_ANALYTICS($id: String!) {
    tcTrades(where: { tradingCompetition: { id_eq: $id } }) {
      amountIn
      tokenIn {
        id
      }
    }
    tradingCompetitionById(id: $id) {
      participantCount
    }
  }
`

const fetchTCAnalytic = async id => {
  try {
    const { tcTrades, tradingCompetitionById: competition } = await v4Client.request(V4_TC_ANALYTICS, { id })
    return { tcTrades, competition }
  } catch (error) {
    return { error: true }
  }
}

const fetchTCAnalyticData = async id => {
  try {
    const data = await fetchTCAnalytic(id)

    return data
  } catch (error) {
    return { error: true }
  }
}

function AnalyticPage() {
  const t = useTranslations()
  const assets = useAssets()
  const { id } = useParams()

  const { data } = useSWR(['tc analytics api', id], () => fetchTCAnalyticData(id), {
    refreshInterval: 30000,
    revalidateOnFocus: true,
  })

  const valueAnalytics = useMemo(() => {
    let totalVolume = 0
    let numberOfParticipants = 0
    let amountOfTrades = 0

    if (data) {
      amountOfTrades = data.tcTrades.length
      numberOfParticipants = data.competition.participantCount

      data.tcTrades.forEach(item => {
        const asset = assets.find(a => String(a.address).toLowerCase() === String(item.tokenIn?.id))
        const amount = fromWei(item.amountIn).toNumber()
        if (asset) {
          totalVolume += amount * asset.price
        }
      })
    }

    return {
      totalVolume,
      numberOfParticipants,
      amountOfTrades,
    }
  }, [assets, data])

  return (
    <>
      <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
        <TextHeading className='text-xl lg:flex-1'>{t('Analytics')}</TextHeading>
      </div>
      <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
        <Box className='relative'>
          {/* <NeutralBadge className='absolute right-4 top-4 flex gap-2 text-nowrap capitalize lg:text-xs'>
            30%
          </NeutralBadge> */}
          <div className='flex flex-col gap-4'>
            <TextHeading className='text-xl'>${formatAmount(valueAnalytics.totalVolume)}</TextHeading>
            <Paragraph className='text-sm'>{t('Total Volume')}</Paragraph>
          </div>
        </Box>
        {/* <Box className='relative'>
          <NeutralBadge className='absolute right-4 top-4 flex gap-2 text-nowrap capitalize lg:text-xs'>
            32%
          </NeutralBadge>
          <div className='flex flex-col gap-4'>
            <TextHeading className='text-xl'>TBD</TextHeading>
            <Paragraph className='text-sm'>{t('Total Fees')}</Paragraph>
          </div>
        </Box> */}
        <Box className='flex flex-col gap-4'>
          <TextHeading className='text-xl'>{valueAnalytics.numberOfParticipants}</TextHeading>
          <Paragraph className='text-sm'>{t('Number of Participants')}</Paragraph>
        </Box>
        <Box className='flex flex-col gap-4'>
          <TextHeading className='text-xl'>{valueAnalytics.amountOfTrades}</TextHeading>
          <Paragraph className='text-sm'>{t('Amount Of Trades')}</Paragraph>
        </Box>
      </div>
    </>
  )
}

export default AnalyticPage
