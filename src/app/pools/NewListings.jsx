import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useMemo, useState } from 'react'

import { EmphasisButton } from '@/components/buttons/Button'
import { Collapse } from '@/components/collapse'
import IconGroup from '@/components/icongroup'
import NextImage from '@/components/image/NextImage'
import Table from '@/components/table'
import CustomTooltip from '@/components/tooltip'
import { Paragraph, TextHeading } from '@/components/typography'
import { GAMMA_TYPES } from '@/constant'
import { formatAmount } from '@/lib/utils'
import { InfoIcon } from '@/svgs'

function Title({ length }) {
  const t = useTranslations()
  return (
    <div className='z-40 flex min-h-[76px] w-full items-center justify-between gap-4 p-4'>
      🔥 {t('New Listings')} ({length})
    </div>
  )
}

function NewListings({ pools, sortOptions, listPoolAddressSpecial }) {
  const t = useTranslations()
  const [sort, setSort] = useState(sortOptions[2])
  const newSortOptions = [...sortOptions]
  const [currentPage, setCurrentPage] = useState(1)
  const { push } = useRouter()
  const sortedData = useMemo(
    () =>
      pools.sort((a, b) => {
        let res
        switch (sort.value) {
          case 'pair':
            res = a.symbol.localeCompare(b.symbol) * (sort.isDesc ? -1 : 1)
            break
          case 'apr':
            res = (a.highApr - b.highApr) * (sort.isDesc ? -1 : 1)
            break
          case 'tvl':
            res = (a.tvlUSD - b.tvlUSD) * (sort.isDesc ? -1 : 1)
            break
          case 'volume':
            res = (a.dayVolume - b.dayVolume) * (sort.isDesc ? -1 : 1)
            break

          case 'fee':
            res = (a.dayFees - b.dayFees) * (sort.isDesc ? -1 : 1)
            break

          default:
            break
        }
        return res
      }),
    [pools, sort],
  )

  const finalPools = useMemo(() => {
    let data = []

    const pinnedPools = []
    if (Array.isArray(sortedData) && sortedData.length) {
      if (pinnedPools.length) {
        data = sortedData
          .filter(item => pinnedPools.includes(item.address))
          .concat(sortedData.filter(item => !pinnedPools.includes(item.address)))
      } else {
        data = [...sortedData]
      }
    }

    const weETHPoolAddress = '0xc0e1c9fec0d8888039095da014382d027f27069d'
    const ynBNBPoolAddress = '0xcfac0990700ed9b67fefbd4b26a79e426468a419'

    return data.map(pool => ({
      pair: (
        <div className='flex items-center gap-3'>
          <IconGroup
            className='-space-x-2'
            classNames={{
              image: 'outline-2 w-7 h-7',
            }}
            logo1={pool.token0.logoURI}
            logo2={pool.token1.logoURI}
          />
          <div className='flex flex-col'>
            <TextHeading>{pool.symbol}</TextHeading>
            <Paragraph className='text-sm'>{t(pool.type)}</Paragraph>
          </div>
          {pool.address === weETHPoolAddress && (
            <div className='flex items-center gap-2'>
              <div className='size-6' data-tooltip-id='etherBadgeIcon'>
                <NextImage
                  className='h-full w-full rounded-full object-cover'
                  alt='EtherFi'
                  src='/images/Etherfi.png'
                />
              </div>

              <div className='size-6' data-tooltip-id='eigenBadgeIcon'>
                <NextImage
                  className='h-full w-full rounded-full object-cover'
                  alt='EigenLayer'
                  src='/images/Eigenlayer.png'
                />
              </div>

              <CustomTooltip id='etherBadgeIcon' className='rounded-md !py-2' place='top'>
                <TextHeading className='text-xs'>{t('EtherFi tooltip')}</TextHeading>
              </CustomTooltip>
              <CustomTooltip id='eigenBadgeIcon' className='rounded-md !py-2' place='top'>
                <TextHeading className='text-xs'>{t('Eigen tooltip')}</TextHeading>
              </CustomTooltip>
            </div>
          )}
          {listPoolAddressSpecial.includes(pool.address) && (
            <div className='flex items-center gap-2'>
              <div className='size-6' data-tooltip-id={`pool-special-${pool.address}`}>
                <NextImage
                  className='h-full w-full rounded-full object-cover'
                  alt='EtherFi'
                  src='/images/GQhgnIEbUAA4gjewe.jpeg'
                />
              </div>
              <CustomTooltip id={`pool-special-${pool.address}`} className='rounded-md !py-2' place='top'>
                <TextHeading className='text-xs'>{t('Pool Special tooltip')}</TextHeading>
              </CustomTooltip>
            </div>
          )}

          {pool.address === ynBNBPoolAddress && (
            <>
              <div className='flex items-center gap-2'>
                <div className='size-6' data-tooltip-id={`pool-special-${pool.address}-tooltip1`}>
                  <NextImage
                    className='h-full w-full rounded-full object-cover'
                    alt='EtherFi'
                    src='/images/yieldnest_seed_3d__1__360.png'
                  />
                </div>
                <CustomTooltip id={`pool-special-${pool.address}-tooltip1`} className='rounded-md !py-2' place='top'>
                  <TextHeading className='text-xs'>{t('Seeds Boost')}</TextHeading>
                </CustomTooltip>
              </div>
              <div className='flex items-center gap-2'>
                <div className='size-6' data-tooltip-id={`pool-special-${pool.address}-tooltip2`}>
                  <NextImage
                    className='h-full w-full rounded-full object-cover'
                    alt='EtherFi'
                    src='/images/Turtle-Seeds.svg'
                  />
                </div>
                <CustomTooltip id={`pool-special-${pool.address}-tooltip2`} className='rounded-md !py-2' place='top'>
                  <TextHeading className='text-xs'>
                    {t('Liquidity providers in this pool are eligible for Turtle Club 10% emission boost')}
                  </TextHeading>
                </CustomTooltip>
              </div>
            </>
          )}
        </div>
      ),
      apr: (
        <div className='flex items-center gap-1'>
          <Paragraph>{pool.apr}</Paragraph>
          {pool.subpools.length > 0 && (
            <InfoIcon className='h-4 w-4 stroke-neutral-400' data-tooltip-id={`pair-${pool.address}`} />
          )}
          <CustomTooltip className='min-w-[130px]' id={`pair-${pool.address}`}>
            <div className='flex flex-col gap-1'>
              <TextHeading className='text-sm'>APR</TextHeading>
              <div className='flex flex-col gap-1'>
                {pool.subpools.map((sub, idx) => (
                  <div className='flex justify-between gap-2' key={`pair-${idx}`}>
                    <div className='flex gap-1'>
                      <TextHeading className='text-xs'>
                        {GAMMA_TYPES.includes(sub.title) ? 'Gamma' : sub.title}
                      </TextHeading>
                      {GAMMA_TYPES.includes(sub.title) && <Paragraph className='text-xs'>{sub.title}</Paragraph>}
                      {sub.title === 'ICHI' && <Paragraph className='text-xs'>{sub.allowed.symbol}</Paragraph>}
                    </div>
                    <Paragraph className='text-xs'>{formatAmount(sub.gauge.apr)}%</Paragraph>
                  </div>
                ))}
              </div>
            </div>
          </CustomTooltip>
        </div>
      ),
      tvl: (
        <div className='flex items-center gap-1'>
          <Paragraph className='min-w-0 flex-1 truncate'>${formatAmount(pool.tvlUSD)}</Paragraph>
          <InfoIcon className='size-4 stroke-neutral-400' data-tooltip-id={`tvl-${pool.address}`} />
          <CustomTooltip id={`tvl-${pool.address}`}>
            <div className='flex flex-col gap-1'>
              <p>{`${formatAmount(pool.reserve0)} ${pool.token0.symbol}`}</p>
              <p>{`${formatAmount(pool.reserve1)} ${pool.token1.symbol}`}</p>
            </div>
          </CustomTooltip>
        </div>
      ),
      volume: <Paragraph className='w-full min-w-0 truncate'>${formatAmount(pool.dayVolume)}</Paragraph>,
      fee: <Paragraph className='w-full min-w-0 truncate'>${formatAmount(pool.dayFees)}</Paragraph>,
      action: (
        <EmphasisButton className='w-full lg:w-fit' onClick={() => push(`/pools/${pool.address}`)}>
          {t('Manage')}
        </EmphasisButton>
      ),
    }))
  }, [listPoolAddressSpecial, push, sortedData, t])
  return (
    <Collapse
      className='min-h-[76px] rounded-xl bg-neutral-900'
      classNames={{ chevron: 'mr-6 z-40', content: '-mt-7' }}
      defaultShow={false}
      title={<Title length={pools.length} />}
    >
      <Table
        sortOptions={newSortOptions}
        data={finalPools}
        sort={sort}
        setSort={setSort}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      />
    </Collapse>
  )
}

export default NewListings
