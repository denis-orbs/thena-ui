'use client'

import BigNumber from 'bignumber.js'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'
import { ChainId } from 'thena-sdk-core'

import Box from '@/components/box'
import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import { EmphasisIconButton } from '@/components/buttons/IconButton'
import LayoutWithBackButton from '@/components/common/LayoutWithBackButton'
import Dropdown from '@/components/dropdown'
import IconGroup from '@/components/icongroup'
import GroupIconTokens from '@/components/icongroup/GroupIconTokens'
import CircleImage from '@/components/image/CircleImage'
import NextImage from '@/components/image/NextImage'
import { SearchInput2 } from '@/components/input/SearchInput'
import Selection from '@/components/selection'
import Table from '@/components/table'
import Toggle from '@/components/toggle'
import CustomTooltip from '@/components/tooltip'
import { NewTextHeading, Paragraph, TextHeading, TextSubHeading } from '@/components/typography'
import { GAMMA_TYPES, ICHI_TYPES, MANUAL_TYPES, PAIR_TYPES, SPECIAL_POOLS } from '@/constant'
import { usePairs } from '@/context/pairsContext'
import { useVaults } from '@/context/vaultsContext'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { cn, formatAmount, getLiquidityRangeType, isInvalidAmount } from '@/lib/utils'
import { ListTokenPercantage } from '@/modules/WeightedPool/TokenPercentage'
import { updateLiquidityRangeType, updateStrategy } from '@/state/fusion/actions'
import { useChainSettings } from '@/state/settings/hooks'
import { BarChartIcon, ChevronDownWhiteIcon, InfoIcon, PoolCoinsIcon } from '@/svgs'

import NewListings from '../NewListings'

const ITEMS_PER_PAGE = 10

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
    width: 'lg:w-[18%]',
    isDesc: true,
  },
  {
    label: 'TVL',
    value: 'tvl',
    width: 'lg:w-[15%]',
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
  // DefiEdge: 'DefiEdge',
}

