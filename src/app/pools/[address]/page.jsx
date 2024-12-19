'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useMemo, useState } from 'react'

import Loading from '@/app/loading'
import { NeutralBadge } from '@/components/badges/Badge'
import Box from '@/components/box'
import { PrimaryButton, TextButton } from '@/components/buttons/Button'
import { TextIconButton } from '@/components/buttons/IconButton'
import Highlight from '@/components/highlight'
import IconGroup from '@/components/icongroup'
import { ThreeIconGroup } from '@/components/icongroup/ThreeIconGroup'
import NextImage from '@/components/image/NextImage'
import Modal from '@/components/modal'
import CustomTooltip from '@/components/tooltip'
import { Paragraph, TextHeading } from '@/components/typography'
import { PAIR_TYPES, UNKNOWN_LOGO } from '@/constant'
import { useManuals } from '@/context/manualsContext'
import { usePairs } from '@/context/pairsContext'
import { useWindowSize } from '@/hooks/useWindowSize'
import { useWeightPoolData } from '@/hooks/weightedPool/useWeigtedPool'
import { formatAmount, goScan, isInvalidAmount } from '@/lib/utils'
import { LiquidityFeesTable } from '@/modules/Pools/LiquidityFeesTable'
import { NormalPoolAttributes, PoolAttributesCL } from '@/modules/Pools/PoolAttributes'
import { PoolChart } from '@/modules/Pools/PoolCharts'
import Position from '@/modules/Position'
import ManualPosition from '@/modules/Position/ManualPosition'
import { WeightedPoolPosition } from '@/modules/Position/WeightedPoolPosition'
import { useV3MintState } from '@/state/fusion/hooks'
import { useChainSettings } from '@/state/settings/hooks'
import { AnalyticsIcon, ArrowLeftIcon, ExternalIcon, InfoCircleWhite } from '@/svgs'

import Liquidity from './Liquidity'
import { listPoolAddressSpecial } from '../page'

const BNBLpBNBPoolAdress = '0x47600bc3ae9b5b97ef92a55e550066944fe17670'
const BTCBmBTCAddress = '0x01e4a13b64a35ec29c490374c0ac6a585ff7ce79' // BTCB/mBTC

function NoPosition() {
  const t = useTranslations()
  return (
    <div className='flex w-full flex-col items-center justify-center gap-4 rounded-xl border border-neutral-800 px-6 py-10'>
      <Highlight>
        <InfoCircleWhite className='h-4 w-4' />
      </Highlight>
      <div className='flex flex-col items-center gap-3'>
        <h2>{t('No Position Found')}</h2>
      </div>
    </div>
  )
}

