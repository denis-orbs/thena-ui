'use client'

import { gql } from 'graphql-request'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'

import Box from '@/components/box'
import { EmphasisButton } from '@/components/buttons/Button'
import Table from '@/components/table'
import { Paragraph, TextHeading } from '@/components/typography'
import { useAssets } from '@/context/assetsContext'
import { v4Client } from '@/lib/graphql'
import { formatAmount, fromWei } from '@/lib/utils'

const V4_TOP_COMPETITION_DESC = gql`
  query V4_TOP_COMPETITIONS_DESC {
    tradingCompetitions(orderBy: [participantCount_DESC, id_ASC]) {
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

const V4_TOP_COMPETITION_ASC = gql`
  query V4_TOP_COMPETITIONS_ASC {
    tradingCompetitions(orderBy: [participantCount_ASC, id_ASC]) {
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

const fetchTopCompetition = async direction => {
  try {
    const { tradingCompetitions: topCompetition } = await v4Client.request(
      direction === 'DESC' ? V4_TOP_COMPETITION_DESC : V4_TOP_COMPETITION_ASC,
    )
    return topCompetition
  } catch (error) {
    console.log(error)
    return { error: true }
  }
}

function TopCompetition() {
  const pathname = usePathname()
  const isAll = pathname.includes('/competitions')

  const sortOptions = useMemo(
    () => [
      {
        label: <span>#</span>,
        value: 'rank',
        width: 'w-[10%]',
        disabled: true,
      },
      {
        label: 'Competition name',
        value: 'competitionName',
        width: isAll ? 'w-[50%]' : 'w-[15%]',
        disabled: true,
      },
      {
        label: 'Participants',
        value: 'participants',
        isDesc: true,
      },
      {
        label: 'Volume',
        value: 'volume',
      },
    ],
    [isAll],
  )

  const assets = useAssets()
  const [currentPage, setCurrentPage] = useState(1)
  const [sort, setSort] = useState(sortOptions[2])

  const [direction, setDirection] = useState('DESC')

  const t = useTranslations()

  const { data: topTCRes } = useSWR(['top competition api', direction], () => fetchTopCompetition(direction), {
    refreshInterval: 30000,
    revalidateOnFocus: true,
  })

  useEffect(() => {
    if (sort.value === 'participants') {
      setDirection(sort.isDesc ? 'DESC' : 'ASC')
    }
    setCurrentPage(1)
  }, [sort.value, sort.isDesc])

  const calcTotalVolume = useCallback(
    comp => {
      let volume = 0

      comp.tcTrades.forEach(tcTrade => {
        const asset = assets.find(a => a.address.toLowerCase() === tcTrade.tokenIn.id.toLowerCase())
        if (asset) {
          volume += fromWei(tcTrade.amountIn).toNumber() * asset.price
        }
      })

      return volume
    },
    [assets],
  )

  const competitions = useMemo(() => {
    if (topTCRes && Array.isArray(topTCRes) && !topTCRes.errors) {
      let rank = 0
      let arr = []
      if (sort.value === 'participants') {
        let prevCount = -1

        arr = topTCRes.map((item, index) => {
          const volume = calcTotalVolume(item)

          if (item.participantCount !== prevCount) {
            rank = index + 1
            prevCount = item.participantCount
          }

          return {
            rank,
            competitionName: item.name,
            participants: item.participantCount,
            volume,
          }
        })
      } else {
        // Sort by Total Volume
        const temp = topTCRes.map(item => {
          const volume = calcTotalVolume(item)

          return {
            competitionName: item.name,
            participants: item.participantCount,
            volume,
          }
        })
        let prevVol = -1
        if (sort.isDesc) {
          temp.sort((a, b) => b.volume - a.volume)
        } else {
          temp.sort((a, b) => a.volume - b.volume)
        }
        arr = temp.map((item, index) => {
          if (item.volume !== prevVol) {
            rank = index + 1
            prevVol = item.volume
          }

          return {
            ...item,
            rank,
          }
        })
      }

      return arr
    }

    return []
  }, [topTCRes, calcTotalVolume, sort.value, sort.isDesc])

  const finalData = useMemo(
    () =>
      competitions?.map(item => ({
        rank: <Paragraph>{item.rank}</Paragraph>,
        competitionName: (
          <Paragraph className='max-w-[200px] truncate md:max-w-[400px]'>{item.competitionName}</Paragraph>
        ),
        participants: <Paragraph>{item.participants}</Paragraph>,
        volume: <Paragraph>${formatAmount(item.volume)}</Paragraph>,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(competitions)],
  )

  return (
    <div className='z-10 col-span-12 mt-2 lg:sticky lg:top-56 lg:col-span-5 lg:max-h-[500px]'>
      <Box>
        <div className='flex lg:flex-row lg:items-center lg:justify-between'>
          <TextHeading className='text-xl'>{t('Top competitions')}</TextHeading>
          {!isAll && (
            <Link href='/arena/rankings/competitions'>
              <EmphasisButton>{t('View all')}</EmphasisButton>
            </Link>
          )}
        </div>
        <div>
          <Table
            sortOptions={sortOptions}
            sort={sort}
            setSort={setSort}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            tableBasic
            data={isAll ? finalData : finalData.slice(0, 5)}
          />
        </div>
      </Box>
    </div>
  )
}

export default TopCompetition
