'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'
import React, { useMemo, useState } from 'react'

import Box from '@/components/box'
import { EmphasisButton } from '@/components/buttons/Button'
import { Collapse } from '@/components/collapse'
import { Paragraph, TextHeading } from '@/components/typography'
import { useCompetitionFormat } from '@/hooks/useCompetitionFormat'
import { formatAmount, fromWei, isInvalidAmount } from '@/lib/utils'

export function CompetitionDetail({ competition, isPreview = false }) {
  const _competition = useCompetitionFormat(competition, isPreview)

  const t = useTranslations()
  const [viewAllPrize, setViewAllPrize] = useState(false)
  const [viewAllTradable, setViewAllTradable] = useState(false)

  const competitionDetail = useMemo(() => {
    const {
      entryFee,
      maxParticipants,
      participantCount,
      prize: { token: prizeToken, totalPrize, hostContribution },
      competitionRules: { startingBalance, winningToken },
    } = _competition
    return [
      {
        key: 'Participants',
        data: `${_competition.participantCount} / ${_competition.maxParticipants}`,
      },
      {
        key: 'Entry Fee',
        data: isInvalidAmount(entryFee) ? t('Free To Join') : formatAmount(fromWei(entryFee, prizeToken?.decimals)),
        ticker: isInvalidAmount(entryFee) ? null : prizeToken?.symbol,
      },
      {
        key: 'Competition Type',
        data: _competition?.market,
      },
      {
        key: 'Current Prize Pool',
        data: formatAmount(fromWei(totalPrize, prizeToken?.decimals)),
        ticker: prizeToken?.symbol,
      },
      {
        key: 'Max Prize Pool',
        data: formatAmount(
          fromWei(totalPrize).plus(fromWei(entryFee).multipliedBy(maxParticipants - participantCount)),
        ),
        ticker: prizeToken?.symbol,
      },
      {
        key: 'Host Contribution',
        data: formatAmount(fromWei(hostContribution, prizeToken?.decimals)),
        ticker: prizeToken?.symbol,
      },
      {
        key: 'Deposit Token',
        ticker: winningToken?.symbol,
      },
      {
        key: 'Required Deposit To Join',
        data: isInvalidAmount(startingBalance)
          ? 'No Requirements'
          : formatAmount(fromWei(startingBalance, winningToken?.decimals)),
        ticker: isInvalidAmount(startingBalance) ? '' : winningToken?.symbol,
      },
      {
        key: 'Winning Token',
        ticker: winningToken?.symbol,
      },
    ]
  }, [_competition, t])

  const prizeDistribution = useMemo(() => {
    const sortedWeights = _competition?.prize?.weights.sort((a, b) => b - a)
    return sortedWeights?.map(item => {
      const percentage = ((item - (Number(item) / 100) * ((_competition.prize.ownerFee / 1000) * 100)) / 1000) * 100
      return {
        data: formatAmount(
          fromWei(_competition.prize?.totalPrize, _competition.prize?.token?.decimals).times(percentage / 100),
        ),
        percentage: formatAmount(percentage),
      }
    })
  }, [_competition])

  const onViewPrize = () => {
    setViewAllPrize(!viewAllPrize)
  }

  const onViewTradable = () => {
    setViewAllTradable(!viewAllTradable)
  }

  return (
    <>
      {' '}
      <Box>
        <Collapse title={<TextHeading className='text-xl'>{t('Description')}</TextHeading>}>
          <div
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: _competition.description }}
            className='mt-4 text-sm text-neutral-300'
          />
        </Collapse>
      </Box>
      <Box>
        <TextHeading className='text-xl'> {t('Details')} </TextHeading>
        <div className='lg: mt-4 grid grid-flow-col grid-rows-4 gap-4 lg:grid-flow-row lg:grid-cols-3 lg:grid-rows-3'>
          {competitionDetail.map((item, index) => (
            <div className='flex flex-col gap-2' key={`${index}-competition-detail`}>
              <TextHeading className='text-lg'>{t(`${item.key}`)}</TextHeading>
              {item.ticker ? (
                <div className='flex space-x-2'>
                  <Image
                    alt={item.ticker}
                    src={`https://cdn.thena.fi/assets/${item.ticker}.png`}
                    className='flex-shrink-0'
                    width={20}
                    height={20}
                    loading='lazy'
                  />
                  <Paragraph>{`${item.data ? `${item.data} ` : ''}${item.ticker}`}</Paragraph>
                </div>
              ) : (
                <Paragraph>{item.data}</Paragraph>
              )}
            </div>
          ))}
        </div>
      </Box>
      <Box>
        <div className='flex justify-between'>
          <TextHeading className='text-xl'> {t('Prize Distribution')} </TextHeading>
          {prizeDistribution.length > 2 && (
            <EmphasisButton className='p-2 text-xs' onClick={onViewPrize}>
              {viewAllPrize ? t('View Less') : t('View All')}
            </EmphasisButton>
          )}
        </div>
        <div className='mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3'>
          <div className='flex flex-col gap-2'>
            <TextHeading className='text-lg'>
              {t('Host', { percent: (Number(_competition.prize?.ownerFee) / 1000) * 100 })}
            </TextHeading>
            <div className='flex space-x-2'>
              {_competition.prize?.token?.logoURI && (
                <Image
                  alt={_competition.name}
                  src={_competition.prize.token.logoURI}
                  className='flex-shrink-0'
                  width={20}
                  height={20}
                  loading='lazy'
                />
              )}
              <Paragraph>
                {`${formatAmount(
                  fromWei(_competition.prize?.totalPrize, _competition.prize?.token?.decimals).times(
                    _competition.prize.ownerFee / 1000,
                  ),
                )} ${_competition.prize?.token?.symbol}`}
              </Paragraph>
            </div>
          </div>
          {prizeDistribution.slice(0, viewAllPrize ? prizeDistribution.length : 2).map((item, index) => (
            <div className='flex flex-col gap-2' key={`${index}-prize`}>
              <TextHeading className='text-lg'>
                {t('Place', { value: index + 1, percent: item.percentage })}
              </TextHeading>
              <div className='flex space-x-2'>
                {_competition.prize?.token?.logoURI && (
                  <Image
                    alt={_competition.name}
                    src={_competition.prize.token.logoURI}
                    className='flex-shrink-0'
                    width={20}
                    height={20}
                    loading='lazy'
                  />
                )}
                <Paragraph>{`${item.data} ${_competition.prize?.token?.symbol}`}</Paragraph>
              </div>
            </div>
          ))}
        </div>
      </Box>
      <Box>
        <div className='flex justify-between'>
          <TextHeading className='text-xl'>
            {t('Tradable Tokens', { value: _competition.competitionRules?.tradingTokens?.length })}
          </TextHeading>
          {_competition.competitionRules?.tradingTokens.length > 8 && (
            <EmphasisButton className='p-2 text-xs' onClick={onViewTradable}>
              {viewAllTradable ? t('View Less') : t('View All')}
            </EmphasisButton>
          )}
        </div>
        <div className='mt-4 grid  grid-cols-2 gap-4 lg:grid-cols-4'>
          {_competition.competitionRules?.tradingTokens
            ?.slice(0, viewAllTradable ? _competition.competitionRules?.tradingTokens?.length : 7)
            .map(item => (
              <Box
                className='flex items-center space-x-2.5 bg-neutral-800 px-4 py-4 md:space-x-3 lg:px-4 lg:py-4'
                key={item.address}
              >
                {item?.logoURI && (
                  <Image
                    alt={_competition.name}
                    src={item.logoURI}
                    className='flex-shrink-0'
                    width={28}
                    height={28}
                    loading='lazy'
                  />
                )}
                <div className='flex flex-col'>
                  <Paragraph className='text-sm'>{item.symbol}</Paragraph>
                  <Paragraph className='text-nowrap text-sm'>{item.name}</Paragraph>
                </div>
              </Box>
            ))}
        </div>
      </Box>
    </>
  )
}
