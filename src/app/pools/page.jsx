'use client'

import { useRouter } from 'next/navigation'
import React, { useEffect, useMemo, useState } from 'react'

import { NeutralBadge } from '@/components/badges/Badge'
import Box from '@/components/box'
import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import Dropdown from '@/components/dropdown'
import IconGroup from '@/components/icongroup'
import SearchInput from '@/components/input/SearchInput'
import Selection from '@/components/selection'
import Table from '@/components/table'
import Toggle from '@/components/toggle'
import CustomTooltip from '@/components/tooltip'
import { Paragraph, TextHeading, TextSubHeading } from '@/components/typography'
import { GAMMA_TYPES, PAIR_TYPES } from '@/constant'
import { usePairs } from '@/context/pairsContext'
import { formatAmount } from '@/lib/utils'
import { InfoIcon } from '@/svgs'

import AddLiquidityModal from './addLiquidityModal'

const sortOptions = [
  {
    label: 'Pair',
    value: 'pair',
    width: 'min-w-[200px] w-[25%]',
    isDesc: true,
  },
  {
    label: 'APR',
    value: 'apr',
    width: 'min-w-[100px] w-[20%]',
    isDesc: true,
  },
  {
    label: 'TVL',
    value: 'tvl',
    width: 'min-w-[100px] w-[15%]',
    isDesc: true,
  },
  {
    label: 'Volume (24h)',
    value: 'volume',
    width: 'min-w-[150px] w-[15%]',
    isDesc: true,
  },
  {
    label: 'Fees (24h)',
    value: 'fee',
    width: 'min-w-[180px] flex-1',
    isDesc: true,
  },
  {
    label: '',
    value: 'action',
    width: 'min-w-[115px] lg:min-w-[135px]',
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

  const trendingPools = useMemo(() => pairs.sort((a, b) => b.highApr - a.lowApr).slice(0, 4), [pairs])

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
        tvl: <Paragraph>${formatAmount(pool.tvlUSD)}</Paragraph>,
        volume: <Paragraph>${formatAmount(pool.dayVolume)}</Paragraph>,
        fee: <Paragraph>${formatAmount(pool.dayFees)}</Paragraph>,
        action: <EmphasisButton onClick={() => push(`/pools/${pool.address}`)}>Details</EmphasisButton>,
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
      <div className='flex items-center justify-between'>
        <h2>Trending Pools</h2>
      </div>
      <div className='mt-4 flex items-center gap-8 overflow-auto pb-4'>
        {trendingPools.map(trending => (
          <Box
            className='flex w-full cursor-pointer flex-col gap-4'
            key={trending.address}
            onClick={() => push(`/pools/${trending.address}`)}
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
                  <TextHeading className='text-lg'>{trending.symbol}</TextHeading>
                  <TextSubHeading>Fee: {trending.fee}%</TextSubHeading>
                </div>
              </div>
              <NeutralBadge className='text-nowrap'>{trending.type}</NeutralBadge>
            </div>
            <div className='flex flex-col gap-2'>
              <div className='flex items-center justify-between'>
                <Paragraph className='text-sm'>APR</Paragraph>
                <TextHeading className='text-sm'>{trending.apr}</TextHeading>
              </div>
              <div className='flex items-center justify-between'>
                <Paragraph className='text-sm'>TVL</Paragraph>
                <TextHeading className='text-sm'>${formatAmount(trending.tvlUSD)}</TextHeading>
              </div>
              <div className='flex items-center justify-between'>
                <Paragraph className='text-sm'>Volume</Paragraph>
                <TextHeading className='text-sm'>${formatAmount(trending.dayVolume)}</TextHeading>
              </div>
              <div className='flex items-center justify-between'>
                <Paragraph className='text-sm'>Fees</Paragraph>
                <TextHeading className='text-sm'>${formatAmount(trending.dayFees)}</TextHeading>
              </div>
            </div>
          </Box>
        ))}
      </div>
      <div className='mt-6 flex flex-col gap-4'>
        <div className='flex items-center justify-between'>
          <TextHeading className='text-xl'>{isInactive ? 'Inactive' : 'Active'} pools</TextHeading>
          <Toggle
            className='lg:hidden'
            checked={isInactive}
            onChange={() => setIsInactive(!isInactive)}
            toggleId='active'
            label='Inactive pools'
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
              label='Inactive pools'
            />
          </div>
          <PrimaryButton className='w-full lg:w-auto' onClick={() => setIsOpen(true)}>
            Add liquidity
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
