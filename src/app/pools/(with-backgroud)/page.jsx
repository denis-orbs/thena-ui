'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'
import { ChainId } from 'thena-sdk-core'

import { NeutralBadge } from '@/components/badges/Badge'
import Box from '@/components/box'
import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import { EmphasisIconButton } from '@/components/buttons/IconButton'
import Dropdown from '@/components/dropdown'
import IconGroup from '@/components/icongroup'
import GroupIconTokens from '@/components/icongroup/GroupIconTokens'
import CircleImage from '@/components/image/CircleImage'
import NextImage from '@/components/image/NextImage'
import SearchInput from '@/components/input/SearchInput'
import Selection from '@/components/selection'
import Table from '@/components/table'
import Toggle from '@/components/toggle'
import CustomTooltip from '@/components/tooltip'
import { Paragraph, TextHeading, TextSubHeading } from '@/components/typography'
import { GAMMA_TYPES, ICHI_TYPES, MANUAL_TYPES, PAIR_TYPES, SPECIAL_POOLS } from '@/constant'
import { useManuals } from '@/context/manualsContext'
import { usePairs } from '@/context/pairsContext'
import { useVaults } from '@/context/vaultsContext'
import { cn, formatAmount, isInvalidAmount } from '@/lib/utils'
import { ListTokenPercantage } from '@/modules/WeightedPool/TokenPercentage'
import { updateStrategy } from '@/state/fusion/actions'
import { useChainSettings } from '@/state/settings/hooks'
import { BarChartIcon, InfoIcon } from '@/svgs'

import NewListings from '../NewListings'

const sortOptions = [
  {
    label: 'Pairing',
    value: 'pair',
    width: 'lg:w-[25%]',
    isDesc: true,
  },
  {
    label: 'APR',
    value: 'apr',
    width: 'lg:w-[15%]',
    isDesc: true,
  },
  {
    label: 'TVL',
    value: 'tvl',
    width: 'lg:w-[18%]',
    isDesc: true,
  },
  {
    label: 'Volume (24h)',
    value: 'volume',
    width: 'lg:w-[15%]',
    isDesc: true,
  },
  {
    label: 'Fees (24h)',
    value: 'fee',
    width: 'lg:w-[calc(27%-140px)]',
    isDesc: true,
  },
  {
    label: '',
    value: 'action',
    width: 'lg:w-[140px]',
    disabled: true,
  },
]

const STRATEGIES = {
  All: 'All',
  ICHI: 'ICHI',
  Gamma: 'Gamma',
  DefiEdge: 'DefiEdge',
}

