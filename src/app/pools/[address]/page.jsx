'use client'

import { useRouter } from 'next/navigation'
import React, { useMemo, useState } from 'react'

import Loading from '@/app/loading'
import { NeutralBadge } from '@/components/badges/Badge'
import Box from '@/components/box'
import { TextButton } from '@/components/buttons/Button'
import { TextIconButton } from '@/components/buttons/IconButton'
import AddLiquidity from '@/components/common/AddLiquidity'
import Highlight from '@/components/highlight'
import IconGroup from '@/components/icongroup'
import CustomTooltip from '@/components/tooltip'
import { Paragraph, TextHeading } from '@/components/typography'
import { usePairs } from '@/context/pairsContext'
import { formatAmount, goScan } from '@/lib/utils'
import Position from '@/modules/Position'
import { useChainSettings } from '@/state/settings/hooks'
import { AnalyticsIcon, ArrowLeftIcon, ExternalIcon, InfoCircleWhite } from '@/svgs'

export default function SpecificPoolPage({ params }) {
  const [currentStep, setCurrentStep] = useState(1)
  const { address } = params
  const { push } = useRouter()
  const { pairs, isLoading } = usePairs()
  const { networkId } = useChainSettings()
  const pool = useMemo(() => pairs.find(ele => ele.address.toLowerCase() === address.toLowerCase()), [pairs, address])
  const userPools = pool ? pool.subpools.filter(ele => ele.account.totalLp.gt(0)) : []
  if (isLoading || !pool) {
    return <Loading />
  }

  return (
    <div className='flex w-full items-start gap-12'>
      <div className='flex w-full flex-col gap-10'>
        <div>
          <div>
            <TextButton LeadingIcon={ArrowLeftIcon} onClick={() => push('/pools')}>
              Pools
            </TextButton>
            <div className='mt-4 flex items-end justify-between'>
              <div className='flex space-x-4'>
                <IconGroup
                  classNames={{
                    image: 'w-[48px] lg:w-[56px]',
                  }}
                  logo1={pool.token0.logoURI}
                  logo2={pool.token1.logoURI}
                />
                <div className='flex flex-col gap-2'>
                  <div className='flex items-center gap-3'>
                    <TextHeading className='text-4xl'>{pool.symbol}</TextHeading>
                    <NeutralBadge>{pool.type}</NeutralBadge>
                  </div>
                  <div className='flex items-center gap-0.5'>
                    <Paragraph>Fee:</Paragraph>
                    <TextHeading className='text-sm'>{pool.fee}%</TextHeading>
                  </div>
                </div>
              </div>
              <div className='flex gap-1'>
                <TextIconButton
                  Icon={AnalyticsIcon}
                  onClick={() => push(`/analytics/pairs/${pool.address}`)}
                  data-tooltip-id='analytics-tooltip'
                />
                <CustomTooltip id='analytics-tooltip' className='rounded-md !py-2' place='top'>
                  <TextHeading className='text-xs'>Analytics</TextHeading>
                </CustomTooltip>
                <TextIconButton
                  Icon={ExternalIcon}
                  onClick={() => goScan(networkId, pool.address)}
                  data-tooltip-id='contract-tooltip'
                />
                <CustomTooltip id='contract-tooltip' className='rounded-md !py-2' place='top'>
                  <TextHeading className='text-xs'>Contract address</TextHeading>
                </CustomTooltip>
              </div>
            </div>
          </div>
          <Box className='mt-10 grid grid-cols-2 gap-5 lg:grid-cols-4'>
            <div className='flex w-full flex-col gap-2'>
              <TextHeading>{pool.apr}</TextHeading>
              <Paragraph>APR</Paragraph>
            </div>
            <div className='flex w-full flex-col gap-2'>
              <TextHeading>${formatAmount(pool.tvlUSD)}</TextHeading>
              <Paragraph>TVL</Paragraph>
            </div>
            <div className='flex w-full flex-col gap-2'>
              <TextHeading>${formatAmount(pool.dayVolume)}</TextHeading>
              <Paragraph>Volume (24h)</Paragraph>
            </div>
            <div className='flex w-full flex-col gap-2'>
              <TextHeading>${formatAmount(pool.dayFees)}</TextHeading>
              <Paragraph>Fees (24h)</Paragraph>
            </div>
          </Box>
        </div>
        <div className='flex flex-col gap-4'>
          <h2>My position</h2>
          {userPools.length > 0 ? (
            <div className='grid grid-cols-1 gap-4'>
              {userPools.map(sub => (
                <Position pool={sub} key={sub.address} />
              ))}
            </div>
          ) : (
            <div className='flex w-full flex-col items-center justify-center gap-4 px-6 py-10'>
              <Highlight>
                <InfoCircleWhite className='h-4 w-4' />
              </Highlight>
              <div className='flex flex-col items-center gap-3'>
                <h2>No position found</h2>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className='hidden min-w-[564px] lg:block'>
        <div className='mb-5 flex items-center gap-2'>
          {currentStep === 2 && <TextIconButton Icon={ArrowLeftIcon} onClick={() => setCurrentStep(1)} />}
          <h2>Add Liquidity</h2>
        </div>
        <AddLiquidity pool={pool} currentStep={currentStep} setCurrentStep={setCurrentStep} />
      </div>
    </div>
  )
}
