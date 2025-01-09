'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useMemo } from 'react'

import { NeutralBadge } from '@/components/badges/Badge'
import Box from '@/components/box'
import { PrimaryButton, SecondaryButton, TextButton } from '@/components/buttons/Button'
import { TextIconButton } from '@/components/buttons/IconButton'
import IconGroup from '@/components/icongroup'
import { ThreeIconGroup } from '@/components/icongroup/ThreeIconGroup'
import CircleImage from '@/components/image/CircleImage'
import Spinner from '@/components/spinner'
import { Paragraph, TextHeading } from '@/components/typography'
import { PAIR_TYPES, SCAN_URLS, UNKNOWN_LOGO } from '@/constant'
import { usePairs } from '@/context/pairsContext'
import { formatAmount, goScan } from '@/lib/utils'
import { useChainSettings } from '@/state/settings/hooks'
import { ArrowLeftIcon, ExternalIcon } from '@/svgs'

import PairChart from './PairChart'
import TransactionTable from './PairTransaction'

export default function PairDetailPage({ params }) {
  const { address } = params
  const { push } = useRouter()
  const { networkId } = useChainSettings()
  const { pairs, isLoading } = usePairs()
  const t = useTranslations()

  const pair = useMemo(
    () => (pairs ? pairs.find(ele => ele.address.includes(address.toLowerCase())) : undefined),
    [pairs, address],
  )

  if (isLoading || !pairs || !pair) {
    return (
      <div className='flex w-full items-center'>
        <Spinner />
      </div>
    )
  }
  return (
    <div className='flex flex-col gap-10'>
      <div className='flex flex-col gap-6'>
        <div className='flex flex-col gap-4'>
          <TextButton className='w-fit' LeadingIcon={ArrowLeftIcon} onClick={() => push('/analytics')}>
            {t('Analytics')}
          </TextButton>
          <div className='flex flex-col items-start  justify-between gap-4 lg:flex-row lg:items-end'>
            <div className='flex w-full items-center gap-4'>
              {pair.type === PAIR_TYPES.WEIGHTED ? (
                <ThreeIconGroup
                  className='-space-x-1'
                  classNames={{
                    image: 'w-8 h-8 text-xl font-medium leading-5 text-[#1C2027]',
                  }}
                  logo1={pair?.tokens?.[0].logoURI ?? UNKNOWN_LOGO}
                  logo2={pair?.tokens?.[1].logoURI ?? UNKNOWN_LOGO}
                  extendNumber={(pair?.tokens?.length || 2) - 2}
                />
              ) : (
                <IconGroup
                  className='-space-x-4'
                  classNames={{
                    image: 'outline-4 w-[48px] h-[48px] lg:w-[56px] lg:h-[56px]',
                  }}
                  logo1={pair.token0.logoURI ?? UNKNOWN_LOGO}
                  logo2={pair.token1.logoURI ?? UNKNOWN_LOGO}
                />
              )}
              <div className='flex w-full flex-col gap-0.5 lg:gap-2'>
                <div className='flex items-center justify-between gap-3 lg:justify-start'>
                  <TextHeading className='text-xl leading-normal lg:text-3xl'>{pair.symbol}</TextHeading>
                  <NeutralBadge>
                    {pair.subpools.length} {t('Pools')}
                  </NeutralBadge>
                </div>
                <div className='flex w-full justify-between'>
                  <div className='flex items-center gap-0.5'>
                    <Paragraph className='text-sm'>{t('Fee')}:</Paragraph>
                    <TextHeading className='text-sm'>{pair.fee}%</TextHeading>
                  </div>
                  <TextIconButton
                    className='lg:hidden'
                    Icon={ExternalIcon}
                    onClick={() => {
                      goScan(networkId, pair.address)
                    }}
                  />
                </div>
              </div>
            </div>
            <div className='flex w-full justify-end gap-2'>
              <TextIconButton
                className='hidden lg:flex'
                Icon={ExternalIcon}
                onClick={() => {
                  window.open(`${SCAN_URLS[networkId]}/address/${pair.address}`, '_blank')
                }}
              />
              <SecondaryButton
                onClick={() => {
                  push(`/pools/${pair.address}`)
                }}
              >
                {t('Add Liquidity')}
              </SecondaryButton>
              <PrimaryButton
                onClick={() => {
                  push(`/swap?inputCurrency=${pair.token0.address}&outputCurrency=${pair.token1.address}&swapType=1`)
                }}
              >
                {t('Swap')}
              </PrimaryButton>
            </div>
          </div>
        </div>
        <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
          {pair.type === PAIR_TYPES.WEIGHTED ? (
            <>
              {(pair.tokens || []).map(token => (
                <Box key={token.address} className='flex justify-between'>
                  <div className='flex flex-col gap-2'>
                    <div className='flex items-center gap-2'>
                      <CircleImage className='h-6 w-6' src={token.logoURI ?? UNKNOWN_LOGO} alt='thena token' />
                      <TextHeading className='text-2xl'>{formatAmount(token.reserve)}</TextHeading>
                    </div>
                    <Paragraph>{t('Total [symbol] Locked', { symbol: token.symbol })}</Paragraph>
                  </div>
                  <NeutralBadge>
                    {/* 1 {pair.token0?.symbol} = {formatAmount(pair.token0?.derived / pair.token1?.derived)}{' '} */}
                    {token.symbol}
                  </NeutralBadge>
                </Box>
              ))}
            </>
          ) : (
            <>
              <Box className='flex justify-between'>
                <div className='flex flex-col gap-2'>
                  <div className='flex items-center gap-2'>
                    <CircleImage className='h-6 w-6' src={pair.token0.logoURI ?? UNKNOWN_LOGO} alt='thena token' />
                    <TextHeading className='text-2xl'>{formatAmount(pair.reserve0)}</TextHeading>
                  </div>
                  <Paragraph>{t('Total [symbol] Locked', { symbol: pair.token0.symbol })}</Paragraph>
                </div>
                <NeutralBadge>
                  1 {pair.token0.symbol} = {formatAmount(pair.token0.derived / pair.token1.derived)}{' '}
                  {pair.token1.symbol}
                </NeutralBadge>
              </Box>
              <Box className='flex justify-between'>
                <div className='flex flex-col gap-2'>
                  <div className='flex items-center gap-2'>
                    <CircleImage className='h-6 w-6' src={pair.token1.logoURI ?? UNKNOWN_LOGO} alt='thena token' />
                    <TextHeading className='text-2xl'>{formatAmount(pair.reserve1)}</TextHeading>
                  </div>
                  <Paragraph>{t('Total [symbol] Locked', { symbol: pair.token1.symbol })}</Paragraph>
                </div>
                <NeutralBadge>
                  1 {pair.token1.symbol} = {formatAmount(pair.token1.derived / pair.token0.derived)}{' '}
                  {pair.token0?.symbol}
                </NeutralBadge>
              </Box>
            </>
          )}
        </div>
        <PairChart pair={pair} />
      </div>

      <TransactionTable pair={pair} />
    </div>
  )
}