export default function PoolsPage() {
  const [searchText, setSearchText] = useState('')
  const [isInactive, setIsInactive] = useState(false)
  const [sort, setSort] = useState(sortOptions[2])
  const [filter, setFilter] = useState(PAIR_TYPES.All)
  const [strategy, setStrategy] = useState(STRATEGIES.All)
  const [currentPage, setCurrentPage] = useState(1)
  const { push } = useRouter()
  const { pairs } = usePairs()
  const vaults = useVaults()
  const vaultsV3 = useMemo(() => vaults.filter(v => v.version === 3), [vaults])
  const { networkId } = useChainSettings()
  const t = useTranslations()
  const dispatch = useDispatch()

  const getDisplayedTitleAndSubTitle = useCallback(sub => {
    const title = sub?.title

    if (title) {
      if (GAMMA_TYPES.includes(title)) {
        return ['Gamma', title.replace('_', ' ')]
      }

      if (ICHI_TYPES.includes(title)) {
        return ['ICHI Farming', sub.allowed.symbol]
      }

      if (MANUAL_TYPES.includes(title)) {
        if (title === 'CL_Farming') {
          return ['CL: Earn $THE', '']
        }

        return ['CL: Earn Fees', '']
      }
    }

    return [title, '']
  }, [])

  const filteredPools = useMemo(() => {
    let final
    if (isInactive) {
      final = pairs.filter(ele => {
        if (ele.type === PAIR_TYPES.WEIGHTED) {
          return isInvalidAmount(ele.aprNumber)
        }
        return !ele.highApr
      })
    } else {
      final = pairs.filter(ele => {
        if (ele.type === PAIR_TYPES.WEIGHTED) {
          return !isInvalidAmount(ele.aprNumber)
        }
        return ele.highApr > 0
      })
    }
    final =
      filter === PAIR_TYPES.All
        ? final
        : final.filter(item => {
            if (filter !== PAIR_TYPES.STABLE) {
              return item.type === filter
            }
            const checkSubStatble = (item.subpools || []).some(sub => sub.title === 'CL_Stable')
            return checkSubStatble || item.type === filter
          })

    const res =
      filter !== PAIR_TYPES.LSD || strategy === STRATEGIES.All
        ? final
        : final.filter(
            item =>
              !!item.subpools.find(
                ele => ele.title === strategy || (strategy === STRATEGIES.Gamma && GAMMA_TYPES.includes(ele.title)),
              ),
          )
    return !searchText
      ? res
      : res &&
          res.filter(item => {
            const withSpace = item?.symbol?.replace('/', ' ') || ''
            const withComma = item?.symbol?.replace('/', ',') || ''
            return (
              item?.symbol?.toLowerCase().includes(searchText.toLowerCase()) ||
              withSpace.toLowerCase().includes(searchText.toLowerCase()) ||
              withComma.toLowerCase().includes(searchText.toLowerCase())
            )
          })
  }, [isInactive, filter, strategy, searchText, pairs])

  const newListingsPool = useMemo(() => filteredPools.filter(item => item.isNewListing), [filteredPools])

  const hotPools = useMemo(() => filteredPools.filter(item => item.isHotPool), [filteredPools])

  const sortedData = useMemo(
    () =>
      filteredPools.sort((a, b) => {
        let res
        switch (sort.value) {
          case 'pair':
            res = (a.symbol?.localeCompare(b.symbol) || 0) * (sort.isDesc ? -1 : 1)
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
    [filteredPools, sort],
  )

  const finalPools = useMemo(
    () => {
      const weETHPoolAddress = '0xc0e1c9fec0d8888039095da014382d027f27069d'
      const ynBNBxPoolAddress = '0xcdedb4bad9978e1d0a82ad2061d0345f48014bc4' // ynBNBx/BNB
      const BTCBynBTCkPoolAddress = '0x94b3c0050e9111e955e3f3a48543bbf30ba44bbc' // BTCB/ynBTCk
      const BNBLpBNBPoolAdress = '0x47600bc3ae9b5b97ef92a55e550066944fe17670'
      const BNBSlpBNBPoolAdress = '0xda5bc174e3c122058eb42465b78c7e1f639820a9'
      const BTCBmBTCAddress = '0x01e4a13b64a35ec29c490374c0ac6a585ff7ce79' // BTCB/mBTC
      const uniBTCFBTC = '0xe2bb11d6b6a39e55762f5e14d632f0981198b3a7' // uniBTC/FBTC

      return sortedData.map(pool => ({
        pair: (
          <div className='flex items-center gap-3'>
            {pool.type !== PAIR_TYPES.WEIGHTED ? (
              <>
                <GroupIconTokens
                  classNames={{
                    image: cn('outline-2 w-7 h-7', 'w-7 h-7'),
                    rows: '-space-x-2',
                    toolTip: 'hidden',
                  }}
                  width={32}
                  height={32}
                  tokens={[pool.token0, pool.token1]}
                  showToolTip={false}
                />
                <div className='flex flex-col'>
                  <TextHeading>{pool.symbol}</TextHeading>
                  <Paragraph className='text-sm'>{t(pool.type)}</Paragraph>
                </div>
              </>
            ) : (
              <ListTokenPercantage listToken={pool.tokens} poolAddress={pool?.address} />
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
            {SPECIAL_POOLS.includes(pool.address) && (
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

                  <div className='size-6' data-tooltip-id={`pool-special-${pool.address}-tooltip2`}>
                    <NextImage
                      className='h-full w-full rounded-full object-cover'
                      alt='Kernel'
                      src='/images/kernel.svg'
                    />
                  </div>
                  <CustomTooltip id={`pool-special-${pool.address}-tooltip2`} className='rounded-md !py-2' place='top'>
                    <TextHeading className='text-xs'>{t('Kernel Points Tooltip')}</TextHeading>
                  </CustomTooltip>
                </div>
              </>
            )}
            {pool.address === BNBLpBNBPoolAdress ||
              (pool.address === BNBSlpBNBPoolAdress && (
                <>
                  <div className='flex items-center gap-2'>
                    <div className='size-6' data-tooltip-id={`pool-special-${pool.address}-tooltip`}>
                      <NextImage
                        className='h-full w-full rounded-full object-cover'
                        alt='Quaaloop'
                        src='/images/quaaloop.png'
                      />
                    </div>
                    <CustomTooltip id={`pool-special-${pool.address}-tooltip`} className='rounded-md !py-2' place='top'>
                      <TextHeading className='text-xs'>{t('Quaaloops Boost')}</TextHeading>
                    </CustomTooltip>
                  </div>
                </>
              ))}
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
          <div>
            <div className='flex items-center gap-1'>
              <Paragraph>{pool.apr}</Paragraph>
              {pool.subpools.length > 0 && (
                <InfoIcon className='h-4 w-4 min-w-4 stroke-neutral-400' data-tooltip-id={`pair-${pool.address}`} />
              )}
            </div>
            <CustomTooltip className='min-w-[130px]' id={`pair-${pool.address}`}>
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
            <Paragraph className='min-w-0 flex-1 truncate'>${formatAmount(pool.tvlUSD)}</Paragraph>
            <InfoIcon className='size-4 stroke-neutral-400' data-tooltip-id={`tvl-${pool.address}`} />
            {/* TODO: Check for weighted pools */}
            {pool.type === PAIR_TYPES.WEIGHTED ? (
              <CustomTooltip id={`tvl-${pool.address}`}>
                <div className='flex flex-col gap-1'>
                  {(pool.tokens || []).map(token => (
                    <p key={token.address}>{`${formatAmount(token.reserve)} ${token.symbol}`}</p>
                  ))}
                </div>
              </CustomTooltip>
            ) : (
              <CustomTooltip id={`tvl-${pool.address}`}>
                <div className='flex flex-col gap-1'>
                  <p>{`${formatAmount(pool.reserve0)} ${pool.token0.symbol}`}</p>
                  <p>{`${formatAmount(pool.reserve1)} ${pool.token1.symbol}`}</p>
                </div>
              </CustomTooltip>
            )}
          </div>
        ),
        volume: <Paragraph className='w-full min-w-0 truncate'>${formatAmount(pool.dayVolume)}</Paragraph>,
        fee: <Paragraph className='w-full min-w-0 truncate'>${formatAmount(pool.dayFees)}</Paragraph>,
        action: (
          <div className='flex gap-2.5'>
            <EmphasisIconButton
              className='!size-8 !min-w-8 p-2'
              classNames='[&>path]:group-hover:stroke-neutral-100'
              Icon={BarChartIcon}
              onClick={() => push(`/analytics/pairs/${pool?.address}`)}
              data-tooltip-id='analytics-tooltip'
            />
            <EmphasisButton
              className='w-full p-2 text-sm lg:w-fit'
              onClick={() => {
                dispatch(updateStrategy({ strategy: null }))
                push(
                  pool.type === PAIR_TYPES.WEIGHTED
                    ? `/pools/add-liquidity/weighted/${pool.address}`
                    : `/pools/add-liquidity?step=3&poolAddress=${pool.address}`,
                )
              }}
            >
              {t('Deposit')}
            </EmphasisButton>
          </div>
        ),
      }))
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(sortedData), push, t],
  )

  const strategySelections = useMemo(
    () =>
      Object.values(STRATEGIES).map(ele => ({
        label: ele,
        active: ele === strategy,
        onClickHandler: () => {
          setStrategy(ele)
        },
      })),
    [strategy],
  )

  useEffect(() => {
    setCurrentPage(1)
  }, [filter, strategy, searchText, isInactive])

  const userManuals = useManuals()
  const isShowMigrationWarning = useMemo(() => userManuals.some(ele => ele.version === 2), [userManuals])

  return (
    <div>
      {vaultsV3.length > 0 && (
        <>
          <div className='flex items-center justify-between'>
            <h2>{networkId === ChainId.BSC ? t('THE Single Sided Vaults') : t('Single Sided Vaults')} </h2>
          </div>
          <div className='mt-4 flex items-center gap-8 overflow-auto pb-4'>
            {vaultsV3.map(trending => (
              <Box
                className='flex w-full cursor-pointer flex-col gap-4'
                key={trending.address}
                onClick={() => push(`/pools/${trending.algebra}`)}
              >
                <div className='flex items-start justify-between gap-4'>
                  <div className='flex items-center gap-3'>
                    <IconGroup
                      className='-space-x-3'
                      classNames={{
                        image: 'outline-4 w-10 h-10',
                      }}
                      logo1={trending.token0.logoURI}
                      logo2={trending.token1.logoURI}
                    />
                    <div className='flex flex-col'>
                      <div className='flex items-start gap-5'>
                        <TextHeading className='text-lg'>{trending.symbol}</TextHeading>
                        <NeutralBadge className='text-nowrap'>ICHI</NeutralBadge>
                      </div>
                      {/* <Paragraph className='text-sm'>{t(PAIR_TYPES.LSD)}</Paragraph> */}
                    </div>
                  </div>
                </div>
                <div className='flex flex-col gap-2'>
                  <div className='flex items-center justify-between'>
                    <Paragraph className='text-sm'>{t('Deposit Token')}</Paragraph>
                    <div className='flex items-center gap-1'>
                      <CircleImage className='h-4 w-4' src={trending.allowed.logoURI} alt='thena logo' />
                      <TextHeading className='text-sm'>{trending.allowed.symbol}</TextHeading>
                    </div>
                  </div>
                  <div className='flex items-center justify-between'>
                    <Paragraph className='text-sm'>{t('APR')}</Paragraph>
                    <div className='flex items-center gap-1'>
                      <TextHeading className='text-sm'>{formatAmount(trending.gauge.apr)}%</TextHeading>
                      <InfoIcon className='h-4 w-4 stroke-neutral-400' data-tooltip-id={`tvl-${trending.address}`} />
                      <CustomTooltip id={`tvl-${trending.address}`}>
                        <div className='flex flex-col gap-1'>
                          {trending.gauge.apr_list.map(ele => (
                            <div className='flex justify-between gap-1' key={`${ele.symbol}`}>
                              <span>{ele.symbol}</span>
                              <span>{formatAmount(ele.apr)}%</span>
                            </div>
                          ))}
                        </div>
                      </CustomTooltip>
                    </div>
                  </div>
                  <div className='flex items-center justify-between'>
                    <Paragraph className='text-sm'>{t('TVL')}</Paragraph>
                    <TextHeading className='text-sm'>${formatAmount(trending.gauge.tvl)}</TextHeading>
                  </div>
                </div>
              </Box>
            ))}
          </div>
        </>
      )}

      {/* TODO: only show when CL pool V2 (ICHI/GAMMA or manual */}
      <Box
        className={cn(
          'mt-[30px] flex flex-row items-center justify-between gap-4 border border-primary-800 bg-primary-950',
          !isShowMigrationWarning && 'hidden',
        )}
      >
        <div className='h-8 w-8'>
          <InfoIcon className='h-8 w-8 stroke-primary-600' />
        </div>

        <div className='flex flex-col'>
          <TextHeading className='text-xl text-neutral-100'>{t('Migrate Your Conc Liquidity Positions')}</TextHeading>
          <TextSubHeading className='text-base text-primary-100'>
            {t('Migrate Your Conc Liquidity Positions description')}
            &nbsp;
            <span>
              <Link className='text-primary-600' href='/'>
                {/* TODO: Link */}
                {t('Learn more')}
              </Link>
            </span>
          </TextSubHeading>
        </div>
      </Box>

      <div className='mt-6 flex flex-col gap-4'>
        <div className='flex items-center justify-between'>
          <TextHeading className='text-xl'>{isInactive ? t('Inactive Pools') : t('Active Pools')}</TextHeading>
          <Toggle
            className='lg:hidden'
            checked={isInactive}
            onChange={() => setIsInactive(!isInactive)}
            toggleId='active'
            label='Inactive Pools'
          />
        </div>
        <div className='flex flex-col items-center justify-between gap-4 lg:flex-row'>
          <div className='flex w-full flex-col gap-4 lg:w-auto lg:flex-row lg:gap-2'>
            <SearchInput className='w-full lg:w-[220px]' val={searchText} setVal={setSearchText} />
            <Dropdown
              className='w-full lg:w-[220px]'
              data={Object.values(PAIR_TYPES).map(item => ({
                label: item,
              }))}
              selected={filter}
              setSelected={ele => setFilter(ele.label)}
              placeHolder='Choose Category'
            />
            {filter === PAIR_TYPES.LSD && <Selection data={strategySelections} isFull />}
            <Toggle
              className='hidden lg:flex'
              checked={isInactive}
              onChange={() => setIsInactive(!isInactive)}
              toggleId='active'
              label='Inactive Pools'
            />
            <div className='flex items-center justify-between gap-2 lg:hidden'>
              <Paragraph>{t('Sort By')}</Paragraph>
              <Dropdown
                data={sortOptions.slice(0, sortOptions.length - 1)}
                selected={sort ? `${sort.label}` : ''}
                setSelected={ele => setSort(ele)}
              />
            </div>
          </div>
          <div className='ml-auto flex gap-4 lg:flex-row'>
            <Link href='/pools/add-liquidity?step=1&pairType=Conc+Liquidity'>
              <PrimaryButton className='w-full lg:w-auto'>{t('Add Liquidity')}</PrimaryButton>
            </Link>
          </div>
        </div>
        {/* New Listings pool */}
        {newListingsPool.length > 0 && (
          <NewListings
            title={`✨ ${t('New Listings')}`}
            pools={newListingsPool}
            sortOptions={sortOptions}
            listPoolAddressSpecial={SPECIAL_POOLS}
          />
        )}

        {/* Hot Pools */}
        {hotPools.length > 0 && (
          <NewListings
            title={`🔥 ${t('Hot Pools')}`}
            pools={hotPools}
            sortOptions={sortOptions}
            listPoolAddressSpecial={SPECIAL_POOLS}
          />
        )}
        <Table
          sortOptions={sortOptions}
          data={finalPools}
          sort={sort}
          setSort={setSort}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
        />
      </div>
    </div>
  )
}
