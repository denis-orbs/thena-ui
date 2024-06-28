'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'
import React, { useMemo, useState } from 'react'

import Box from '@/components/box'
import { EmphasisButton } from '@/components/buttons/Button'
import { Collapse } from '@/components/collapse'
import TruncateContent from '@/components/common/TruncateContent'
import CustomTooltip from '@/components/tooltip'
import { Paragraph, TextHeading } from '@/components/typography'
import { TC_MARKET_TYPES, WIN_TYPE } from '@/constant'
import { useCompetitionFormat } from '@/hooks/useCompetitionFormat'
import { formatAmount, fromWei, isInvalidAmount } from '@/lib/utils'

export function CompetitionDetail({ competition, isPreview = false }) {
  const _competition = useCompetitionFormat(competition, isPreview)

  const t = useTranslations()
  const [viewAllPrize, setViewAllPrize] = useState(false)
  const [viewAllTradable, setViewAllTradable] = useState(false)

  const competitionDetail = useMemo(() => {
    const {
      prizeUpdate,
      entryFeeUpdate,
      maxParticipants,
      participantCount,
      competitionRules: { startingBalance, winningToken },
      market,
    } = _competition

    let dataCurrentPrizePool = []
    dataCurrentPrizePool = prizeUpdate.token.map((item, index) => ({
      data: formatAmount(fromWei(prizeUpdate.totalPrize[index], item?.decimals)),
      ticker: item?.symbol,
    }))
    if (dataCurrentPrizePool.some(item => item.data !== '0')) {
      dataCurrentPrizePool = dataCurrentPrizePool.filter(item => item.data !== '0')
    }

    let dataMaxPrizePool = []
    dataMaxPrizePool = prizeUpdate.token.map((item, index) => ({
      data: formatAmount(
        fromWei(prizeUpdate.totalPrize[index]).plus(
          fromWei(entryFeeUpdate[index]).multipliedBy(maxParticipants - participantCount),
        ),
      ),
      ticker: item?.symbol,
    }))
    if (dataMaxPrizePool.some(item => item.data !== '0')) {
      dataMaxPrizePool = dataMaxPrizePool.filter(item => item.data !== '0')
    }

    return [
      {
        key: 'Participants',
        dataUpdate: [{ data: `${_competition.participantCount} / ${_competition.maxParticipants}` }],
      },
      {
        key: 'Entry Fee',
        dataUpdate: entryFeeUpdate.every(entry => isInvalidAmount(entry))
          ? [{ data: t('Free To Join'), ticker: null }]
          : entryFeeUpdate
              .filter(entry => !isInvalidAmount(entry))
              .map((entry, index) => ({
                data: formatAmount(fromWei(entry, prizeUpdate.token?.[index]?.decimals)),
                ticker: prizeUpdate.token?.[index]?.symbol,
              })),
      },
      {
        key: 'Competition Type',
        dataUpdate: [{ data: _competition?.market }],
      },
      {
        key: 'Current Prize Pool',
        dataUpdate: dataCurrentPrizePool,
      },
      {
        key: 'Max Prize Pool',
        dataUpdate: dataMaxPrizePool,
      },
      {
        key: 'Deposit Token',
        dataUpdate: [{ ticker: winningToken?.symbol }],
      },
      {
        key: 'Required Deposit to Join',
        dataUpdate: [
          {
            data: isInvalidAmount(startingBalance)
              ? 'No Requirements'
              : formatAmount(fromWei(startingBalance, winningToken?.decimals)),
            ticker: isInvalidAmount(startingBalance) ? '' : winningToken?.symbol,
          },
        ],
      },
      {
        key: 'Winning Token',
        dataUpdate: [{ ticker: winningToken?.symbol }],
      },
      {
        key: 'Win Type',
        dataUpdate: [
          {
            data: market === TC_MARKET_TYPES.PERPETUAL || prizeUpdate.winType === WIN_TYPE.PNL ? '%PNL' : 'Amount',
          },
        ],
      },
    ]
  }, [_competition, t])

  const prizeDistribution = useMemo(() => {
    const sortedWeights = _competition?.prizeUpdate?.weights.sort((a, b) => b - a)
    return sortedWeights?.map(item => {
      const percentage =
        ((item - (Number(item) / 100) * ((_competition.prizeUpdate.ownerFee / 1000) * 100)) / 1000) * 100
      return {
        data: _competition.prizeUpdate.token.map((prize, idx) => ({
          value: formatAmount(
            fromWei(_competition.prizeUpdate?.totalPrize?.[idx], prize?.decimals).times(percentage / 100),
          ),
          symbol: prize?.symbol ?? '',
          logoURI: prize?.logoURI ?? '',
        })),
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
      <Box>
        <Collapse title={<TextHeading className='text-xl'>{t('Description')}</TextHeading>}>
          <TruncateContent
            content={
              <div
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{ __html: _competition.description }}
                className='mt-4 text-sm text-neutral-300'
              />
            }
          />
        </Collapse>
      </Box>
      <Box>
        <TextHeading className='text-xl'> {t('Details')} </TextHeading>
        <div className='lg: mt-4 grid grid-flow-col grid-rows-4 gap-4 lg:grid-flow-row lg:grid-cols-3 lg:grid-rows-3'>
          {competitionDetail.map((item, index) => (
            <div className='flex flex-col gap-2' key={`${index}-competition-detail`}>
              <TextHeading className='text-lg' data-tooltip-id='token-tooltip'>
                {t(`${item.key}`)}
              </TextHeading>
              {item.dataUpdate.length > 3 && (
                <CustomTooltip id='token-tooltip' className='max-w-[500px]'>
                  {item.dataUpdate
                    .filter(i => i.filter && i.data)
                    .map(({ data, ticker }) => `${data} ${ticker}`)
                    .join(', ')}
                </CustomTooltip>
              )}
              {item.dataUpdate.slice(0, 3).map(({ data, ticker }, idx) =>
                ticker ? (
                  <div className='flex space-x-2' key={`${idx}-${ticker}`}>
                    {ticker !== 'MUSD' && (
                      <Image
                        alt={ticker}
                        src={`https://cdn.thena.fi/assets/${ticker}.png`}
                        className='h-5 w-5 flex-shrink-0'
                        width={20}
                        height={20}
                        loading='lazy'
                      />
                    )}
                    <Paragraph>{`${data ? `${data} ` : ''}${ticker}`}</Paragraph>
                  </div>
                ) : (
                  <Paragraph key={idx}>{data}</Paragraph>
                ),
              )}
            </div>
          ))}
        </div>
      </Box>
      <Box>
        <div className='flex justify-between'>
          <TextHeading className='text-xl'>{t('Prize Distribution')}</TextHeading>
          {prizeDistribution.length > 2 && (
            <EmphasisButton className='p-2 text-xs' onClick={onViewPrize}>
              {viewAllPrize ? t('View Less') : t('View All')}
            </EmphasisButton>
          )}
        </div>
        <div className='mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3'>
          <div className='flex flex-col gap-2'>
            <TextHeading className='text-lg' data-tooltip-id='host-token-tooltip'>
              {t('Host', { percent: (Number(_competition.prizeUpdate?.ownerFee) / 1000) * 100 })}
            </TextHeading>
            {_competition.prizeUpdate?.token?.length > 3 && (
              <CustomTooltip id='host-token-tooltip' className='max-w-[500px]' place='top-start'>
                {_competition.prizeUpdate?.token
                  ?.map(
                    (token, index) =>
                      `${formatAmount(
                        fromWei(_competition.prizeUpdate?.totalPrize?.[index], token?.decimals).times(
                          _competition.prizeUpdate.ownerFee / 1000,
                        ),
                      )} ${token?.symbol ?? ''}`,
                  )
                  .join(', ')}
              </CustomTooltip>
            )}
            {_competition.prizeUpdate?.token?.slice(0.3).map((token, index) => (
              <div className='flex space-x-2' key={index}>
                {token?.logoURI && (
                  <Image
                    alt={_competition.name}
                    src={token.logoURI}
                    className='flex-shrink-0'
                    width={20}
                    height={20}
                    loading='lazy'
                  />
                )}
                <Paragraph>
                  {`${formatAmount(
                    fromWei(_competition.prizeUpdate?.totalPrize?.[index], token?.decimals).times(
                      _competition.prizeUpdate.ownerFee / 1000,
                    ),
                  )} ${token?.symbol ?? ''}`}
                </Paragraph>
              </div>
            ))}
          </div>
          {prizeDistribution.slice(0, viewAllPrize ? prizeDistribution.length : 2).map((item, index) => (
            <div className='flex flex-col gap-2' key={`${index}-prize`}>
              <TextHeading className='text-lg' data-tooltip-id={`place-token-tooltip-${index}`}>
                {t('Place', { value: index + 1, percent: item.percentage })}
              </TextHeading>
              {item.data.length > 3 && (
                <CustomTooltip id={`place-token-tooltip-${index}`} className='max-w-[500px]' place='top-start'>
                  {item.data.map(({ value, symbol }) => `${value} ${symbol}`).join(', ')}
                </CustomTooltip>
              )}
              {item.data.map((itm, i) => (
                <div key={i} className='flex space-x-2'>
                  {itm?.logoURI && (
                    <Image
                      alt={_competition.name}
                      src={itm.logoURI}
                      className='flex-shrink-0'
                      width={20}
                      height={20}
                      loading='lazy'
                    />
                  )}
                  <Paragraph>{`${itm.value} ${itm?.symbol}`}</Paragraph>
                </div>
              ))}
            </div>
          ))}
        </div>
      </Box>
      <Box>
        <div className='flex justify-between'>
          <TextHeading className='text-xl'>
            {_competition.market === TC_MARKET_TYPES.SPOT
              ? t('Tradable Tokens', { value: _competition.competitionRules?.tradingTokens?.length })
              : `${t('Pairs')} (${_competition.competitionRules?.pairIds.length})`}
          </TextHeading>
          {(_competition.market === TC_MARKET_TYPES.SPOT
            ? _competition.competitionRules?.tradingTokens.length > 8
            : _competition.competitionRules?.pairIds.length > 8) && (
            <EmphasisButton className='p-2 text-xs' onClick={onViewTradable}>
              {viewAllTradable ? t('View Less') : t('View All')}
            </EmphasisButton>
          )}
        </div>
        <div className='mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 2xl:grid-cols-4'>
          {_competition.market === TC_MARKET_TYPES.SPOT
            ? _competition.competitionRules?.tradingTokens
                ?.slice(0, viewAllTradable ? _competition.competitionRules?.tradingTokens?.length : 8)
                .map(item => (
                  <Box
                    className='flex items-center space-x-2.5 bg-neutral-800 px-4 py-4 md:space-x-3 lg:px-4 lg:py-4'
                    key={item?.address}
                  >
                    {item?.logoURI && (
                      <Image
                        alt={_competition.name}
                        src={item?.logoURI}
                        className='flex-shrink-0'
                        width={28}
                        height={28}
                        loading='lazy'
                      />
                    )}
                    <div className='flex flex-1 flex-col overflow-hidden text-ellipsis'>
                      <Paragraph className='text-sm'>{item?.symbol}</Paragraph>
                      <Paragraph className='whitespace-nowrap text-sm'>{item?.name}</Paragraph>
                    </div>
                  </Box>
                ))
            : _competition.competitionRules?.pairIds
                ?.slice(0, viewAllTradable ? _competition.competitionRules?.pairIds?.length : 8)
                .map(item => (
                  <Box
                    className='flex items-center space-x-2.5 bg-neutral-800 px-4 py-4 md:space-x-3 lg:px-4 lg:py-4'
                    key={item?.id}
                  >
                    <div className='flex flex-1 flex-col overflow-hidden text-ellipsis'>
                      <Paragraph className='text-sm'>{item?.symbol}</Paragraph>
                    </div>
                  </Box>
                ))}
        </div>
      </Box>
    </>
  )
}
