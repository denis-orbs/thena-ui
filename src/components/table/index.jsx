'use client'

import React from 'react'

import { cn } from '@/lib/utils'
import { ArrowDownIcon, ArrowLeftIcon } from '@/svgs'

import { TextHeading } from '../typography'

function PaginateCell({ children, className, active, onClick }) {
  return (
    <li
      role='presentation'
      className={cn(
        'flex h-8 w-8 items-center justify-center stroke-neutral-300 text-neutral-300',
        'hover:bg-neutral-700 hover:stroke-neutral-200 hover:text-neutral-200',
        'outline outline-2 outline-offset-4 outline-transparent',
        'cursor-pointer rounded transition-all duration-150 ease-out',
        'active:outline-focus',
        active && 'bg-neutral-800',
        className,
      )}
      onClick={onClick}
    >
      {children}
    </li>
  )
}

function TableCell({ children, className, ...rest }) {
  return (
    <div className={cn('flex items-center gap-3 self-stretch bg-neutral-900 px-3 py-5 lg:p-5', className)} {...rest}>
      {children}
    </div>
  )
}

const PAGE_SIZE = 10

function Table({
  className,
  sortOptions,
  data,
  sort,
  setSort,
  currentPage,
  setCurrentPage,
  notAction = false,
  hidePagination = false,
}) {
  const pageCount = Math.ceil(data.length / PAGE_SIZE)

  return (
    <div className={cn('reltaive flex flex-col gap-3 rounded-xl bg-neutral-900 px-2 py-3 lg:p-4', className)}>
      <div className='overflow-x-auto'>
        <div className='flex w-full min-w-max items-center border-b border-neutral-700'>
          {sortOptions.map((option, idx) => (
            <TableCell
              className={cn(
                'gap-1',
                !notAction && 'border-neutral-700 last:sticky last:right-0 last:border-l',
                !option.disabled && 'cursor-pointer',
                option.width,
              )}
              key={`header-${idx}`}
              onClick={() => {
                if (!option.disabled) {
                  setSort({
                    ...option,
                    isDesc: sort.value === option.value ? !sort.isDesc : true,
                  })
                }
              }}
            >
              <TextHeading className='text-sm'>{option.label}</TextHeading>
              {sort.value === option.value && (
                <ArrowDownIcon
                  className={cn(
                    'transfrom h-4 w-4 cursor-pointer stroke-neutral-400 transition-all duration-150 ease-out',
                    sort.isDesc ? 'rotate-0' : 'rotate-180',
                  )}
                />
              )}
            </TableCell>
          ))}
        </div>
        {data.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map((ele, eleIdx) => (
          <div
            className={cn(
              'group flex w-full items-center rounded-lg hover:bg-neutral-800',
              ele.onRowClick && 'cursor-pointer',
            )}
            onClick={() => ele.onRowClick && ele.onRowClick()}
            key={`pair-${eleIdx}`}
          >
            {sortOptions.map((cell, cellIdx) => (
              <TableCell
                className={cn(
                  'group-hover:bg-neutral-800',
                  !notAction && 'border-neutral-700 last:sticky last:right-0 last:border-l',
                  cell.width,
                )}
                key={`${cell.value}-${cellIdx}`}
              >
                {ele[cell.value]}
              </TableCell>
            ))}
          </div>
        ))}
      </div>
      {pageCount > 1 && !hidePagination && (
        <ul className='flex items-center justify-center gap-2 px-5 py-3 lg:justify-end'>
          <PaginateCell
            onClick={() => {
              setCurrentPage(Math.max(currentPage - 1, 1))
            }}
          >
            <ArrowLeftIcon className='h-4 w-4' />
          </PaginateCell>
          {pageCount < 6 &&
            new Array(pageCount).fill(0).map((item, idx) => (
              <PaginateCell
                key={`paginate-${idx}`}
                active={currentPage === idx + 1}
                onClick={() => {
                  setCurrentPage(idx + 1)
                }}
              >
                {idx + 1}
              </PaginateCell>
            ))}
          {pageCount >= 6 && (
            <>
              <PaginateCell
                active={currentPage === 1}
                onClick={() => {
                  setCurrentPage(1)
                }}
              >
                1
              </PaginateCell>
              <PaginateCell
                active={currentPage === 2}
                onClick={() => {
                  setCurrentPage(2)
                }}
              >
                2
              </PaginateCell>
              {currentPage > 3 && (
                <PaginateCell
                  onClick={() => {
                    setCurrentPage(currentPage > 3 ? currentPage - 1 : currentPage + 1)
                  }}
                >
                  ...
                </PaginateCell>
              )}
              {currentPage > 2 && currentPage < pageCount - 1 && (
                <PaginateCell
                  active
                  onClick={() => {
                    setCurrentPage(currentPage)
                  }}
                >
                  {currentPage}
                </PaginateCell>
              )}
              {currentPage < pageCount - 2 && (
                <PaginateCell
                  onClick={() => {
                    setCurrentPage(currentPage > pageCount - 2 ? currentPage - 1 : currentPage + 1)
                  }}
                >
                  ...
                </PaginateCell>
              )}
              <PaginateCell
                active={currentPage === pageCount - 1}
                onClick={() => {
                  setCurrentPage(pageCount - 1)
                }}
              >
                {pageCount - 1}
              </PaginateCell>
              <PaginateCell
                active={currentPage === pageCount}
                onClick={() => {
                  setCurrentPage(pageCount)
                }}
              >
                {pageCount}
              </PaginateCell>
            </>
          )}
          <PaginateCell
            onClick={() => {
              setCurrentPage(Math.min(currentPage + 1, pageCount))
            }}
          >
            <ArrowLeftIcon className='h-4 w-4 rotate-180' />
          </PaginateCell>
        </ul>
      )}
    </div>
  )
}

export default Table
