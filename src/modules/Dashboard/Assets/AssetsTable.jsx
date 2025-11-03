import { useTranslations } from 'next-intl'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { zeroAddress } from 'viem'

import NewSearchInput from '@/components/input/NewSearchInput'
import { TextHeading } from '@/components/typography'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import useWallet from '@/hooks/useWallet'
import ArrowDownIcon from '@/icons/ArrowDownIcon'
import { cn, formatNumber } from '@/lib/utils'
import { calculateManualAPR } from '@/state/fusion/utils'

import FarmingItem from './FarmingItem'
import ManualItem from './ManualItem'
import NotStakedItem from './NotStakedItem'
import Pagination from './Pagination'
import StakedItem from './StakedItem'
import WeightedItem from './WeightedItem'

const ITEMS_PER_PAGE = 10

const columns = [
  {
    label: 'Pair',
    value: 'pair',
    width: 'xl:w-[240px] 3xl:w-[245px]',
    isDesc: true,
  },
  {
    label: 'Range',
    value: 'range',
    width: 'xl:w-[260px] 3xl:w-[300px]',
    disabled: true,
  },
  {
    label: 'My APR',
    value: 'apr',
    width: 'xl:w-[120px] 3xl:w-[180px]',
    maxWidth: 'xl:max-w-[120px] 3xl:max-w-[180px]',
    isDesc: true,
  },
  {
    label: 'My Value',
    value: 'value',
    width: 'xl:w-[120px] 3xl:w-[180px]',
    maxWidth: 'xl:max-w-[120px] 3xl:max-w-[180px]',
    isDesc: true,
  },
  {
    label: 'Rewards',
    value: 'rewards',
    width: 'xl:w-[120px] 3xl:w-[180px]',
    maxWidth: 'xl:max-w-[120px] 3xl:max-w-[180px]',
    isDesc: true,
  },
  {
    label: '',
    value: 'search',
    width: 'xl:w-[300px] 2xl:w-[320px]',
    disabled: true,
  },
]

function TableHeader({ sort, setSort, searchText, setSearchText }) {
  const t = useTranslations()
  return (
    <thead className='border-b border-neutral-800'>
      <tr>
        {columns.map((column, idx) => (
          <th
            className={cn(
              'gap-1 px-2 py-4 first:pl-4 last:pr-4',
              !column.disabled && 'cursor-pointer',
              column.width,
              column.justify,
              column.minWidth,
              column.maxWidth,
            )}
            key={`header-${idx}`}
            onClick={() => {
              if (!column.disabled) {
                let { isDesc } = column
                if (sort && sort.value === column.value) isDesc = !sort.isDesc
                setSort({ ...column, isDesc })
              }
            }}
          >
            {column.value === 'search' ? (
              <NewSearchInput className='w-full lg:w-auto' val={searchText} setVal={setSearchText} />
            ) : (
              <div className='flex items-center gap-2'>
                <TextHeading className='3xl:text-[17px] text-base'>
                  {column.label !== '' ? t(column.label) : column.label}
                </TextHeading>
                <div className='size-4'>
                  {sort.value === column.value && !column.disabled && (
                    <ArrowDownIcon
                      className={cn(
                        'transfrom transition-all duration-150 ease-out',
                        sort.isDesc ? 'rotate-0' : 'rotate-180',
                      )}
                    />
                  )}
                </div>
              </div>
            )}
          </th>
        ))}
      </tr>
    </thead>
  )
}

