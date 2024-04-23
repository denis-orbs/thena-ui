'use client'

import { gql } from 'graphql-request'
import React, { useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'

import Box from '@/components/box'
import { EmphasisButton } from '@/components/buttons/Button'
import Table from '@/components/table'
import { Paragraph, TextHeading } from '@/components/typography'
import { useAssets } from '@/context/assetsContext'
import { v4Client } from '@/lib/graphql'
import { formatAmount, fromWei } from '@/lib/utils'

const V4_TOP_COMPETITION = gql`
  query V4_TOP_COMPETITION {
    tradingCompetitions(orderBy: participantCount_DESC) {
      id
      tcTrades {
        amountIn
        id
        tokenIn {
          id
        }
      }
      participantCount
      name
    }
  }
`

const fetchTopCompetition = async () => {
  try {
    const { tradingCompetitions: topCompetition } = await v4Client.request(V4_TOP_COMPETITION)
    return topCompetition
  } catch (error) {
    return { error: true }
  }
}

function TopCompetition() {
  const { data: topCompetition } = useSWR('top competition api', () => fetchTopCompetition(), {
    refreshInterval: 30000,
    revalidateOnFocus: true,
  })

  const sortOptions = useMemo(
    () => [
      {
        label: <span>#</span>,
        value: 'rank',
        width: 'w-[10%]',
        isDesc: false,
      },
      {
        label: 'Competition name',
        value: 'competitionName',
        width: 'w-[15%]',
        isDesc: true,
      },
      {
        label: 'Participants',
        value: 'participants',
        isDesc: true,
      },
      {
        label: 'Volume',
        value: 'volume',
        isDesc: true,
      },
    ],
    [],
  )

  const assets = useAssets()
  const [currentPage, setCurrentPage] = useState(1)
  const [sort, setSort] = useState(sortOptions[2])
  const [dataFetch, setDataFetch] = useState([])

  useEffect(() => {
    if (topCompetition) {
      const arr = topCompetition.map((item, index) => {
        let volume = 0

        item.tcTrades.forEach(tcTrade => {
          const asset = assets.find(a => a.address.toLowerCase() === tcTrade.tokenIn.id.toLowerCase())
          if (asset) {
            volume += fromWei(tcTrade.amountIn).toNumber() * asset.price
          }
        })

        return {
          rank: index + 1,
          competitionName: item.name,
          participants: item.participantCount,
          volume,
        }
      })

      setDataFetch(arr)
    }
  }, [topCompetition, assets])

  const sortedData = useMemo(
    () =>
      dataFetch?.sort((a, b) => {
        let res
        switch (sort.value) {
          case 'rank':
            res = (a.rank - b.rank) * (sort.isDesc ? -1 : 1)
            break
          case 'competitionName':
            res = a.competitionName.localeCompare(b.competitionName) * (sort.isDesc ? -1 : 1)
            break
          case 'participants':
            res = (a.participants - b.participants) * (sort.isDesc ? -1 : 1)
            break
          case 'volume':
            res = (a.volume - b.volume) * (sort.isDesc ? -1 : 1)
            break
          default:
            break
        }
        return res
      }),
    [dataFetch, sort.isDesc, sort.value],
  )

  const finalData = useMemo(
    () =>
      sortedData?.map(item => ({
        rank: <Paragraph>{item.rank}</Paragraph>,
        competitionName: <Paragraph className='max-w-[140px] truncate'>{item.competitionName}</Paragraph>,
        participants: <Paragraph>{item.participants}</Paragraph>,
        volume: <Paragraph>{formatAmount(item.volume)}</Paragraph>,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(sortedData)],
  )

  return (
    <div className='col-span-12 mt-2 lg:sticky lg:top-56 lg:col-span-5 lg:max-h-[500px]'>
      <Box>
        <div className='flex lg:flex-row lg:items-center lg:justify-between'>
          <TextHeading className='text-xl'>Top competitions</TextHeading>
          <EmphasisButton>View All</EmphasisButton>
        </div>
        <div>
          <Table
            sortOptions={sortOptions}
            sort={sort}
            setSort={setSort}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            tableBasic
            data={finalData.slice(0, 5)}
          />
        </div>
      </Box>
    </div>
  )
}

export default TopCompetition
