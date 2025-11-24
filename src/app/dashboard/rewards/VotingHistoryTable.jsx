'use client'

import { useTranslations } from 'next-intl'
import React, { useCallback, useMemo, useState } from 'react'

import Highlight from '@/components/highlight'
import IconGroup from '@/components/icongroup'
import Table from '@/components/table'
import CustomTooltip from '@/components/tooltip'
import { Paragraph, TextHeading } from '@/components/typography'
import { LOCALES, UNKNOWN_LOGO } from '@/constant'
import { useAssets } from '@/context/assetsContext'
import InfoIcon from '@/icons/InfoIcon'
import { usePools } from '@/state/pools/hooks'
import { useLocaleSettings } from '@/state/settings/hooks'
import { formatAmount } from '@/utils/utils'

const sortOptions = [
  {
    label: 'Pair',
    value: 'pairMobile',
    width: 'lg:w-[30%] lg:hidden',
    disabled: true,
  },
  {
    label: 'veTHE ID',
    value: 'veTHEId',
    width: 'lg:w-[8%]',
    isDesc: true,
    disabled: true,
  },
  {
    label: 'Pair',
    value: 'pair',
    width: 'lg:w-[27%] max-lg:hidden',
    disabled: true,
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
    disabled: true,
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
  const [sort, setSort] = useState(sortOptions[5])
  const [currentPage, setCurrentPage] = useState(1)
  const pools = usePools()
  const assets = useAssets()

  const groupedVotes = useMemo(
    () =>
      userVotes.votes.flatMap(vote =>
        vote.poolVotes.map(poolVote => {
          const rewards = (poolVote.rewards || []).map(reward => {
            const asset = assets.find(item => item?.address?.toLowerCase() === reward?.token?.toLowerCase())
            return {
              ...asset,
              amount: +reward.amount || 0,
            }
          })
          const pairData = (pools || []).find(
            pair => pair?.address?.toLowerCase() === poolVote?.pool?.id?.toLowerCase(),
          )
          return {
            tokenId: vote.tokenId,
            epochStartTimestamp: vote.epochStartTimestamp,
            vetheBalance: vote.vetheBalance,
            weight: poolVote.weight,
            lastUpdate: poolVote.lastUpdate,
            pool: pairData,
            rewards,
            apr: poolVote.apr,
          }
        }),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [assets, JSON.stringify(pools), userVotes.votes],
  )

  const calRewardUsd = useCallback(
    rewards => (rewards || []).reduce((sum, reward) => sum + reward.price * reward.amount, 0),
    [],
  )

  const sortedData = useMemo(
    () =>
      !groupedVotes
        ? []
        : groupedVotes.sort((a, b) => {
            let res = 0
            switch (sort.value) {
              case 'apr':
                res = (a.apr - b.apr) * (sort.isDesc ? -1 : 1)
                break
              case 'voteTime':
                res = (a.lastUpdate - b.lastUpdate) * (sort.isDesc ? -1 : 1)
                break
              case 'rewards':
                res = (calRewardUsd(a.rewards) - calRewardUsd(b.rewards)) * (sort.isDesc ? -1 : 1)
                break

              default:
                break
            }
            return res
          }),
    [calRewardUsd, groupedVotes, sort.isDesc, sort.value],
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
      (sortedData || []).map(vote => ({
        veTHEId: vote.tokenId,
        pair: (
          <div className='flex flex-row items-center gap-1'>
            <IconGroup
              className='*:not-first:-ml-1'
              classNames={{
                image: 'outline-4 w-7 h-7',
              }}
              logo1={vote?.pool?.token0?.logoURI ?? UNKNOWN_LOGO}
              logo2={vote?.pool?.token1?.logoURI ?? UNKNOWN_LOGO}
            />
            <div className='flex flex-col'>
              <TextHeading>{vote?.pool?.symbol}</TextHeading>
              <Paragraph>{vote?.pool?.title === 'CL_Farming' ? 'Conc. Liquidity' : vote?.pool?.title}</Paragraph>
            </div>
          </div>
        ),
        pairMobile: (
          <div className='flex flex-row items-center gap-1'>
            <IconGroup
              className='*:not-first:-ml-1'
              classNames={{
                image: 'outline-4 w-7 h-7',
              }}
              logo1={vote?.pool?.token0?.logoURI ?? UNKNOWN_LOGO}
              logo2={vote?.pool?.token1?.logoURI ?? UNKNOWN_LOGO}
            />
            <div className='flex flex-col'>
              <TextHeading>{vote?.pool?.symbol}</TextHeading>
              <Paragraph>{vote?.pool?.type}</Paragraph>
            </div>
          </div>
        ),
        apr: <Paragraph>{formatAmount(vote.apr)}%</Paragraph>,

        vote: (
          <div className='flex flex-col'>
            <TextHeading>{formatAmount((parseFloat(vote.vetheBalance) / 100) * vote.weight)}</TextHeading>
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
            <Paragraph className='min-w-0 flex-1 truncate'>${formatAmount(calRewardUsd(vote.rewards))}</Paragraph>
            {vote.rewards?.length > 0 && (
              <>
                <InfoIcon data-tooltip-id={`my-reward-${vote.tokenId}-${vote.pool?.address}`} />
                <CustomTooltip id={`my-reward-${vote.tokenId}-${vote.pool?.address}`}>
                  {(vote.rewards || []).every(item => +item.amount === 0) ? (
                    <>
                      {(vote.rewards || []).map((reward, index) => (
                        <p key={`${reward.address}-${index}-my-reward`}>
                          {`${formatAmount(reward?.amount)} ${reward?.symbol || 'UNKNOWN'}`}
                        </p>
                      ))}
                    </>
                  ) : (
                    <>
                      {(vote.rewards || []).map((reward, index) => (
                        <p key={`${reward.address}-${index}-my-reward`}>
                          {reward?.amount > 0 ? (
                            <>
                              {formatAmount(reward?.amount)} {reward?.symbol || 'UNKNOWN'}
                            </>
                          ) : (
                            <></>
                          )}
                        </p>
                      ))}
                    </>
                  )}
                </CustomTooltip>
              </>
            )}
          </div>
        ),
        className: 'bg-neutral-900',
      })),
    [calRewardUsd, sortedData, voteTime],
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
            <InfoIcon className='stroke-neutral-50' />
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
