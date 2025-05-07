import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useCallback, useId, useMemo, useState } from 'react'

import { EmphasisButton } from '@/components/buttons/Button'
import { EmphasisIconButton } from '@/components/buttons/IconButton'
import { Collapse } from '@/components/collapse'
import GroupIconTokens from '@/components/icongroup/GroupIconTokens'
import NextImage from '@/components/image/NextImage'
import Table from '@/components/table'
import CustomTooltip from '@/components/tooltip'
import { Paragraph, TextHeading } from '@/components/typography'
import { GAMMA_TYPES, ICHI_TYPES, MANUAL_TYPES, PAIR_TYPES } from '@/constant'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { cn, formatAmount } from '@/lib/utils'
import { ListTokenPercantage } from '@/modules/WeightedPool/TokenPercentage'
import { BarChartIcon, CoinsStackedIcon, InfoIcon } from '@/svgs'

function Title({ title, length, className }) {
  return (
    <div className={cn('flex min-h-[76px] w-full items-center justify-between gap-4 p-4', className)}>
      {title} ({length})
    </div>
  )
}

function NewListings({
  pools,
  classNames,
  sortOptions,
  listPoolAddressSpecial,
  title,
  defaultShow = false,
  isCollapse = true,
  size = 'default',
}) {
  const t = useTranslations()
  const { push } = useRouter()
  const { isMdDown } = useMediaQuery()
  const id = useId()

  const [sort, setSort] = useState(sortOptions[1])
  const [currentPage, setCurrentPage] = useState(1)
  const newSortOptions = useMemo(() => [...sortOptions], [sortOptions])

  const sortedData = useMemo(
    () =>
      [...pools].sort((a, b) => {
        let res
        switch (sort.value) {
          case 'pair':
            res = a.symbol.localeCompare(b.symbol) * (sort.isDesc ? -1 : 1)
            break
          case 'apr':
            res =
              ((a.type === PAIR_TYPES.WEIGHTED ? a.aprNumber : a.highApr) -
                (b.type === PAIR_TYPES.WEIGHTED ? b.aprNumber : b.highApr)) *
              (sort.isDesc ? -1 : 1)
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
  const getDisplayedTitleAndSubTitle = useCallback(sub => {
    const titleSub = sub?.title

    if (titleSub) {
      if (GAMMA_TYPES.includes(titleSub)) {
        if (titleSub === 'Narrow_Farming') {
          return ['Gamma Narrow', '']
        }
        if (titleSub === 'Wide_Farming') {
          return ['Gamma Wide', '']
        }
        if (titleSub === 'Correlated_Farming') {
          return ['Gamma Correlated', '']
        }
        return ['Gamma Narrow', titleSub.replace('_', ' ')]
      }

      if (ICHI_TYPES.includes(titleSub)) {
        return [`ICHI ${sub.allowed.symbol}`, '']
      }

      if (MANUAL_TYPES.includes(titleSub)) {
        if (titleSub === 'CL_Farming') {
          return ['CL: Earn $THE', '']
        }

        return ['CL: Earn Fees', '']
      }

      if (titleSub === 'CL_Stable_Farming') {
        return ['Gamma Stable', '']
      }
    }

    return [titleSub, '']
  }, [])

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
    const ynBNBxPoolAddress = '0xcdedb4bad9978e1d0a82ad2061d0345f48014bc4' // ynBNBx/BNB
    const BTCBynBTCkPoolAddress = '0x94b3c0050e9111e955e3f3a48543bbf30ba44bbc' // BTCB/ynBTCk
    const BNBLpBNBPoolAdress = '0x47600bc3ae9b5b97ef92a55e550066944fe17670'
    const BNBSlpBNBPoolAdress = '0xda5bc174e3c122058eb42465b78c7e1f639820a9'
    const BTCBmBTCAddress = '0x01e4a13b64a35ec29c490374c0ac6a585ff7ce79' // BTCB/mBTC
    const uniBTCFBTC = '0xe2bb11d6b6a39e55762f5e14d632f0981198b3a7' // uniBTC/FBTC

    return data.map(pool => ({
      pair: (
        <div className='flex items-center gap-2 md:gap-3'>
          {pool.type !== PAIR_TYPES.WEIGHTED ? (
            <>
              <GroupIconTokens
                classNames={{
                  image: cn('outline-2', 'size-7'),
                  rows: '-space-x-2',
                  toolTip: 'hidden',
                }}
                width={28}
                height={28}
                tokens={[pool.token0, pool.token1]}
                showToolTip={false}
              />
              <div className='flex flex-col'>
                <TextHeading className='text-sm md:text-base'>{pool.symbol}</TextHeading>
                <Paragraph className='text-[10px] md:text-xs'>
                  {t(pool.type === PAIR_TYPES.LSD && isMdDown ? 'Concentrated' : pool.type)}
                </Paragraph>
              </div>
            </>
          ) : (
            <ListTokenPercantage listToken={pool.tokens} poolAddress={pool?.address} small={size === 'small'} />
          )}

          {/* BEGIN Special pools */}
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
          {(listPoolAddressSpecial || []).includes(pool.address) && (
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
          {(pool.address === ynBNBxPoolAddress || pool.address === BTCBynBTCkPoolAddress) && (
            <div className='flex items-center gap-2'>
              <div className='size-6' data-tooltip-id={`pool-special-new-${pool.address}-tooltip1`}>
                <NextImage
                  className='h-full w-full rounded-full object-cover'
                  alt='EtherFi'
                  src='/images/yieldnest_seed_3d__1__360.png'
                />
              </div>
              <CustomTooltip id={`pool-special-new-${pool.address}-tooltip1`} className='rounded-md !py-2' place='top'>
                <TextHeading className='text-xs'>{t('Seeds Boost')}</TextHeading>
              </CustomTooltip>

              <div className='size-6' data-tooltip-id={`pool-special-new-${pool.address}-tooltip2`}>
                <NextImage className='h-full w-full rounded-full object-cover' alt='Kernel' src='/images/kernel.svg' />
              </div>
              <CustomTooltip id={`pool-special-new-${pool.address}-tooltip2`} className='rounded-md !py-2' place='top'>
                <TextHeading className='text-xs'>{t('Kernel Points Tooltip')}</TextHeading>
              </CustomTooltip>
            </div>
          )}
          {pool.address === BNBLpBNBPoolAdress ||
            (pool.address === BNBSlpBNBPoolAdress && (
              <>
                <div className='flex items-center gap-2'>
                  <div className='size-6' data-tooltip-id={`pool-special-${pool.address}-tooltip1`}>
                    <NextImage
                      className='h-full w-full rounded-full object-cover'
                      alt='Quaaloop'
                      src='/images/quaaloop.png'
                    />
                  </div>
                  <CustomTooltip id={`pool-special-${pool.address}-tooltip1`} className='rounded-md !py-2' place='top'>
                    <TextHeading className='text-xs'>{t('Quaaloops Boost')}</TextHeading>
                  </CustomTooltip>
                </div>
              </>
            ))}
          {pool.address === BTCBmBTCAddress && (
            <>
              <div className='flex items-center gap-2'>
                <div
                  className='flex size-8 items-center rounded-full bg-white'
                  data-tooltip-id={`pool-special-${pool.address}-BTCBmBTCAddress`}
                >
                  <NextImage
                    className='w-full rounded-full object-cover'
                    alt='Quaaloop'
                    src='/images/babbypieBirdLogo.png'
                  />
                </div>
                <CustomTooltip
                  id={`pool-special-${pool.address}-BTCBmBTCAddress`}
                  className='rounded-md !py-2'
                  place='top'
                >
                  <TextHeading className='text-xs'>{t("Babypie's Liquidity RUSH campaign")}</TextHeading>
                </CustomTooltip>
              </div>
            </>
          )}
          {pool.address === uniBTCFBTC && (
            <>
              <div className='flex items-center gap-2'>
                <div className='size-6' data-tooltip-id={`pool-special-${pool.address}-tooltip1`}>
                  <NextImage
                    className='h-full w-full rounded-full bg-white object-cover p-1'
                    alt='Quaaloop'
                    src='/svgs/fbtcYieldCampaign.svg'
                  />
                </div>
                <CustomTooltip id={`pool-special-${pool.address}-tooltip1`} className='rounded-md !py-2' place='top'>
                  <TextHeading className='text-xs'>{t('uniBTC FBTC pool tooltip')}</TextHeading>
                </CustomTooltip>
              </div>
            </>
          )}
          {/* END Special pools */}

          {/* Warning pools */}
          {(pool.token0?.isWarning || pool.token1?.isWarning) && (
            <>
              <div className='size-4' data-tooltip-id={`pool-warning-${pool.address}`}>
                <InfoIcon className='size-4 stroke-warn-700' />
              </div>
              <CustomTooltip id={`pool-warning-${pool.address}`} className='rounded-md !py-2' place='top'>
                <TextHeading className='text-xs'>{t('Careful Custom Token')}</TextHeading>
              </CustomTooltip>
            </>
          )}
        </div>
      ),
      apr: (
        <div className='flex items-center gap-1'>
          <Paragraph className='break-all text-sm font-medium md:text-base'>{pool.apr}</Paragraph>
          {pool.subpools.length > 0 && (
            <InfoIcon
              className='size-4 min-w-4 stroke-neutral-400 max-md:hidden'
              data-tooltip-id={`pair-${pool.address}-${id}`}
            />
          )}
          <CustomTooltip className='min-w-[130px]' id={`pair-${pool.address}-${id}`}>
            <div className='flex flex-col gap-1'>
              <TextHeading className='text-sm'>APR</TextHeading>
              <div className='flex flex-col gap-1'>
                {pool.subpools
                  .filter(item => item.version === 3)
                  .map((sub, idx) => (
                    <div className='flex items-center justify-between gap-2' key={`pair-${idx}`}>
                      <div className='flex items-center gap-1'>
                        <TextHeading className='text-xs'>{getDisplayedTitleAndSubTitle(sub)[0]}</TextHeading>
                        <Paragraph className='text-xs'>{getDisplayedTitleAndSubTitle(sub)[1]}</Paragraph>
                      </div>
                      <Paragraph className='text-xs'>{formatAmount(sub.gauge.apr, true)}%</Paragraph>
                    </div>
                  ))}
              </div>
            </div>
          </CustomTooltip>
        </div>
      ),
      tvl: (
        <div className='flex items-center gap-1'>
          <Paragraph className='min-w-0 flex-1 truncate text-sm md:text-base'>${formatAmount(pool.tvlUSD)}</Paragraph>
          <InfoIcon className='size-4 stroke-neutral-400' data-tooltip-id={`tvl-${pool.address}-${id}`} />
          {pool.type === PAIR_TYPES.WEIGHTED ? (
            <CustomTooltip id={`tvl-${pool.address}-${id}`}>
              <div className='flex flex-col gap-1'>
                {(pool.tokens || []).map(token => (
                  <p key={token.address}>{`${formatAmount(token.reserve)} ${token.symbol}`}</p>
                ))}
              </div>
            </CustomTooltip>
          ) : (
            <CustomTooltip id={`tvl-${pool.address}-${id}`}>
              <div className='flex flex-col gap-1'>
                <p>{`${formatAmount(pool.reserve0)} ${pool.token0.symbol}`}</p>
                <p>{`${formatAmount(pool.reserve1)} ${pool.token1.symbol}`}</p>
              </div>
            </CustomTooltip>
          )}
        </div>
      ),
      volume: (
        <Paragraph className='w-full min-w-0 truncate text-sm md:text-base'>${formatAmount(pool.dayVolume)}</Paragraph>
      ),
      fee: (
        <Paragraph className='w-full min-w-0 truncate text-sm md:text-base'>${formatAmount(pool.dayFees)}</Paragraph>
      ),
      action: (
        <div className='flex gap-2.5'>
          <EmphasisIconButton
            className={cn('!size-8 p-2', size !== 'small' && 'lg:!size-9')}
            classNames='[&>path]:group-hover:stroke-neutral-100 !size-4'
            Icon={BarChartIcon}
            onClick={() => push(`/analytics/pairs/${pool?.address}`)}
            data-tooltip-id='analytics-tooltip'
          />
          <EmphasisButton
            className={cn(
              'h-8 w-full p-2 text-xs lg:h-9 lg:w-fit lg:text-sm',
              size === 'small' && pool.type !== PAIR_TYPES.WEIGHTED && 'max-md:hidden',
            )}
            onClick={e => {
              e.stopPropagation()
              e.preventDefault()
              push(
                pool.type === PAIR_TYPES.WEIGHTED
                  ? `/pools/add-liquidity/weighted/${pool.address}`
                  : `/pools/add-liquidity?step=3&poolAddress=${pool.address}`,
              )
            }}
          >
            <Paragraph
              className={cn('block !text-sm text-neutral-100', size === 'small' && 'hidden !text-xs md:block')}
            >
              {t('Deposit')}
            </Paragraph>
            <CoinsStackedIcon
              className={cn('hidden size-4', size === 'small' && pool.type === PAIR_TYPES.WEIGHTED && 'max-md:block')}
            />
          </EmphasisButton>
        </div>
      ),
      className: cn('items-center', classNames?.rowItem),
      onRowClick: () => {
        push(`/analytics/pairs/${pool.address}`)
      },
    }))
  }, [
    classNames?.rowItem,
    getDisplayedTitleAndSubTitle,
    id,
    isMdDown,
    listPoolAddressSpecial,
    push,
    size,
    sortedData,
    t,
  ])

  return (
    <>
      {isCollapse ? (
        <Collapse
          className='min-h-[76px] rounded-xl bg-neutral-900'
          classNames={{ chevron: 'mr-6', divider: classNames?.divider }}
          defaultShow={defaultShow}
          title={<Title length={pools.length} title={title} className={classNames?.title} />}
        >
          <Table
            sortOptions={newSortOptions}
            data={finalPools}
            sort={sort}
            setSort={setSort}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            classNames={{
              header: classNames?.header,
              cellItem: classNames?.cellItem,
              cellItemLabel: classNames?.cellItemLabel,
              tableContainer: classNames?.tableContainer,
            }}
          />
        </Collapse>
      ) : (
        <Table
          sortOptions={newSortOptions}
          data={finalPools}
          sort={sort}
          setSort={setSort}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
        />
      )}
    </>
  )
}

export default NewListings