export default function SpecificPoolPage({ params }) {
  const t = useTranslations()
  const { address } = params
  const { push } = useRouter()
  const manuals = useManuals()
  const { pairs, isLoading } = usePairs()
  const { networkId } = useChainSettings()

  const windowSize = useWindowSize()

  const [showModalAdd, setShowModalAdd] = useState(false)

  const { strategy } = useV3MintState()

  const pool = useMemo(
    () => pairs.find(ele => ele?.address.toLowerCase() === address.toLowerCase()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [address, JSON.stringify(pairs)],
  )

  const { balance: weightedPoolBalance } = useWeightPoolData(pool?.type === PAIR_TYPES.WEIGHTED ? pool.address : null)

  const userPools = useMemo(() => (pool ? (pool?.subpools || []).filter(ele => ele.account.totalLp.gt(0)) : []), [pool])
  const userManuals = useMemo(
    () =>
      pool && pool.type !== PAIR_TYPES.WEIGHTED
        ? manuals.filter(
            ele =>
              [pool?.token0.address, pool?.token1.address].includes(ele.token0Address.toLowerCase()) &&
              [pool?.token0.address, pool?.token1.address].includes(ele.token1Address.toLowerCase()),
          )
        : [],
    [manuals, pool],
  )

  const userPositions = useMemo(
    () => [...userPools, ...userManuals].filter(position => position.version === 3).filter(item => Boolean(item)),
    [userManuals, userPools],
  )

  if (isLoading || !pool) {
    return <Loading />
  }

  return (
    <div>
      {/* Title section */}
      <div>
        <TextButton LeadingIcon={ArrowLeftIcon} onClick={() => push('/pools')}>
          {t('Pools')}
        </TextButton>
        {/* Title */}
        <div className='mb-6 mt-4'>
          <div>
            {pool.type !== PAIR_TYPES.WEIGHTED ? (
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
              <div className='flex'>
                <ThreeIconGroup
                  classNames={{
                    image: 'w-[36px] lg:w-[56px] h-[36px] lg:h-[56px] text-xl font-medium leading-5 text-[#1C2027]',
                  }}
                  logo1={pool?.tokens?.[0].logoURI ?? UNKNOWN_LOGO}
                  logo2={pool?.tokens?.[1].logoURI ?? UNKNOWN_LOGO}
                  extendNumber={(pool?.tokens?.length || 2) - 2}
                />
                <div className='flex items-center gap-2'>
                  <div className='flex w-full flex-wrap items-center gap-1 lg:gap-3'>
                    {(pool?.tokens || []).map(token => (
                      <div className='flex items-center gap-1' key={token?.address}>
                        <span className='text-xl font-semibold leading-10 lg:text-4xl'>{token?.symbol}</span>
                        <span className='text-sm leading-10 text-neutral-300 lg:text-[26px]'>
                          {formatAmount(token?.weight)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className='flex w-full flex-col sm:gap-2 lg:flex-row lg:gap-5 xl:gap-10 2xl:gap-12'>
        <div className='flex-[6] flex-col gap-8'>
          {/* Pool Overview */}
          <div className='mb-6 flex items-center justify-between gap-3 lg:mb-7'>
            <div className='flex gap-3'>
              <NeutralBadge className='inline text-[14px] font-normal leading-5 text-neutral-50'>
                {t(pool?.type ?? 'Weighted')}
              </NeutralBadge>
              <NeutralBadge className='inline whitespace-nowrap text-[14px] font-normal leading-5'>
                <span className='text-neutral-300 '>{t('Fee')}: </span>
                <span className='text-neutral-50'>{pool?.fee}%</span>
              </NeutralBadge>
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
            </div>
          </div>

          {/* Code for special pools */}
          <>
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

            {pool.address === BNBLpBNBPoolAdress && (
              <>
                <div className='ml-4 mt-5 flex items-center gap-2'>
                  <div className='size-6' data-tooltip-id='BNBLpBNBPoolAdress'>
                    <NextImage
                      className='h-full w-full rounded-full object-cover'
                      alt='Quaaloop'
                      src='/images/quaaloop.png'
                    />
                  </div>
                  <CustomTooltip id='BNBLpBNBPoolAdress' className='rounded-md !py-2' place='top'>
                    <TextHeading className='text-xs'>{t('Quaaloops Boost')}</TextHeading>
                  </CustomTooltip>
                </div>
              </>
            )}

            {pool.address === BTCBmBTCAddress && (
              <>
                <div className='ml-4 mt-5 flex items-center gap-2'>
                  <div className='flex size-8 items-center rounded-full bg-white' data-tooltip-id='BTCBmBTCAddress'>
                    <NextImage
                      className='w-full rounded-full object-cover'
                      alt='Quaaloop'
                      src='/images/babbypieBirdLogo.png'
                    />
                  </div>
                  <CustomTooltip id='BTCBmBTCAddress' className='rounded-md !py-2' place='top'>
                    <TextHeading className='text-xs'>{t("Babypie's Liquidity RUSH campaign")}</TextHeading>
                  </CustomTooltip>
                </div>
              </>
            )}

            {listPoolAddressSpecial.includes(pool.address) && (
              <div className='mb-5 ml-4 mt-4 flex items-center gap-2'>
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
                  <CustomTooltip id={`pool-special-${pool.address}-tooltip1`} className='rounded-md !py-2' place='top'>
                    <TextHeading className='text-xs'>{t('Seeds Boost')}</TextHeading>
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
          </>

          {/* Mobile pool stats */}
          <div className='flex w-full flex-col gap-6 lg:hidden'>
            <Box className='grid grid-cols-2 gap-5 lg:grid-cols-4'>
              <div className='flex w-full flex-col gap-2'>
                <TextHeading>{pool?.apr || '0%'}</TextHeading>
                <Paragraph>{t('APR')}</Paragraph>
              </div>
              <div className='flex w-full flex-col gap-2'>
                <TextHeading className='w-full min-w-0 truncate'>${formatAmount(pool?.tvlUSD)}</TextHeading>
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

          {/* Desktop pool stats */}
          <div className='mb-6 hidden w-full flex-col gap-6 lg:flex'>
            <TextHeading className='font-archia text-4xl font-semibold leading-[34px]'>{t('Pool Info')}</TextHeading>
            <Box className='grid grid-cols-2 gap-5 lg:grid-cols-4'>
              <div className='flex w-full flex-col gap-2'>
                <TextHeading>{pool?.apr ?? '0%'}</TextHeading>
                <Paragraph>{t('APR')}</Paragraph>
              </div>
              <div className='flex w-full flex-col gap-2'>
                <TextHeading className='w-full min-w-0 truncate'>${formatAmount(pool?.tvlUSD)}</TextHeading>
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

          {/* Pool charts */}
          <div className='mb-6 mt-6'>
            <PoolChart address={address} />
          </div>

          {/* Liquidity Fees table */}
          <div className='mb-6 flex flex-col gap-4'>
            <div className='mb-6 flex flex-col gap-4'>
              <TextHeading className='font-archia text-[30px] font-semibold leading-[34px]'>
                {t('Liquidity Fees')}
              </TextHeading>
              <LiquidityFeesTable pool={pool} />
            </div>

            {/* Pool attributes */}
            <div className='flex flex-col gap-4'>
              <TextHeading className='font-archia text-[30px] font-semibold leading-[34px]'>
                {t('Pool Attributes')}
              </TextHeading>
              {pool.type === PAIR_TYPES.LSD ? (
                <>
                  {strategy ? (
                    <PoolAttributesCL strategy={strategy} pool={pool} />
                  ) : (
                    <div className='flex w-full flex-col items-center justify-center gap-4 rounded-xl border border-neutral-800 px-6 py-[120px]'>
                      <Highlight>
                        <InfoCircleWhite className='h-4 w-4' />
                      </Highlight>
                      <div className='flex flex-col items-center gap-3'>
                        <h2>{t('Select Pool Strategy')}</h2>
                        <Paragraph className='mt-3 text-center'>
                          {t("You have to select the pool strategy first to see it's [symbol]", { text: 'attributes' })}
                        </Paragraph>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <NormalPoolAttributes pool={pool} />
              )}
            </div>
          </div>
        </div>

        <div className='flex-[4] flex-col gap-12'>
          <div className='mt-[72px] max-lg:hidden'>
            <Liquidity pool={pool} />
          </div>

          {/* User positions */}
          <div className='mt-6 space-y-4'>
            <TextHeading className='font-archia text-[30px] font-semibold leading-[34px]'>
              {t('My Positions')}
            </TextHeading>
            <div className='grid grid-cols-1 gap-4'>
              {pool.type === PAIR_TYPES.WEIGHTED ? (
                <>{!isInvalidAmount(weightedPoolBalance) ? <WeightedPoolPosition pool={pool} /> : <NoPosition />}</>
              ) : userPositions && userPositions.length > 0 ? (
                userPositions.map((ele, idx) =>
                  ele.type === 'Manual' ? (
                    <ManualPosition pool={ele} key={`pos-${idx}`} />
                  ) : (
                    <Position pool={ele} key={ele?.address} />
                  ),
                )
              ) : (
                <NoPosition />
              )}
            </div>
          </div>
        </div>
        {/* Add liquidity (On mobile) */}
        <div className='fixed bottom-0 left-0 z-50 w-full justify-center bg-neutral-800 !p-4 lg:hidden'>
          <PrimaryButton onClick={() => setShowModalAdd(true)} className='mx-auto w-full'>
            {t('Add Liquidity')}
          </PrimaryButton>
          <Modal
            title='New Deposit'
            isOpen={showModalAdd}
            width={windowSize.width > 1024 ? 570 : windowSize.width * 0.9}
            closeModal={() => setShowModalAdd(false)}
          >
            <Liquidity pool={pool} isModal />
          </Modal>
        </div>
      </div>
    </div>
  )
}