export default function PoolsPage() {
  const [searchText, setSearchText] = useState('')
  const [isInactive, setIsInactive] = useState(false)
  const [sort, setSort] = useState(sortOptions[2])
  const [filter, setFilter] = useState(PAIR_TYPES.All)
  const [strategy, setStrategy] = useState(STRATEGIES.All)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE)
  const [toggleVault, setToggleVault] = useState(true)

  const { push } = useRouter()
  const { pairs } = usePairs()
  const vaults = useVaults()
  const { networkId } = useChainSettings()
  const t = useTranslations()
  const dispatch = useDispatch()
  const { isLgDown } = useMediaQuery()

  const getDisplayedTitleAndSubTitle = useCallback(sub => {
    const title = sub?.title
    if (title) {
      if (GAMMA_TYPES.includes(title)) {
        if (title === 'Narrow_Farming') {
          return ['Gamma Narrow', '']
        }
        if (title === 'Wide_Farming') {
          return ['Gamma Wide', '']
        }
        if (title === 'Correlated_Farming') {
          return ['Gamma Correlated', '']
        }
        if (title === 'CL_Stable_Farming') {
          return ['Gamma Stable', '']
        }
        return ['Gamma Narrow', title.replace('_', ' ')]
      }

      if (ICHI_TYPES.includes(title)) {
        return [`${sub.version === 2 ? 'ICHI Single Sided' : 'ICHI'} ${sub.allowed.symbol}`, '']
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
    const pairFilteredSubpools = pairs.map(ele => {
      let { subpools } = ele
      if ([PAIR_TYPES.CLASSIC, PAIR_TYPES.STABLE].includes(ele.type)) {
        subpools = ele.subpools.filter(sub => sub.version === 3)
      }
      if (ele.type === PAIR_TYPES.LSD) {
        subpools = ele.subpools.filter(sub => sub.title !== 'CL_SwapFee')
      }
      return { ...ele, subpools }
    })
    if (isInactive) {
      final = pairFilteredSubpools.filter(ele => {
        if (ele.type === PAIR_TYPES.WEIGHTED) {
          return isInvalidAmount(ele.aprNumber)
        }
        return !ele.highApr
      })
    } else {
      final = pairFilteredSubpools.filter(ele => {
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
            const checkSubStable = (item.subpools || []).some(sub => sub.title.includes('CL_Stable'))
            return checkSubStable || item.type === filter
          })

    final = final.map(pool => {
      const singleSideVault = vaults.find(v => v.algebra === pool.address)
      let { apr } = pool
      if (singleSideVault) {
        const aprs = pool.subpools.map(sub => sub.gauge.apr).filter(item => !item.isZero())
        const aprMin = BigNumber.min(...aprs)
        const aprMax = BigNumber.max(...aprs)
        apr = aprMin.isEqualTo(aprMax)
          ? `${formatAmount(aprMin)}%`
          : `${formatAmount(aprMin)}% ~ ${formatAmount(aprMax)}%`
      }
      return {
        ...pool,
        tvlUSD: singleSideVault
          ? BigNumber(singleSideVault.gauge?.tvl || 0)
              .plus(BigNumber(pool.tvlUSD))
              .toNumber()
          : pool.tvlUSD,
        reserve0: singleSideVault
          ? BigNumber(singleSideVault.token0?.reserve || 0)
              .plus(BigNumber(pool.reserve0))
              .toNumber()
          : pool.reserve0,
        reserve1: singleSideVault
          ? BigNumber(singleSideVault.token1?.reserve || 0)
              .plus(BigNumber(pool.reserve1))
              .toNumber()
          : pool.reserve1,
        apr,
      }
    })
    const res =
      filter !== PAIR_TYPES.LSD || strategy === STRATEGIES.All
        ? final
        : final.filter(
            item =>
              !!item.subpools.find(
                ele =>
                  ele.title === strategy ||
                  (strategy === STRATEGIES.Gamma && GAMMA_TYPES.includes(ele.title)) ||
                  (strategy === STRATEGIES.ICHI && ICHI_TYPES.includes(ele.title)),
              ),
          )
    return !searchText
      ? res
      : res &&
          res.filter(item => {
            const symbol = item?.symbol?.toLowerCase() || ''
            const tokens = symbol.split('/')
            const searchTerms = searchText.toLowerCase().split(/[\s/,]+/)
            return searchTerms.every(term => tokens.some(token => token.includes(term)))
          })
  }, [isInactive, filter, strategy, searchText, pairs, vaults])

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
              <Paragraph className='break-all'>{pool.apr}</Paragraph>
              {pool.subpools.length > 0 && (
                <InfoIcon className='h-4 w-4 min-w-4 stroke-neutral-400' data-tooltip-id={`pair-${pool.address}`} />
              )}
            </div>
            <CustomTooltip className='min-w-[130px]' id={`pair-${pool.address}`}>
              <div className='flex flex-col gap-1'>
                <TextHeading className='text-sm'>APR</TextHeading>
                <div className='flex flex-col gap-1'>
                  {pool.subpools.map((sub, idx) => (
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
              className='size-8 min-w-8 max-lg:p-2 lg:size-11 lg:min-w-11'
              classNames='[&>path]:group-hover:stroke-neutral-100'
              Icon={BarChartIcon}
              onClick={e => {
                e.stopPropagation()
                e.preventDefault()
                push(`/analytics/pairs/${pool?.address}?back=1`)
              }}
              data-tooltip-id='analytics-tooltip'
            />
            <EmphasisButton
              className='w-full max-lg:p-2 max-lg:text-xs lg:w-fit'
              onClick={e => {
                e.stopPropagation()
                e.preventDefault()
                dispatch(updateStrategy({ strategy: null }))
                push(
                  pool.type === PAIR_TYPES.WEIGHTED
                    ? `/pools/add-liquidity/weighted/${pool.address}?back=1`
                    : `/pools/add-liquidity?step=3&poolAddress=${pool.address}&back=1`,
                )
              }}
            >
              {t('Deposit')}
            </EmphasisButton>
          </div>
        ),
        onRowClick: () => {
          push(`/analytics/pairs/${pool.address}`)
        },
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

  const handleDepositSingleSidedVault = useCallback(
    position => {
      const newStrategy = {
        title: position?.title,
        tvl: position?.gauge?.tvl?.toNumber() ?? 0,
        apr: position?.gauge?.apr.toNumber() ?? 0,
        account: {
          totalLp: position?.account?.totalLp?.toNumber(),
          gaugeBalance: position?.account?.gaugeBalance?.toNumber(),
        },
        allowed: { ...position?.allowed, balance: position?.allowed?.balance?.toNumber() },
        token0: {
          ...position?.token0,
          reserve: position?.token0?.reserve?.toNumber(),
          balance: position?.token0?.balance?.toNumber(),
          totalValue: position?.token0?.totalValue,
        },
        token1: {
          ...position?.token1,
          reserve: position?.token1?.reserve?.toNumber(),
          balance: position?.token1?.balance?.toNumber(),
          totalValue: position?.token1?.totalValue,
        },
        address: position?.address,
        isFarming: position?.title?.includes('Farming'),
        isAutomatic: !MANUAL_TYPES.includes(position?.title) && position?.type === PAIR_TYPES.LSD,
        isDefault: true,
        version: position.version,
        fee: position?.fee,
      }
      dispatch(updateStrategy({ strategy: newStrategy }))
      dispatch(updateLiquidityRangeType({ liquidityRangeType: getLiquidityRangeType(position.title) }))
      push(`/pools/add-liquidity?step=3&poolAddress=${position.algebra}&back=1`)
    },
    [dispatch, push],
  )

  useEffect(() => {
    setCurrentPage(1)
  }, [filter, strategy, searchText, isInactive])

  return (
    <LayoutWithBackButton
      hiddenBackButton
      className='!pt-6 xl:mx-12 2xl:mx-auto 2xl:w-[1344px] 3xl:w-[1464px] 3xl:!pt-8'
    >
      <div className='flex flex-col gap-6 2xl:gap-8'>
        {/* Filter section */}
        <div className='flex flex-col gap-4'>
          <div className='flex items-center gap-4'>
            <PoolCoinsIcon className='size-12' />
            <NewTextHeading>{t('Pools')}</NewTextHeading>
          </div>
          <div className='flex flex-col gap-2 lg:flex-row'>
            <Toggle
              className='lg:hidden'
              checked={isInactive}
              onChange={() => setIsInactive(!isInactive)}
              toggleId='active'
              label='Inactive Pools'
            />
            <div className='flex w-full flex-col items-center justify-between gap-4 lg:flex-row'>
              <div className='flex w-full flex-col gap-4 lg:w-auto lg:flex-row lg:gap-2'>
                <Dropdown
                  className='h-11 w-full lg:w-[129px]'
                  data={Object.values(PAIR_TYPES).map(item => ({
                    label: item,
                  }))}
                  selected={filter}
                  setSelected={ele => setFilter(ele.label)}
                  placeHolder='Choose Category'
                  classNames={{ input: 'pl-4 py-3' }}
                  prefixClass='pr-4 py-3'
                />
                <SearchInput2
                  className='!h-11 w-full !text-neutral-400 lg:w-[280px]'
                  classNames={{ input: '!h-11 !text-neutral-400' }}
                  val={searchText}
                  setVal={setSearchText}
                />
                {filter === PAIR_TYPES.LSD && <Selection data={strategySelections} isFull />}
                <Toggle
                  className='ml-2 hidden lg:flex'
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
          </div>
        </div>
        {vaults.length > 0 && networkId === ChainId.BSC && (
          <div className='flex flex-col'>
            <div className='flex items-center gap-4 max-md:justify-between'>
              <TextHeading className='text-xl font-medium text-neutral-50 md:text-2xl'>
                {t('THE Single Sided Vaults')}
              </TextHeading>
              <ChevronDownWhiteIcon
                className={cn(
                  'size-8 cursor-pointer !stroke-neutral-50 transition-all duration-150 ease-in-out',
                  toggleVault ? 'rotate-180' : 'rotate-0',
                )}
                onClick={() => setToggleVault(!toggleVault)}
              />
            </div>
            <motion.div
              initial={{ opacity: 0, y: 0, height: 0 }}
              animate={toggleVault ? { opacity: 1, y: 0, height: 'auto' } : { opacity: 0, y: 0, height: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className='overflow-x-auto overflow-y-hidden'
            >
              <div className='mt-4 flex items-center gap-2'>
                {vaults.map(trending => (
                  <Box className='flex w-full cursor-pointer flex-col gap-4 !p-4' key={trending.address}>
                    <div className='space-y-2'>
                      <div className='flex items-start justify-between gap-2'>
                        <div className='flex items-center gap-2'>
                          <CircleImage className='size-6 2xl:size-9' src={trending.allowed.logoURI} alt='thena logo' />
                          <div className='flex flex-col'>
                            <TextHeading className='!text-base !leading-5 2xl:!text-xl 2xl:!leading-6'>
                              {`${trending.allowed.symbol}/${
                                trending.token0.symbol !== trending.allowed.symbol
                                  ? trending.token0.symbol
                                  : trending.token1.symbol
                              }`}
                            </TextHeading>
                            <TextSubHeading className='text-nowrap !text-xs 2xl:!text-sm'>ICHI</TextSubHeading>
                          </div>
                        </div>
                        <TextHeading className='font-archia !text-base font-bold !leading-5 text-primary-600 2xl:!text-xl 2xl:font-semibold 2xl:!leading-6'>
                          {formatAmount(trending.gauge.apr)}%
                        </TextHeading>
                      </div>
                      <div className='space-y-1'>
                        <div className='flex items-center justify-between gap-2'>
                          <Paragraph className='!text-xs font-medium text-neutral-500 2xl:!text-sm'>
                            {t('Total Value Locked')}
                          </Paragraph>
                          <TextHeading className='text-xs font-medium text-neutral-400 2xl:!text-sm'>
                            ${formatAmount(trending.gauge.tvl)}
                          </TextHeading>
                        </div>
                        <div className='flex items-center gap-2'>
                          <IconGroup
                            className='-space-x-1'
                            classNames={{
                              image: 'outline-0 size-4',
                            }}
                            logo1={trending.token0.logoURI}
                            logo2={trending.token1.logoURI}
                          />

                          <TextHeading className='text-xs text-neutral-500 2xl:!text-base 2xl:!leading-4'>{`Pool Token ${trending.symbol}`}</TextHeading>
                        </div>
                      </div>
                    </div>
                    <EmphasisButton
                      className='h-8 w-full text-xs font-medium'
                      onClick={() => handleDepositSingleSidedVault(trending)}
                    >
                      {t('Deposit')}
                    </EmphasisButton>
                  </Box>
                ))}
              </div>
            </motion.div>
          </div>
        )}
        <div className='flex flex-col gap-4'>
          <TextHeading className='text-2xl font-medium text-neutral-50'>
            {isInactive ? t('Inactive Pools') : t('Active Pools')}
          </TextHeading>
          {/* New Listings pool */}
          {newListingsPool.length > 0 && (
            <NewListings
              title={`✨ ${t('New Listings')}`}
              pools={newListingsPool}
              sortOptions={sortOptions}
              listPoolAddressSpecial={SPECIAL_POOLS}
              back={1}
            />
          )}

          {/* Hot Pools */}
          {hotPools.length > 0 && (
            <NewListings
              title={`🔥 ${t('Hot Pools')}`}
              pools={hotPools}
              sortOptions={sortOptions}
              listPoolAddressSpecial={SPECIAL_POOLS}
              back={1}
            />
          )}
          <Table
            tableBasic={!isLgDown}
            sortOptions={sortOptions}
            data={finalPools}
            showNumberOfPage
            setNumberOfPage={setItemsPerPage}
            pageSize={itemsPerPage}
            sort={sort}
            setSort={setSort}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
          />
        </div>
      </div>
    </LayoutWithBackButton>
  )
}
