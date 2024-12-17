'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useEffect, useMemo, useState } from 'react'
import { ChainId } from 'thena-sdk-core'

import { NeutralBadge } from '@/components/badges/Badge'
import Box from '@/components/box'
import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import Dropdown from '@/components/dropdown'
import IconGroup from '@/components/icongroup'
import CircleImage from '@/components/image/CircleImage'
import NextImage from '@/components/image/NextImage'
import SearchInput from '@/components/input/SearchInput'
import Selection from '@/components/selection'
import Table from '@/components/table'
import Toggle from '@/components/toggle'
import CustomTooltip from '@/components/tooltip'
import { Paragraph, TextHeading } from '@/components/typography'
import { GAMMA_TYPES, PAIR_TYPES } from '@/constant'
import { usePairs } from '@/context/pairsContext'
import { useVaults } from '@/context/vaultsContext'
import { formatAmount } from '@/lib/utils'
import { useChainSettings } from '@/state/settings/hooks'
import { InfoIcon } from '@/svgs'

import AddLiquidityModal from './addLiquidityModal'
import NewListings from './NewListings'

export const listPoolAddressSpecial = [
  '0x755a52d29b24d6871899a84f476339183e9dc95d',
  '0xa07bbf09b48e8d219774ac9b92622f5260a9c9f4',
  '0x04d6115703b0127888323f142b8046c7c13f857d',
  '0x5b0baf66718caabda49a4af32eb455c3b99b5821',
  '0xbf121d987f9635ed6d2f7bb957fbbe163bdea0e0',
  '0xf8a4cdf9efc4b9b38eaa6e27ee281cb2111fa664',
]

const sortOptions = [
  {
    label: 'Pair',
    value: 'pair',
    width: 'lg:w-[25%]',
    isDesc: true,
  },
  {
    label: 'APR',
    value: 'apr',
    width: 'lg:w-[20%]',
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
    width: 'lg:w-[calc(25%-135px)]',
    isDesc: true,
  },
  {
    label: '',
    value: 'action',
    width: 'lg:w-[135px]',
    disabled: true,
  },
]

export const STRATEGIES = {
  All: 'All',
  ICHI: 'ICHI',
  Gamma: 'Gamma',
  DefiEdge: 'DefiEdge',
}

export default function PoolsPage() {
  const [searchText, setSearchText] = useState('')
  const [isInactive, setIsInactive] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [sort, setSort] = useState(sortOptions[2])
  const [filter, setFilter] = useState(PAIR_TYPES.All)
  const [strategy, setStrategy] = useState(STRATEGIES.All)
  const [currentPage, setCurrentPage] = useState(1)
  const { push } = useRouter()
  const { pairs } = usePairs()
  const vaults = useVaults()
  const { networkId } = useChainSettings()
  const t = useTranslations()

  const filteredPools = useMemo(() => {
    let final
    if (isInactive) {
      final = pairs.filter(ele => !ele.highApr)
    } else {
      final = pairs.filter(ele => ele.highApr > 0)
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
            const withSpace = item.symbol.replace('/', ' ')
            const withComma = item.symbol.replace('/', ',')
            return (
              item.symbol.toLowerCase().includes(searchText.toLowerCase()) ||
              withSpace.toLowerCase().includes(searchText.toLowerCase()) ||
              withComma.toLowerCase().includes(searchText.toLowerCase())
            )
          })
  }, [isInactive, filter, strategy, searchText, pairs])

  // TODO: If new pools, update here
  const newListPoolIds = [
    '0x987c794c0786ee5cd6b34b7e32aa21098cd6b806', // ZRO/BNB
    '0xb3f3312252cade3a15eba318f6caaacb5e8097f4', // BNB/RWA
    '0xe2bb11d6b6a39e55762f5e14d632f0981198b3a7', // uniBTC/FBTC
    '0x716fe318602a603959c3af4676aed74b22c615da', // BNB/MGP
    '0x11f3c9ca27ed4931efd0fbe0fd5dfc75157a1ea9', // BNB/KOMA
    '0x47600bc3ae9b5b97ef92a55e550066944fe17670', // BNB/lpBNB
    '0x58cad2ea28853bbe1501188787c10469b2f0c4f1', // BNB/COCO
    '0xc57061da1894ae58fb834f6db33e9a45cc4e7807', // MONKY/BNB
  ]

  const newListingsPool = filteredPools.filter(item => newListPoolIds.includes(item.address))

  const sortedData = useMemo(
    () =>
      filteredPools.sort((a, b) => {
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
    [filteredPools, sort],
  )

  const finalPools = useMemo(
    () => {
      const weETHPoolAddress = '0xc0e1c9fec0d8888039095da014382d027f27069d'
      const ynBNBPoolAddress = '0xcfac0990700ed9b67fefbd4b26a79e426468a419'
      const BNBLpBNBPoolAdress = '0x47600bc3ae9b5b97ef92a55e550066944fe17670'
      const BTCBmBTCAddress = '0x01e4a13b64a35ec29c490374c0ac6a585ff7ce79' // BTCB/mBTC

      return sortedData.map(pool => ({
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
            {pool.address === BNBLpBNBPoolAdress && (
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

            {(pool.token0.isWarning || pool.token1.isWarning) && (
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

  return (
    <div>
      {vaults.length > 0 && (
        <>
          <div className='flex items-center justify-between'>
            <h2>{networkId === ChainId.BSC ? t('THE Single Sided Vaults') : t('Single Sided Vaults')} </h2>
          </div>
          <div className='mt-4 flex items-center gap-8 overflow-auto pb-4'>
            {vaults.map(trending => (
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
                      <Paragraph className='text-sm'>{t(PAIR_TYPES.LSD)}</Paragraph>
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
          <PrimaryButton className='w-full lg:w-auto' onClick={() => setIsOpen(true)}>
            {t('Add Liquidity')}
          </PrimaryButton>
        </div>
        {newListingsPool.length > 0 && (
          <NewListings
            pools={newListingsPool}
            sortOptions={sortOptions}
            listPoolAddressSpecial={listPoolAddressSpecial}
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

      <AddLiquidityModal popup={isOpen} setPopup={setIsOpen} />
    </div>
  )
}
