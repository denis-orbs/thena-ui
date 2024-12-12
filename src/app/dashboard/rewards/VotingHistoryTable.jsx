'use client'

import { useTranslations } from 'next-intl'
import React, { useCallback, useMemo, useState } from 'react'

import Highlight from '@/components/highlight'
import IconGroup from '@/components/icongroup'
import { ThreeIconGroup } from '@/components/icongroup/ThreeIconGroup'
import Table from '@/components/table'
import CustomTooltip from '@/components/tooltip'
import { Paragraph, TextHeading } from '@/components/typography'
import { LOCALES, PAIR_TYPES, UNKNOWN_LOGO } from '@/constant'
import { usePairs } from '@/context/pairsContext'
import { formatAmount } from '@/lib/utils'
import { useLocaleSettings } from '@/state/settings/hooks'
import { InfoCircleWhite, InfoIcon } from '@/svgs'

const sortOptions = [
  {
    label: 'Pair',
    value: 'pairMobile',
    width: 'lg:w-[30%] lg:hidden',
  },
  {
    label: 'veTHE ID',
    value: 'veTHEId',
    width: 'lg:w-[8%]',
    isDesc: true,
  },
  {
    label: 'Pair',
    value: 'pair',
    width: 'lg:w-[27%] max-lg:hidden',
  },
  {
    label: 'APR',
    value: 'apr',
    width: 'lg:w-[15%]',
    isDesc: true,
  },
  {
    label: 'My Vote',
    value: 'vote',
    width: 'lg:w-[15%]',
    isDesc: true,
  },
  {
    label: 'Vote Time',
    value: 'voteTime',
    width: 'lg:w-[20%]',
    isDesc: true,
  },
  {
    label: 'My Rewards',
    value: 'rewards',
    width: 'lg:w-[20%]',
    isDesc: true,
  },
]

export default function VotingHistoryTable({ userVotes }) {
  const t = useTranslations()
  const { locale } = useLocaleSettings()
  const [sort, setSort] = useState(sortOptions[0])
  const [currentPage, setCurrentPage] = useState(1)
  const { pairs } = usePairs()
  const data = useMemo(
    () => ({
      ...userVotes,
      userVotes: (userVotes.userVotes || []).map(vote => {
        const pairId = vote?.pool?.id
        const pairData = (pairs || []).find(pair => pair?.address?.toLowerCase() === pairId?.toLowerCase())
        return {
          ...vote,
          pool: pairData,
        }
      }),
    }),
    [pairs, userVotes],
  )

  const voteTime = useCallback(
    unixVoteTime => {
      const date = new Date(unixVoteTime * 1000)
      const year = date.getUTCFullYear()
      const month = date.toLocaleString(locale === LOCALES.zh ? 'zh-CN' : 'en-US', { month: 'short', timeZone: 'UTC' })
      const day = date.getUTCDate()
      const timeUTC = `${date.toISOString().split('T')[1].split('.')[0]} UTC`

      return [`${month} ${day}, ${year}`, timeUTC]
    },
    [locale],
  )

  const finalData = useMemo(
    () =>
      (data.userVotes || []).map(vote => ({
        veTHEId: <span>{`${data.tokenId}`}</span>,
        pair: (
          <div className='flex flex-row items-center gap-1'>
            {vote?.pool?.type === PAIR_TYPES.WEIGHTED ? (
              <ThreeIconGroup
                className='-space-x-1'
                classNames={{
                  image: 'w-7 h-7 text-xl font-medium leading-5 text-[#1C2027]',
                }}
                logo1={vote.pool?.tokens?.[0].logoURI ?? UNKNOWN_LOGO}
                logo2={vote.pool?.tokens?.[1].logoURI ?? UNKNOWN_LOGO}
                extendNumber={(vote.pool?.tokens?.length || 2) - 2}
              />
            ) : (
              <IconGroup
                className='-space-x-1'
                classNames={{
                  image: 'outline-4 w-7 h-7',
                }}
                logo1={vote?.pool?.token0?.logoURI ?? UNKNOWN_LOGO}
                logo2={vote?.pool?.token1?.logoURI ?? UNKNOWN_LOGO}
              />
            )}
            <div className='flex flex-col'>
              <TextHeading>{vote?.pool?.symbol}</TextHeading>
              <Paragraph>{vote?.pool?.type}</Paragraph>
            </div>
          </div>
        ),
        pairMobile: (
          <div className='flex flex-row items-center gap-1'>
            {vote?.pool?.type === PAIR_TYPES.WEIGHTED ? (
              <ThreeIconGroup
                className='-space-x-1'
                classNames={{
                  image: 'w-7 h-7 text-xl font-medium leading-5 text-[#1C2027]',
                }}
                logo1={vote.pool?.tokens?.[0].logoURI ?? UNKNOWN_LOGO}
                logo2={vote.pool?.tokens?.[1].logoURI ?? UNKNOWN_LOGO}
                extendNumber={(vote.pool?.tokens?.length || 2) - 2}
              />
            ) : (
              <IconGroup
                className='-space-x-1'
                classNames={{
                  image: 'outline-4 w-7 h-7',
                }}
                logo1={vote?.pool?.token0?.logoURI ?? UNKNOWN_LOGO}
                logo2={vote?.pool?.token1?.logoURI ?? UNKNOWN_LOGO}
              />
            )}
            <div className='flex flex-col'>
              <TextHeading>{vote?.pool?.symbol}</TextHeading>
              <Paragraph>{vote?.pool?.type}</Paragraph>
            </div>
          </div>
        ),
        apr: <Paragraph>{formatAmount(123.45)}%</Paragraph>,

        vote: (
          <div className='flex flex-col'>
            <TextHeading>{formatAmount((vote.vetheBalance / 100) * vote.weight)}</TextHeading>
            <Paragraph>{formatAmount(vote.weight)}%</Paragraph>
          </div>
        ),
        voteTime: (
          <div className='flex flex-col'>
            <TextHeading>{voteTime(vote.lastUpdate)?.[0]}</TextHeading>
            <Paragraph>{voteTime(vote.lastUpdate)?.[1]}</Paragraph>
          </div>
        ),
        rewards: (
          <div className='flex items-center gap-1'>
            <Paragraph className='min-w-0 flex-1 truncate'>TODO API</Paragraph>
            <InfoIcon className='size-4 stroke-neutral-400' data-tooltip-id={`tvl-${vote.id}`} />
            <CustomTooltip id={`tvl-${vote.id}`}>
              <div className='flex flex-col gap-1'>
                <p>{`${formatAmount(0)} BNB`}</p>
                <p>{`${formatAmount(0)} THE`}</p>
              </div>
            </CustomTooltip>
          </div>
        ),
        className: 'bg-neutral-900',
      })),
    [data.tokenId, data.userVotes, voteTime],
  )

  return (
    <>
      {finalData.length > 0 ? (
        <Table
          sortOptions={sortOptions}
          data={finalData}
          sort={sort}
          setSort={setSort}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          pageSize={10}
          notAction
          className='max-lg:bg-transparent max-lg:p-0'
          classNames={{ tableContainer: 'max-lg:flex max-lg:flex-col max-lg:gap-4' }}
        />
      ) : (
        <div className='flex w-full flex-col items-center justify-center gap-4 px-6 py-[120px]'>
          <Highlight>
            <InfoCircleWhite className='h-4 w-4' />
          </Highlight>
          <div className='flex flex-col items-center gap-3'>
            <h2>{t('No voting history')}</h2>
            <Paragraph className='mt-3 text-center'>{t('You have no voting history to show.')}</Paragraph>
          </div>
        </div>
      )}
    </>
  )
}
