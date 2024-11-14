'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useEffect, useMemo, useState } from 'react'

import Loading from '@/app/loading'
import { NeutralBadge } from '@/components/badges/Badge'
import Box from '@/components/box'
import { PrimaryButton, TextButton } from '@/components/buttons/Button'
import { TextIconButton } from '@/components/buttons/IconButton'
import Highlight from '@/components/highlight'
import IconGroup from '@/components/icongroup'
import { ThreeIconGroup } from '@/components/icongroup/ThreeIconGroup'
import NextImage from '@/components/image/NextImage'
import CustomTooltip from '@/components/tooltip'
import { Paragraph, TextHeading } from '@/components/typography'
import { useAssets } from '@/context/assetsContext'
import { useManuals } from '@/context/manualsContext'
import { usePairs } from '@/context/pairsContext'
import { formatAddress, formatAmount, goScan } from '@/lib/utils'
import { InitialLiquidityTable } from '@/modules/Pools/InitialLiquidityTable'
import { LiquidityFeesTable } from '@/modules/Pools/LiquidityFeesTable'
import { PoolChart } from '@/modules/Pools/PoolCharts'
import Position from '@/modules/Position'
import ManualPosition from '@/modules/Position/ManualPosition'
import { WeightedPoolPosition } from '@/modules/Position/WeightedPoolPosition'
import { useChainSettings } from '@/state/settings/hooks'
import { AnalyticsIcon, ArrowLeftIcon, ExternalIcon, InfoCircleWhite, LinkExternalIcon } from '@/svgs'

import { listPoolAddressSpecial } from '../page'

const mockAddress = '0x8d4fDb401F059E114a6E84453cE89745A061900A'
// export const mockIsWeighted = true
export const mockTokens = [
  {
    symbol: 'USDT',
    logoURI: 'https://cdn.thena.fi/assets/USDT.png',
  },
  {
    symbol: 'THE',
    logoURI: 'https://cdn.thena.fi/assets/THE.png',
  },
  {
    symbol: 'BNB',
    logoURI: 'https://cdn.thena.fi/assets/WBNB.png',
  },
  {
    symbol: 'ETH',
    logoURI: 'https://cdn.thena.fi/assets/ETH.png',
  },
  {
    symbol: 'USDT',
    logoURI: 'https://cdn.thena.fi/assets/USDT.png',
  },
  {
    symbol: 'THE',
    logoURI: 'https://cdn.thena.fi/assets/THE.png',
  },
  {
    symbol: 'BNB',
    logoURI: 'https://cdn.thena.fi/assets/WBNB.png',
  },
  {
    symbol: 'ETH',
    logoURI: 'https://cdn.thena.fi/assets/ETH.png',
  },
]

