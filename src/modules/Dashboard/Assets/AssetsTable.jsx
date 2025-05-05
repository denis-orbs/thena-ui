import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { zeroAddress } from 'viem'

import NewSearchInput from '@/components/input/NewSearchInput'
import { TextHeading } from '@/components/typography'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import useWallet from '@/hooks/useWallet'
import { cn } from '@/lib/utils'
import { ArrowDownIcon } from '@/svgs'

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
    width: 'xl:w-[240px]',
    isDesc: true,
  },
  {
    label: 'Range',
    value: 'range',
    width: 'xl:w-[260px] 2xl:w-[284px]',
    disabled: true,
  },
  {
    label: 'My APR',
    value: 'apr',
    maxWidth: 'xl:max-w-[100px]',
    isDesc: true,
  },
  {
    label: 'My Value',
    value: 'value',
    maxWidth: 'xl:max-w-[100px]',
    isDesc: true,
  },
  {
    label: 'Rewards',
    value: 'rewards',
    maxWidth: 'xl:max-w-[100px]',
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
  return (
    <thead className='border-b border-neutral-800'>
      <tr>
        {columns.map((column, idx) => (
          <th
            className={cn(
              'gap-1 px-2 py-4',
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
                <TextHeading className='text-base 2xl:text-lg'>{column.label}</TextHeading>
                {sort.value === column.value && !column.disabled && (
                  <ArrowDownIcon
                    className={cn(
                      'transfrom h-4 w-4 cursor-pointer stroke-neutral-400 transition-all duration-150 ease-out',
                      sort.isDesc ? 'rotate-0' : 'rotate-180',
                    )}
                  />
                )}
              </div>
            )}
          </th>
        ))}
      </tr>
    </thead>
  )
}

function TableBody({ positions, isXlDown }) {
  const renderPosition = useCallback(position => {
    if (position.type === 'Manual') {
      return position?.deployer === zeroAddress ? (
        <FarmingItem position={position} />
      ) : (
        <ManualItem position={position} />
      )
    }

    if (position.type === 'Weighted') {
      if (position.notStaked) {
        return <WeightedItem position={position} isStake={false} />
      }

      if (position.staked) {
        return <WeightedItem position={position} isStake />
      }
    }

    return position.staked ? <StakedItem position={position} /> : <NotStakedItem position={position} />
  }, [])

  return !isXlDown ? (
    <tbody className='py-6'>
      <tr className='h-6' />
      {positions.map((position, index) => (
        <tr
          key={`table-row-${index}`}
          id={`table-row-${index}`}
          className='h-[60px] first:mt-6 [&>td]:h-[60px] [&>td]:p-2'
        >
          {renderPosition(position)}
        </tr>
      ))}
      <tr className='h-6' />
    </tbody>
  ) : (
    positions.map((position, index) => (
      <div key={`table-row-${index}`} id={`table-row-${index}`}>
        {renderPosition(position)}
      </div>
    ))
  )
}

function AssetsTable({ positions = [] }) {
  const { account, chainId } = useWallet()
  const accountRef = useRef(account)
  const chainIdRef = useRef(chainId)
  const { isXlDown } = useMediaQuery()

  const [itemPerPage, setItemPerPage] = useState(ITEMS_PER_PAGE)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchText, setSearchText] = useState('')
  const [sort, setSort] = useState(columns[2])

  const filteredPools = useMemo(() => {
    const filtered = !searchText
      ? positions
      : positions &&
        positions.filter(item => {
          const withSpace = item.symbol.replace('/', ' ')
          const withComma = item.symbol.replace('/', ',')
          return (
            item.symbol.toLowerCase().includes(searchText.toLowerCase()) ||
            withSpace.toLowerCase().includes(searchText.toLowerCase()) ||
            withComma.toLowerCase().includes(searchText.toLowerCase())
          )
        })

    const desc = sort.isDesc ? -1 : 1

    const sorted = filtered.sort((a, b) => {
      let res
      switch (sort.value) {
        case 'pair':
          res = (a.symbol?.localeCompare(b.symbol) || 0) * desc
          break
        case 'apr':
          res = (Number(a.apr) - Number(b.apr)) * desc
          break
        case 'value':
          res = (Number(a.fiatValueOfLiquidity) - Number(b.fiatValueOfLiquidity)) * desc
          break
        case 'rewards':
          res = (Number(a.rewardUsd) - Number(b.rewardUsd)) * desc
          break

        default:
          break
      }
      return res
    })

    return sorted
  }, [positions, searchText, sort.isDesc, sort.value])

  const totalPages = useMemo(() => Math.ceil(filteredPools.length / itemPerPage), [filteredPools.length, itemPerPage])

  const paginatedPositions = useMemo(() => {
    const start = (currentPage - 1) * itemPerPage
    return filteredPools.slice(start, start + itemPerPage)
  }, [currentPage, itemPerPage, filteredPools])

  useEffect(() => {
    setCurrentPage(1)
  }, [itemPerPage, account, chainId])

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
          <TableBody positions={paginatedPositions} isXlDown={isXlDown} />
        </table>
      )}

      {isXlDown && <TableBody positions={paginatedPositions} isXlDown={isXlDown} />}

      <Pagination
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalPages={totalPages}
        itemPerPage={itemPerPage}
        setItemPerPage={setItemPerPage}
      />
    </div>
  )
}

export default React.memo(AssetsTable)
