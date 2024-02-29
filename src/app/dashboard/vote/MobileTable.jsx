'use client'

import React from 'react'

import { TextHeading } from '@/components/typography'
import { cn } from '@/lib/utils'
import { ArrowLeftIcon } from '@/svgs'

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
    <div
      className={cn('flex items-start gap-3 self-stretch bg-neutral-900 px-3 pb-3 pt-1 lg:p-5', className)}
      {...rest}
    >
      {children}
    </div>
  )
}

const PAGE_SIZE = 10

function MobileTable({
  className,
  sortOptions,
  data,
  currentPage,
  setCurrentPage,
  notAction = false,
  hidePagination = false,
}) {
  const pageCount = Math.ceil(data.length / PAGE_SIZE)

  return (
    <div className={cn('reltaive flex flex-col gap-3 rounded-xl bg-neutral-900 px-2 py-3 lg:hidden lg:p-4', className)}>
      {data.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map((ele, eleIdx) => (
        <div
          className={cn('flex w-full flex-wrap items-start rounded-lg border-b border-neutral-700 last:border-b-0')}
          onClick={() => ele.onRowClick && ele.onRowClick()}
          key={`pair-${eleIdx}`}
        >
          <TableCell className={cn('flex w-full flex-col')}>{ele[sortOptions[0].value]}</TableCell>
          {sortOptions.slice(1, sortOptions.length - 1).map((cell, cellIdx) => (
            <TableCell
              className={cn(
                'flex w-1/2 flex-col',
                !notAction && 'border-neutral-700 last:sticky last:right-0 last:border-l',
              )}
              key={`${cell.value}-${cellIdx}`}
            >
              <TextHeading>{cell.label}</TextHeading>
              {ele[cell.value]}
            </TableCell>
          ))}
          {!notAction && (
            <TableCell className={cn('flex w-full flex-col')}>
              {ele[sortOptions[sortOptions.length - 1].value]}
            </TableCell>
          )}
        </div>
      ))}
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

export default MobileTable
