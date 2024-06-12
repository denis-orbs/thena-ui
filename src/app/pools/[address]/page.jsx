'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useEffect, useMemo, useState } from 'react'

import Loading from '@/app/loading'
import { NeutralBadge } from '@/components/badges/Badge'
import Box from '@/components/box'
import { TextButton } from '@/components/buttons/Button'
import { TextIconButton } from '@/components/buttons/IconButton'
import AddLiquidity from '@/components/common/AddLiquidity'
import Highlight from '@/components/highlight'
import IconGroup from '@/components/icongroup'
import NextImage from '@/components/image/NextImage'
import CustomTooltip from '@/components/tooltip'
import { Paragraph, TextHeading } from '@/components/typography'
import { useAssets } from '@/context/assetsContext'
import { usePairs } from '@/context/pairsContext'
import { formatAmount, goScan } from '@/lib/utils'
import Position from '@/modules/Position'
import { useChainSettings } from '@/state/settings/hooks'
import { AnalyticsIcon, ArrowLeftIcon, ExternalIcon, InfoCircleWhite } from '@/svgs'

export default function SpecificPoolPage({ params }) {
  const [currentStep, setCurrentStep] = useState(1)
  const t = useTranslations()
  const { address } = params
  const { push } = useRouter()
  const { pairs, isLoading } = usePairs()
  const assets = useAssets()
  const { networkId } = useChainSettings()
  const pool = useMemo(() => pairs.find(ele => ele?.address.toLowerCase() === address.toLowerCase()), [pairs, address])
  const userPools = pool ? pool.subpools.filter(ele => ele.account.totalLp.gt(0)) : []
  const [tvlUSD, setTvlUSD] = useState(0)

  useEffect(() => {
    if (pool) {
      // TODO: hard-coded for SOLVBTC
      if (
        [
          '0x575a951ad021d4297ac125be88ee4620652d5c12',
          '0xab6f06a33f38cba5a5312de24151cb91da2b0eb0',
          '0xfd60a2b164c86751df65c8cf895f7b07e5a48c35',
        ].includes(pool.address)
      ) {
        const token0 = assets.find(item => item.address === pool.token0.address)
        const token1 = assets.find(item => item.address === pool.token1.address)

        if (token0 && token1) {
          setTvlUSD(pool.reserve0 * token0.price + pool.reserve1 * token1.price)
        } else {
          setTvlUSD(pool.tvlUSD)
        }
      } else {
        setTvlUSD(pool.tvlUSD)
      }
    }
  }, [pool, assets])

  if (isLoading || !pool) {
    return <Loading />
  }

  return (
    <div className='flex w-full flex-col items-start gap-12 lg:flex-row'>
      <div className='flex w-full flex-col gap-10'>
        <div>
          <div>
            <TextButton LeadingIcon={ArrowLeftIcon} onClick={() => push('/pools')}>
              {t('Pools')}
            </TextButton>
            <div className='mt-4 flex items-end justify-between'>
              <div className='flex space-x-4'>
                <IconGroup
                  classNames={{
                    image: 'w-[36px] lg:w-[56px]',
                  }}
                  logo1={pool.token0.logoURI}
                  logo2={pool.token1.logoURI}
                />
                <div className='flex flex-col gap-2'>
                  <div className='flex items-center gap-3'>
                    <TextHeading className='text-xl lg:text-4xl'>{pool.symbol}</TextHeading>
                    <NeutralBadge className='relative'>{t(pool.type)}</NeutralBadge>
                  </div>
                  <div className='flex items-center gap-0.5'>
                    <Paragraph>{t('Fee')}:</Paragraph>
                    <TextHeading className='text-sm'>{pool.fee}%</TextHeading>
                  </div>
                </div>
              </div>
              <div className='flex gap-1'>
                <TextIconButton
                  Icon={AnalyticsIcon}
                  onClick={() => push(`/analytics/pairs/${pool?.address}`)}
                  data-tooltip-id='analytics-tooltip'
                />
                <CustomTooltip id='analytics-tooltip' className='rounded-md !py-2' place='top'>
                  <TextHeading className='text-xs'>{t('Analytics')}</TextHeading>
                </CustomTooltip>
                <TextIconButton
                  Icon={ExternalIcon}
                  onClick={() => goScan(networkId, pool?.address)}
                  data-tooltip-id='contract-tooltip'
                />
                <CustomTooltip id='contract-tooltip' className='rounded-md !py-2' place='top'>
                  <TextHeading className='text-xs'>{t('Contract Address')}</TextHeading>
                </CustomTooltip>
              </div>
            </div>
            {pool.address === '0xc0e1c9fec0d8888039095da014382d027f27069d' && (
              <div className='ml-4 mt-5 flex items-center gap-2'>
                <div className='size-6' data-tooltip-id='etherBadgeIconDetail'>
                  <NextImage
                    className='h-full w-full rounded-full object-cover'
                    alt='EtherFi'
                    src='/images/Etherfi.png'
                  />
                </div>

                <div className='size-6' data-tooltip-id='eigenBadgeIconDetail'>
                  <NextImage
                    className='h-full w-full rounded-full object-cover'
                    alt='EigenLayer'
                    src='/images/Eigenlayer.png'
                  />
                </div>
                {/* <EtherFiBadgeIcon className='size-6' data-tooltip-id='etherBadgeIconDetail' />
                <EigenBadgeIcon className='size-6' data-tooltip-id='eigenBadgeIconDetail' /> */}
                <CustomTooltip id='etherBadgeIconDetail' className='rounded-md !py-2' place='top'>
                  <TextHeading className='text-xs'>{t('EtherFi tooltip')}</TextHeading>
                </CustomTooltip>
                <CustomTooltip id='eigenBadgeIconDetail' className='rounded-md !py-2' place='top'>
                  <TextHeading className='text-xs'>{t('Eigen tooltip')}</TextHeading>
                </CustomTooltip>
              </div>
            )}
          </div>
          <Box className='mt-10 grid grid-cols-2 gap-5 lg:grid-cols-4'>
            <div className='flex w-full flex-col gap-2'>
              <TextHeading>{pool.apr}</TextHeading>
              <Paragraph>{t('APR')}</Paragraph>
            </div>
            <div className='flex w-full flex-col gap-2'>
              <TextHeading>${formatAmount(tvlUSD)}</TextHeading>
              <Paragraph>{t('TVL')}</Paragraph>
            </div>
            <div className='flex w-full flex-col gap-2'>
              <TextHeading>${formatAmount(pool.dayVolume)}</TextHeading>
              <Paragraph>{t('Volume (24h)')}</Paragraph>
            </div>
            <div className='flex w-full flex-col gap-2'>
              <TextHeading>${formatAmount(pool.dayFees)}</TextHeading>
              <Paragraph>{t('Fees (24h)')}</Paragraph>
            </div>
          </Box>
        </div>
        <div className='flex flex-col gap-4'>
          <h2>{t('My Positions')}</h2>
          {userPools && userPools.length > 0 ? (
            <div className='grid grid-cols-1 gap-4'>
              {userPools.map(sub => (
                <Position pool={sub} key={sub?.address} />
              ))}
            </div>
          ) : (
            <div className='flex w-full flex-col items-center justify-center gap-4 px-6 py-10'>
              <Highlight>
                <InfoCircleWhite className='h-4 w-4' />
              </Highlight>
              <div className='flex flex-col items-center gap-3'>
                <h2>{t('No Position Found')}</h2>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className='w-full lg:min-w-[564px]'>
        <div className='mb-5 flex items-center gap-2'>
          {currentStep === 2 && <TextIconButton Icon={ArrowLeftIcon} onClick={() => setCurrentStep(1)} />}
          <h2>{t('Add Liquidity')}</h2>
        </div>
        <AddLiquidity pool={pool} currentStep={currentStep} setCurrentStep={setCurrentStep} />
      </div>
    </div>
  )
}