export default function SpecificPoolPage({ params }) {
  const t = useTranslations()
  const { address } = params
  const { push } = useRouter()
  const manuals = useManuals()
  const { pairs, isLoading } = usePairs()
  const assets = useAssets()
  const { networkId } = useChainSettings()
  const pool = useMemo(() => pairs.find(ele => ele?.address.toLowerCase() === address.toLowerCase()), [pairs, address])
  const userPools = pool ? pool?.subpools.filter(ele => ele.account.totalLp.gt(0)) : []
  const userManuals = pool
    ? manuals.filter(
        ele =>
          [pool?.token0.address, pool?.token1.address].includes(ele.token0Address.toLowerCase()) &&
          [pool?.token0.address, pool?.token1.address].includes(ele.token1Address.toLowerCase()),
      )
    : []
  const userPositions = [...userPools, ...userManuals]
  const [tvlUSD, setTvlUSD] = useState(0)
  const mockIsWeighted = address === 'new'

  useEffect(() => {
    if (pool) {
      // TODO: hard-coded for USDT/arcUSD
      if (['0xfd60a2b164c86751df65c8cf895f7b07e5a48c35'].includes(pool?.address)) {
        const token0 = assets.find(item => item.address === pool?.token0.address)
        const token1 = assets.find(item => item.address === pool?.token1.address)

        if (token0 && token1) {
          // eslint-disable-next-line no-unsafe-optional-chaining
          setTvlUSD(pool?.reserve0 * token0.price + pool?.reserve1 * token1.price)
        } else {
          setTvlUSD(pool?.tvlUSD)
        }
      } else {
        setTvlUSD(pool?.tvlUSD)
      }
    }
  }, [pool, assets])

  if (!mockIsWeighted && (isLoading || !pool)) {
    return <Loading />
  }

  return (
    <div className='flex w-full flex-col items-start gap-6 lg:flex-col'>
      <div className='flex w-full flex-col gap-10'>
        <div>
          <TextButton LeadingIcon={ArrowLeftIcon} onClick={() => push('/pools')}>
            {t('Pools')}
          </TextButton>
          <div className='mt-4 items-start justify-between lg:flex'>
            <div>
              {!mockIsWeighted ? (
                <div className='flex space-x-4'>
                  <IconGroup
                    classNames={{
                      image: 'w-[36px] lg:w-[56px]',
                    }}
                    logo1={pool?.token0.logoURI}
                    logo2={pool?.token1.logoURI}
                  />
                  <div className='flex items-center gap-2'>
                    <div className='flex items-center gap-3'>
                      <TextHeading className='text-xl lg:text-4xl'>{pool?.symbol}</TextHeading>
                    </div>
                  </div>
                </div>
              ) : (
                <div className='flex space-x-4'>
                  <ThreeIconGroup
                    classNames={{
                      image: 'w-[36px] lg:w-[56px] h-[36px] lg:h-[56px] text-xl font-medium leading-5 text-[#1C2027]',
                    }}
                    logo1={pool?.token0?.logoURI ?? mockTokens[0].logoURI}
                    logo2={pool?.token1?.logoURI ?? mockTokens[1].logoURI}
                    extendNumber={6}
                  />
                  <div className='flex items-center gap-2 lg:max-w-[75%]'>
                    <div className='flex w-full flex-wrap items-center gap-1 lg:gap-3'>
                      {mockTokens.map((token, index) => (
                        <div className='flex items-center gap-1' key={index}>
                          <span className='text-xl font-semibold leading-10 lg:text-4xl'>{token.symbol}</span>
                          <span className='text-sm leading-10 text-neutral-300 lg:text-[26px]'>12.5%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className='my-4 flex gap-3 lg:mb-0 lg:mt-6'>
                <NeutralBadge className='inline text-[14px] font-normal leading-5 text-neutral-50'>
                  {t(pool?.type ?? 'Weighted')}
                </NeutralBadge>
                <NeutralBadge className='inline text-[14px] font-normal leading-5'>
                  <span className='text-neutral-300 '>{t('Fee')}: </span>
                  <span className='text-neutral-50'>{pool?.fee}%</span>
                </NeutralBadge>
              </div>
            </div>
            <div className='flex w-full gap-3 lg:w-auto'>
              <TextIconButton
                className='h-11 w-11 border-[1px] border-neutral-600'
                Icon={ExternalIcon}
                onClick={() => goScan(networkId, pool?.address)}
                data-tooltip-id='contract-tooltip'
              />
              <CustomTooltip id='contract-tooltip' className='rounded-md !py-2' place='top'>
                <TextHeading className='text-xs'>{t('Contract Address')}</TextHeading>
              </CustomTooltip>
              <TextIconButton
                className='h-11 w-11 border-[1px] border-neutral-600'
                Icon={AnalyticsIcon}
                onClick={() => push(`/analytics/pairs/${pool?.address}`)}
                data-tooltip-id='analytics-tooltip'
              />
              <CustomTooltip id='analytics-tooltip' className='rounded-md !py-2' place='top'>
                <TextHeading className='text-xs'>{t('Analytics')}</TextHeading>
              </CustomTooltip>
              <Link className='flex-auto' href={`/pools/add-liquidity?pool=${pool?.address}&step=1`}>
                <PrimaryButton className='h-11 w-max'>{t('Add Liquidity')}</PrimaryButton>
              </Link>
            </div>
          </div>
          {pool?.address === '0xc0e1c9fec0d8888039095da014382d027f27069d' && (
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
              <CustomTooltip id='etherBadgeIconDetail' className='rounded-md !py-2' place='top'>
                <TextHeading className='text-xs'>{t('EtherFi tooltip')}</TextHeading>
              </CustomTooltip>
              <CustomTooltip id='eigenBadgeIconDetail' className='rounded-md !py-2' place='top'>
                <TextHeading className='text-xs'>{t('Eigen tooltip')}</TextHeading>
              </CustomTooltip>
            </div>
          )}
          {listPoolAddressSpecial.includes(pool?.address) && (
            <div className='ml-4 mt-5 flex items-center gap-2'>
              <div className='size-6' data-tooltip-id={`pool-${pool?.address}`}>
                <NextImage
                  className='h-full w-full rounded-full object-cover'
                  alt='EtherFi'
                  src='/images/GQhgnIEbUAA4gjewe.jpeg'
                />
              </div>
              <CustomTooltip id={`pool-${pool?.address}`} className='rounded-md !py-2' place='top'>
                <TextHeading className='text-xs'>{t('Pool Special tooltip')}</TextHeading>
              </CustomTooltip>
            </div>
          )}
          {pool?.address === '0xcfac0990700ed9b67fefbd4b26a79e426468a419' && (
            <div className='mt-5 flex gap-2'>
              <div className='flex items-center gap-2'>
                <div className='size-6' data-tooltip-id={`pool-special-${pool?.address}-tooltip1`}>
                  <NextImage
                    className='h-full w-full rounded-full object-cover'
                    alt='YieldNest’s'
                    src='/images/yieldnest_seed_3d__1__360.png'
                  />
                </div>
                <CustomTooltip id={`pool-special-${pool?.address}-tooltip1`} className='rounded-md !py-2' place='top'>
                  <TextHeading className='text-xs'>
                    {t('Liquidity providers in this pool are eligible for YieldNest’s 4X Seeds Boost')}
                  </TextHeading>
                </CustomTooltip>
              </div>
              <div className='flex items-center gap-2'>
                <div className='size-6' data-tooltip-id={`pool-special-${pool?.address}-tooltip2`}>
                  <NextImage
                    className='h-full w-full rounded-full object-cover'
                    alt='Turtle'
                    src='/images/Turtle-Seeds.svg'
                  />
                </div>
                <CustomTooltip id={`pool-special-${pool?.address}-tooltip2`} className='rounded-md !py-2' place='top'>
                  <TextHeading className='text-xs'>
                    {t('Liquidity providers in this pool are eligible for Turtle Club 10% emission boost')}
                  </TextHeading>
                </CustomTooltip>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className='-col flex w-full flex-col-reverse gap-10 lg:flex-row'>
        <div className='flex w-full flex-col gap-8'>
          <div className='flex w-full flex-col gap-6'>
            <Box className='grid grid-cols-2 gap-5 lg:grid-cols-4'>
              <div className='flex w-full flex-col gap-2'>
                <TextHeading>{pool?.apr ?? '24%'}</TextHeading>
                <Paragraph>{t('APR')}</Paragraph>
              </div>
              <div className='flex w-full flex-col gap-2'>
                <TextHeading className='w-full min-w-0 truncate'>${formatAmount(tvlUSD)}</TextHeading>
                <Paragraph>{t('TVL')}</Paragraph>
              </div>
              <div className='flex w-full flex-col gap-2'>
                <TextHeading className='w-full min-w-0 truncate'>${formatAmount(pool?.dayVolume)}</TextHeading>
                <Paragraph>{t('Volume (24h)')}</Paragraph>
              </div>
              <div className='flex w-full flex-col gap-2'>
                <TextHeading className='w-full min-w-0 truncate'>${formatAmount(pool?.dayFees)}</TextHeading>
                <Paragraph>{t('Fees (24h)')}</Paragraph>
              </div>
            </Box>
          </div>

          <div>
            <PoolChart address={address} />
          </div>

          <div className='flex flex-col gap-4'>
            <TextHeading className='font-archia text-[30px] font-semibold leading-[34px]'>
              {t('Liquidity Fees')}
            </TextHeading>
            <LiquidityFeesTable pool={pool} mockIsWeighted={mockIsWeighted} />
          </div>

          <div className='flex flex-col gap-4'>
            <TextHeading className='font-archia text-[30px] font-semibold leading-[34px]'>
              {t('Pool Attributes')}
            </TextHeading>
            <div className='flex flex-col gap-4 rounded-lg bg-neutral-900 p-6 text-[14px] font-normal leading-5'>
              <div className='grid grid-cols-7'>
                <div className='col-span-2 text-neutral-300'>{t('Name')}:</div>
                <div className='col-span-5 text-neutral-50'>{pool?.symbol}</div>
              </div>
              <div className='grid grid-cols-7'>
                <div className='col-span-2 text-neutral-300'>{t('Symbol')}:</div>
                <div className='col-span-5 text-neutral-50'>{pool?.symbol}</div>
              </div>
              <div className='grid grid-cols-7'>
                <div className='col-span-2 text-neutral-300'>{t('Type')}:</div>
                <div className='col-span-5 text-neutral-50'>{pool?.type}</div>
              </div>
              <div className='grid grid-cols-7'>
                <div className='col-span-2 text-neutral-300'>{t('Swap fees')}:</div>
                <div className='col-span-5 text-neutral-50'>
                  {pool?.fee}% ({t('editable by governance')})
                </div>
              </div>
              <div className='grid grid-cols-7'>
                <div className='col-span-2 text-neutral-300'>{t('Protocol version')}:</div>
                <div className='col-span-5 text-neutral-50'>{t('THENA V3')}</div>
              </div>
              <div className='grid grid-cols-7'>
                <div className='col-span-2 text-neutral-300'>{t('Pool Owner')}:</div>
                <div className='col-span-5 text-neutral-50'>
                  <Link href={`/arena/profile/${mockAddress}`} className='item-center flex cursor-pointer'>
                    <span>{formatAddress(mockAddress)}</span>
                    <LinkExternalIcon className='inline-block h-4 w-4' />
                  </Link>
                </div>
              </div>
              <div className='grid grid-cols-7'>
                <div className='col-span-2 text-neutral-300'>{t('Attribute immutability')}:</div>
                <div className='col-span-5 text-neutral-50'>
                  {t('Immutable except for swap fees editable by governance')}
                </div>
              </div>
              <div className='grid grid-cols-7'>
                <div className='col-span-2 text-neutral-300'>{t('Creation date')}:</div>
                <div className='col-span-5 text-neutral-50'>Oct 31, 2024, 3 PM UTC</div>
              </div>
              <div className='grid grid-cols-7'>
                <div className='col-span-2 text-neutral-300'>{t('LP token price')}:</div>
                <div className='col-span-5 text-neutral-50'>$225.50</div>
              </div>
              <div className='grid grid-cols-7'>
                <div className='col-span-2 text-neutral-300'>{t('Pool address')}:</div>
                <div className='col-span-5 text-neutral-50'>
                  <Link href='/' className='item-center flex cursor-pointer'>
                    <span>{formatAddress(mockAddress)}</span>
                    <LinkExternalIcon className='inline-block h-4 w-4' />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
        {!mockIsWeighted && (
          <div className='flex  flex-col gap-4 lg:min-w-[564px] lg:max-w-[564px]'>
            <h2>{t('My Positions')}</h2>
            {userPositions && userPositions.length > 0 ? (
              <div className='grid grid-cols-1 gap-4'>
                {userPositions.map((ele, idx) =>
                  ele.type === 'Manual' ? (
                    <ManualPosition pool={ele} key={`pool-${idx}`} />
                  ) : (
                    <Position pool={ele} key={ele?.address} />
                  ),
                )}
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
        )}
        {mockIsWeighted && (
          <div>
            <div className='flex  flex-col gap-4 lg:min-w-[564px] lg:max-w-[564px]'>
              <h2>{t('My Positions')}</h2>
              <WeightedPoolPosition pool={pool} />
            </div>
            <div className='mt-8  flex flex-col gap-4 lg:min-w-[564px] lg:max-w-[564px]'>
              <h2>{t('My Initial Liquidity')}</h2>
              <InitialLiquidityTable pool={pool} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