function TableBody({ positions, setCurrentHoverTableRow, isXlDown, setIsHoverFromChart }) {
  const renderPosition = useCallback(
    position => {
      if (position.type === 'Manual') {
        return position?.deployer === zeroAddress ? (
          <FarmingItem position={position} isXlDown={isXlDown} />
        ) : (
          <ManualItem position={position} isXlDown={isXlDown} />
        )
      }

      if (position.type === 'Weighted') {
        if (position.notStaked) {
          return <WeightedItem position={position} isStake={false} isXlDown={isXlDown} />
        }

        if (position.staked) {
          return <WeightedItem position={position} isStake isXlDown={isXlDown} />
        }
      }

      return position.staked ? (
        <StakedItem position={position} isXlDown={isXlDown} />
      ) : (
        <NotStakedItem position={position} isXlDown={isXlDown} />
      )
    },
    [isXlDown],
  )

  return !isXlDown ? (
    <tbody className='py-6'>
      <tr className='h-6' />
      {positions.map((position, index) => (
        <tr
          key={`table-row-${index}`}
          id={`table-row-${index}`}
          className='position-item my-1 h-[76px] rounded-md hover:bg-neutral-800 [&>td]:px-2'
          onMouseEnter={() => {
            setIsHoverFromChart(false)
            setCurrentHoverTableRow(position.positionId)
          }}
          onMouseLeave={() => {
            setCurrentHoverTableRow(null)
          }}
        >
          {renderPosition(position)}
        </tr>
      ))}
      <tr className='h-6' />
    </tbody>
  ) : (
    positions.map((position, index) => (
      <div
        key={`table-row-${index}`}
        id={`table-row-${index}`}
        className='position-item hover:bg-neutral-800'
        data-position-id={position.positionId}
        onMouseEnter={() => {
          setIsHoverFromChart(false)
          setCurrentHoverTableRow(position.positionId)
        }}
        onMouseLeave={() => {
          setCurrentHoverTableRow(null)
        }}
      >
        {renderPosition(position)}
      </div>
    ))
  )
}

function AssetsTable({ positions = [], setCurrentHoverTableRow, setIsHoverFromChart }) {
  const { account, chainId } = useWallet()
  const accountRef = useRef(account)
  const chainIdRef = useRef(chainId)
  const { isXlDown } = useMediaQuery()

  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchText, setSearchText] = useState('')
  const [sort, setSort] = useState(columns[2])

  const filteredPools = useMemo(() => {
    const filtered = !searchText
      ? positions
      : positions &&
        positions.filter(item => {
          const symbol = item?.symbol?.toLowerCase() || ''
          const tokens = symbol.split('/')
          const searchTerms = searchText.toLowerCase().split(/[\s/,]+/)
          return searchTerms.every(term => tokens.some(token => token.includes(term)))
        })

    const desc = sort.isDesc ? -1 : 1

    const sorted = [...filtered].sort((a, b) => {
      let res
      switch (sort.value) {
        case 'pair':
          res = (a.symbol?.localeCompare(b.symbol) || 0) * desc
          break
        case 'apr':
          res =
            (formatNumber(a.type === 'Manual' ? calculateManualAPR(a) : Number(a.apr) || 0) -
              formatNumber(b.type === 'Manual' ? calculateManualAPR(b) : Number(b.apr) || 0)) *
            desc
          break
        case 'value':
          res = (formatNumber(a.fiatValueOfLiquidity) - formatNumber(b.fiatValueOfLiquidity)) * desc
          break
        case 'rewards':
          res = (formatNumber(a.rewardUsd) - formatNumber(b.rewardUsd)) * desc
          break

        default:
          break
      }
      return res
    })

    return sorted
  }, [positions, searchText, sort.isDesc, sort.value])

  const totalPages = useMemo(() => Math.ceil(filteredPools.length / itemsPerPage), [filteredPools.length, itemsPerPage])

  const paginatedPositions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredPools.slice(start, start + itemsPerPage)
  }, [currentPage, itemsPerPage, filteredPools])

  useEffect(() => {
    setCurrentPage(1)
  }, [itemsPerPage, account, chainId])

  useEffect(() => {
    if (account && accountRef.current !== account) {
      accountRef.current = account
      location.reload()
    }

    if (chainId && chainIdRef.current !== chainId) {
      chainIdRef.current = chainId
      location.reload()
    }
  }, [account, chainId])

  return (
    <div className='w-full rounded-lg max-md:px-0'>
      {!isXlDown && (
        <table className='w-full table-auto'>
          <TableHeader
            columns={columns}
            sort={sort}
            setSort={setSort}
            searchText={searchText}
            setSearchText={setSearchText}
          />
          <TableBody
            setCurrentHoverTableRow={setCurrentHoverTableRow}
            positions={paginatedPositions}
            isXlDown={isXlDown}
            setIsHoverFromChart={setIsHoverFromChart}
          />
        </table>
      )}

      {isXlDown && (
        <TableBody
          setCurrentHoverTableRow={setCurrentHoverTableRow}
          positions={paginatedPositions}
          isXlDown={isXlDown}
          setIsHoverFromChart={setIsHoverFromChart}
        />
      )}

      <Pagination
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalPages={totalPages}
        itemsPerPage={itemsPerPage}
        setItemsPerPage={setItemsPerPage}
      />
    </div>
  )
}

export default React.memo(AssetsTable)
