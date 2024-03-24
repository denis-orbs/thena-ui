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
    width: 'lg:flex-1',
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
    final = filter === PAIR_TYPES.All ? final : final.filter(item => item.type === filter)
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
  }, [pairs, filter, strategy, searchText, isInactive])

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
    () =>
      sortedData.map(pool => ({
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
              <Paragraph className='text-sm'>{pool.type}</Paragraph>
            </div>
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
            <Paragraph>${formatAmount(pool.tvlUSD)}</Paragraph>
            <InfoIcon className='h-4 w-4 stroke-neutral-400' data-tooltip-id={`tvl-${pool.address}`} />
            <CustomTooltip id={`tvl-${pool.address}`}>
              <div className='flex flex-col gap-1'>
                <p>{`${formatAmount(pool.reserve0)} ${pool.token0.symbol}`}</p>
                <p>{`${formatAmount(pool.reserve1)} ${pool.token1.symbol}`}</p>
              </div>
            </CustomTooltip>
          </div>
        ),
        volume: <Paragraph>${formatAmount(pool.dayVolume)}</Paragraph>,
        fee: <Paragraph>${formatAmount(pool.dayFees)}</Paragraph>,
        action: (
          <EmphasisButton className='w-full lg:w-fit' onClick={() => push(`/pools/${pool.address}`)}>
            Details
          </EmphasisButton>
        ),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(sortedData), push],
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
                    <TextHeading className='text-sm'>{formatAmount(trending.gauge.apr)}%</TextHeading>
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
              placeHolder='Choose category'
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
              <Paragraph>Sort by</Paragraph>
              <Dropdown
                data={sortOptions.slice(0, sortOptions.length - 1)}
                selected={sort ? `${sort.label}` : ''}
                setSelected={ele => setSort(ele)}
                placeHolder='Select sort'
              />
            </div>
          </div>
          <PrimaryButton className='w-full lg:w-auto' onClick={() => setIsOpen(true)}>
            Add Liquidity
          </PrimaryButton>
        </div>
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
