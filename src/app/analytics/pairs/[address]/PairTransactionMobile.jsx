import { useTranslations } from 'next-intl'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { EmphasisButton } from '@/components/buttons/Button'
import { TextIconButton } from '@/components/buttons/IconButton'
import Highlight from '@/components/highlight'
import Tabs from '@/components/tabs'
import { Paragraph, TextHeading } from '@/components/typography'
import { TXN_TYPE } from '@/constant'
import { SizeTypes } from '@/constant/type'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import ArrowLeftIcon from '@/icons/ArrowLeftIcon'
import ChevronDownIcon from '@/icons/ChevronDownIcon'
import InfoIcon from '@/icons/InfoIcon'
import cn from '@/utils/classes'
import { formatAddress, formatAmount } from '@/utils/utils'

import BackRevertIcon from '~/svgs/backRevert.svg'
import CoinsStackedIcon from '~/svgs/coins-stacked.svg'
import ReverseIcon from '~/svgs/reverse.svg'

function Pagination({ currentPage, totalPages, onPageChange, pageSize, onPageSizeChange, className = '' }) {
  const [showPageSizeOptions, setShowPageSizeOptions] = useState(false)
  const [dropdownDirection, setDropdownDirection] = useState('down')
  const pageSizes = [5, 10, 20, 50, 100]
  const dropdownRef = useRef(null)
  const buttonRef = useRef(null)

  const { isViewDown: isMobile } = useMediaQuery('down', 500)
  // Custom getVisiblePages for mobile
  const getVisiblePages = () => {
    if (isMobile) {
      const pages = []
      if (totalPages <= 4) {
        for (let i = 1; i <= totalPages; i++) pages.push(i)
        return pages
      }
      // currentPage near start
      if (currentPage <= 3) {
        pages.push(1, 2, 3, '...', totalPages)
        return pages
      }
      // currentPage near end
      if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 2, totalPages - 1, totalPages)
        return pages
      }
      // currentPage in the middle
      pages.push(1, '...', currentPage - 1, currentPage, '...', totalPages)
      return pages
    }
    // logic for desktop...
    const delta = 1
    const rangeWithDots = []
    if (currentPage > delta + 2) {
      rangeWithDots.push(1)
      if (currentPage > delta + 3) {
        rangeWithDots.push('...')
      }
    }
    for (let i = Math.max(1, currentPage - delta); i <= Math.min(totalPages, currentPage + delta); i++) {
      rangeWithDots.push(i)
    }
    if (currentPage < totalPages - delta - 1) {
      if (currentPage < totalPages - delta - 2) {
        rangeWithDots.push('...')
      }
      rangeWithDots.push(totalPages)
    }
    return rangeWithDots
  }

  const handlePageSizeSelect = size => {
    onPageSizeChange(size)
    setShowPageSizeOptions(false)
  }

  useEffect(() => {
    if (!showPageSizeOptions) return
    const handleClickOutside = event => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setShowPageSizeOptions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showPageSizeOptions])

  useEffect(() => {
    if (showPageSizeOptions && buttonRef.current && dropdownRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect()
      const dropdownHeight = dropdownRef.current.offsetHeight || 160
      const spaceBelow = window.innerHeight - buttonRect.bottom
      const spaceAbove = buttonRect.top
      if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
        setDropdownDirection('up')
      } else {
        setDropdownDirection('down')
      }
    }
  }, [showPageSizeOptions])
  if (totalPages <= 1) return null
  return (
    <div className={cn('flex h-8 w-full items-center justify-between lg:h-11', className)}>
      <div className='flex flex-row items-center gap-1 sm:gap-[9px]'>
        {/* Previous Button */}
        <TextIconButton
          Icon={ArrowLeftIcon}
          className='size-8'
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
        />
        {/* Page Numbers */}
        {getVisiblePages().map((page, index, arr) => {
          if (page === '...') {
            return (
              <EmphasisButton
                key={`ellipsis-${index}`}
                onClick={() => {
                  // Jump to middle page
                  if (index < arr.indexOf(currentPage)) {
                    onPageChange(Math.max(currentPage - 2, 1))
                  } else {
                    onPageChange(Math.min(currentPage + 2, totalPages))
                  }
                }}
                className={cn('size-8 bg-transparent')}
              >
                ...
              </EmphasisButton>
            )
          }
          return (
            <EmphasisButton
              key={index}
              onClick={() => onPageChange(page)}
              className={cn('size-8', page !== currentPage && 'bg-transparent')}
            >
              {page}
            </EmphasisButton>
          )
        })}
        {/* Next Button */}
        <TextIconButton
          Icon={ArrowLeftIcon}
          className='size-8'
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        />
      </div>
      {/* Custom Page Size Dropdown mới */}
      <div className='relative ml-2'>
        <button
          ref={buttonRef}
          className='flex h-8 w-[70px] items-center justify-between rounded border-none bg-neutral-700 px-2 text-base text-neutral-400 outline-none hover:bg-neutral-600'
          onClick={() => setShowPageSizeOptions(prev => !prev)}
          type='button'
        >
          {pageSize}
          <ChevronDownIcon isRevert={showPageSizeOptions} />
        </button>
        {showPageSizeOptions && (
          <ul
            ref={dropdownRef}
            className={`absolute z-50 max-h-40 w-[70px] overflow-y-auto rounded bg-neutral-700 shadow-lg ${
              dropdownDirection === 'up' ? 'bottom-10 mb-1' : 'right-0 mt-1'
            }`}
            style={{ right: 0 }}
          >
            {pageSizes.map(size => (
              <li key={size}>
                <button
                  type='button'
                  className={cn(
                    'w-full cursor-pointer px-3 py-1 text-left text-base text-neutral-300 hover:bg-neutral-600',
                    size === pageSize ? 'bg-neutral-600 font-bold' : '',
                  )}
                  onClick={() => handlePageSizeSelect(size)}
                >
                  {size}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function TransactionMobile({
  filters = [],
  getTransactionType,
  formatTime,
  className = '',
  filter,
  sortedData,
  isWeighted = false,
}) {
  const t = useTranslations()
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

  const getTypeIcon = useCallback(type => {
    switch (type) {
      case TXN_TYPE.ADD:
        return <CoinsStackedIcon className='size-4' />
      case TXN_TYPE.REMOVE:
        return <BackRevertIcon className='size-4' />
      case TXN_TYPE.SWAP:
        return <ReverseIcon className='size-4' />
      default:
        return null
    }
  }, [])
  // Pagination logic
  const totalPages = Math.ceil(sortedData.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedData = sortedData.slice(startIndex, endIndex)

  // Handle page change
  const handlePageChange = page => {
    setCurrentPage(page)
  }

  // Reset page when data changes
  useMemo(() => {
    setCurrentPage(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter])

  return (
    <div className={`mt-3 flex flex-col gap-3 px-4 ${className}`}>
      <Tabs data={filters} size={SizeTypes.Small} className='w-full md:w-fit' itemClassName='md:w-fit w-full' />

      {/* Transaction List */}
      <div className='space-y-0 divide-y-1 divide-neutral-700'>
        {paginatedData.length > 0 ? (
          paginatedData.map((item, index) => (
            <div key={`${item.id || index}-${currentPage}`} className='min-w-0 space-y-2 px-2 py-4 transition-colors'>
              {/* Header */}
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  {getTypeIcon(item.type)}
                  <TextHeading className='text-base! font-normal'>
                    {getTransactionType(item.type, item.token1Symbol, item.token0Symbol, t)}
                  </TextHeading>
                </div>
                <Paragraph className='text-base!'>${formatAmount(item.amountUSD, true)}</Paragraph>
              </div>

              {/* Details Grid */}
              <div className='flex min-w-0 items-center justify-between gap-4 overflow-x-auto'>
                {isWeighted ? (
                  (item.tokens || []).map(token => (
                    <div key={token.symbol} className='flex flex-col'>
                      <TextHeading className='text-[10px]! leading-4 text-neutral-300'>{t('Amount')}</TextHeading>
                      <TextHeading className='text-[10px]! leading-4 text-nowrap text-neutral-300'>
                        {formatAmount(Number(token.amount) < 0 ? token.amount * -1 : token.amount)} {token.symbol}
                      </TextHeading>
                    </div>
                  ))
                ) : (
                  <>
                    <div className='flex flex-col'>
                      <TextHeading className='text-[10px]! leading-4 text-neutral-300'>{t('Amount')}</TextHeading>
                      <TextHeading className='text-[10px]! leading-4 text-nowrap text-neutral-300'>
                        {`${formatAmount(item.token0Amount)} ${item.token0Symbol}`}
                      </TextHeading>
                    </div>
                    <div className='flex flex-col'>
                      <TextHeading className='text-[10px]! leading-4! text-neutral-300'>{t('Amount')}</TextHeading>
                      <TextHeading className='text-[10px]! leading-4! text-nowrap text-neutral-300'>
                        {`${formatAmount(item.token1Amount)} ${item.token1Symbol}`}
                      </TextHeading>
                    </div>
                  </>
                )}
                <div className='flex flex-col'>
                  <TextHeading className='text-[10px]! leading-4! text-neutral-300'>{t('Account')}</TextHeading>
                  <TextHeading className='text-[10px]! leading-4! text-nowrap text-neutral-300'>
                    {item.account && formatAddress(item.account)}
                  </TextHeading>
                </div>
                <div className='flex flex-col'>
                  <TextHeading className='text-[10px]! leading-4! text-neutral-300'>{t('Time')}</TextHeading>
                  <TextHeading className='text-[10px]! leading-4! text-nowrap text-neutral-300'>
                    {`${formatTime(item.timestamp)}`}
                  </TextHeading>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className='flex flex-col items-center justify-center py-8 text-center'>
            <Highlight>
              <InfoIcon className='stroke-neutral-50' />
            </Highlight>
            <TextHeading className='text-neutral-400'>{t('No transactions found')}</TextHeading>
          </div>
        )}
        {/* Pagination */}
        <Pagination
          className='my-4 space-y-2'
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          onPageSizeChange={setPageSize}
          pageSize={pageSize}
        />
      </div>
    </div>
  )
}

export default TransactionMobile
