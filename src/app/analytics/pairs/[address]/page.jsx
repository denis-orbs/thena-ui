'use client'

import { useRouter } from 'next/navigation'
import React, { useMemo } from 'react'

import { NeutralBadge } from '@/components/badges/Badge'
import Box from '@/components/box'
import { PrimaryButton, SecondaryButton, TextButton } from '@/components/buttons/Button'
import { TextIconButton } from '@/components/buttons/IconButton'
import IconGroup from '@/components/icongroup'
import CircleImage from '@/components/image/CircleImage'
import Spinner from '@/components/spinner'
import { Paragraph, TextHeading } from '@/components/typography'
import { SCAN_URLS } from '@/constant'
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
            Analytics
          </TextButton>
          <div className='flex flex-col items-start  justify-between gap-4 lg:flex-row lg:items-end'>
            <div className='flex w-full items-center gap-4'>
              <IconGroup
                className='-space-x-4'
                classNames={{
                  image: 'outline-4 w-[48px] h-[48px] lg:w-[56px] lg:h-[56px]',
                }}
                logo1={pair.token0.logoURI}
                logo2={pair.token1.logoURI}
              />
              <div className='flex w-full flex-col gap-0.5 lg:gap-2'>
                <div className='flex items-center justify-between gap-3 lg:justify-start'>
                  <TextHeading className='text-xl leading-normal lg:text-3xl'>{pair.symbol}</TextHeading>
                  <NeutralBadge>{pair.subpools.length} pools</NeutralBadge>
                </div>
                <div className='flex w-full justify-between'>
                  <div className='flex items-center gap-0.5'>
                    <Paragraph className='text-sm'>Fee:</Paragraph>
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
                Add Liquidity
              </SecondaryButton>
              <PrimaryButton>Swap</PrimaryButton>
            </div>
          </div>
        </div>
        <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
          <Box className='flex justify-between'>
            <div className='flex flex-col gap-2'>
              <div className='flex items-center gap-2'>
                <CircleImage className='h-6 w-6' src={pair.token0.logoURI} alt='thena token' />
                <TextHeading className='text-2xl'>{formatAmount(pair.reserve0)}</TextHeading>
              </div>
              <Paragraph>Total {pair.token0.symbol} locked</Paragraph>
            </div>
            <NeutralBadge>
              1 {pair.token0.symbol} = {formatAmount(pair.token0.derived / pair.token1.derived)} {pair.token1.symbol}
            </NeutralBadge>
          </Box>
          <Box className='flex justify-between'>
            <div className='flex flex-col gap-2'>
              <div className='flex items-center gap-2'>
                <CircleImage className='h-6 w-6' src={pair.token1.logoURI} alt='thena token' />
                <TextHeading className='text-2xl'>{formatAmount(pair.reserve1)}</TextHeading>
              </div>
              <Paragraph>Total {pair.token1.symbol} locked</Paragraph>
            </div>
            <NeutralBadge>
              1 {pair.token1.symbol} = {formatAmount(pair.token1.derived / pair.token0.derived)} {pair.token0.symbol}
            </NeutralBadge>
          </Box>
        </div>
        <PairChart pair={pair} />
      </div>
      <TransactionTable pairs={[pair.address]} isFusion={pair.isFusion} />
    </div>
  )
}
