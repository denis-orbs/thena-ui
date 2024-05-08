'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useCallback, useEffect, useState } from 'react'

import Loading from '@/app/loading'
import { cn } from '@/lib/utils'
import { ArrowDownIcon, ArrowLeftIcon } from '@/svgs'

import { TextHeading } from '../typography'

function PaginateCell({ children, className, active, onClick, disabled }) {
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
        disabled && 'cursor-not-allowed hover:bg-inherit active:outline-none active:outline-transparent',
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
    <div className={cn('flex items-start gap-3 self-stretch p-3 lg:items-center lg:p-5', className)} {...rest}>
      {children}
    </div>
  )
}

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
  tableBasic = false,
  onlySortDesc = false,
  enabledRedirectOnClickPagination = false,
  loading = false,
  pageSize = 10,
}) {
  const pageCount = Math.ceil(data.length / pageSize)
  const t = useTranslations()
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [pageQuery, setPageQuery] = useState(1)

  const handleRedirectPage = useCallback(
    newPage => {
      if (enabledRedirectOnClickPagination) {
        if (newPage !== currentPage) {
          const query = new URLSearchParams(searchParams.toString())
          if (newPage > 1) {
            query.set('page', newPage.toString())
            router.replace(`${pathname}?${query.toString()}`)
            return
          }
          router.replace(pathname)
        }
      }
    },
    [currentPage, enabledRedirectOnClickPagination, pathname, router, searchParams],
  )

  useEffect(() => {
    if (searchParams.get('page')) {
      setPageQuery(Number(searchParams.get('page')))
    }
  }, [searchParams])

  useEffect(() => {
    if (enabledRedirectOnClickPagination) {
      setCurrentPage(pageQuery)
    }
  }, [pageQuery, setCurrentPage, enabledRedirectOnClickPagination])

  return (
    <div className={cn('relative flex flex-col gap-3 rounded-xl bg-neutral-900 px-2 py-3 lg:p-4', className)}>
      <div className='overflow-x-auto'>
        {tableBasic ? (
          <table className={`w-full ${loading ? 'min-h-[500px]' : ''}`}>
            <thead>
              <tr>
                {sortOptions.map((option, idx) => (
                  <th
                    className={cn(
                      'gap-1',
                      !option.disabled && 'cursor-pointer',
                      option.width,
                      option.justify,
                      option.minWidth,
                    )}
                    key={`header-${idx}`}
                    onClick={() => {
                      if (!option.disabled) {
                        if (!onlySortDesc) {
                          setSort({
                            ...option,
                            isDesc: sort.value === option.value ? !sort.isDesc : true,
                          })
                        } else {
                          setSort({
                            ...option,
                            isDesc: true,
                          })
                        }
                      }
                    }}
                  >
                    <TableCell className={cn('flex text-nowrap', option.justify)}>
                      <TextHeading className='text-sm'>
                        {option.label && typeof option.label === 'string' ? t(option.label) : option.label}
                      </TextHeading>
                      {sort.value === option.value && !option.disabled && (
                        <ArrowDownIcon
                          className={cn(
                            'transfrom h-4 w-4 cursor-pointer stroke-neutral-400 transition-all duration-150 ease-out',
                            sort.isDesc ? 'rotate-0' : 'rotate-180',
                          )}
                        />
                      )}
                    </TableCell>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className='relative'>
              {loading && (
                <tr>
                  {/* eslint-disable-next-line jsx-a11y/control-has-associated-label */}
                  <td colSpan={sortOptions.length}>
                    <Loading />
                  </td>
                </tr>
              )}
              {!loading &&
                data.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((ele, eleIdx) => (
                  <tr key={`table-row-${eleIdx}`}>
                    {sortOptions.map((cell, cellIdx) => (
                      <td key={`${cell.value}-${cellIdx}`} className={cn(cell.minWidth)}>
                        <TableCell className={cn('flex flex-col text-nowrap lg:flex-row', cell.justify)}>
                          {ele[cell.value]}
                        </TableCell>
                      </td>
                    ))}
                  </tr>
                ))}
            </tbody>
          </table>
        ) : (
          <>
            <div className='hidden w-full min-w-max items-center border-b border-neutral-700 lg:flex'>
              {sortOptions.map((option, idx) => (
                <TableCell
                  className={cn('gap-1', !option.disabled && 'cursor-pointer', option.width, option.justify)}
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
                  <TextHeading className='text-sm'>
                    {option.label && typeof option.label === 'string' ? t(option.label) : option.label}
                  </TextHeading>
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
            {loading && (
              <div className='flex min-h-[500px] w-full justify-center'>
                <Loading />
              </div>
            )}
            {!loading &&
              data.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((ele, eleIdx) => (
                <div
                  className={cn(
                    'flex w-full flex-wrap items-start rounded-lg border-b border-neutral-700 hover:bg-neutral-800 lg:flex-nowrap lg:items-center lg:border-0',
                    ele.onRowClick && 'cursor-pointer',
                  )}
                  onClick={() => ele.onRowClick && ele.onRowClick()}
                  key={`table-row-${eleIdx}`}
                >
                  <TableCell
                    className={cn(
                      'flex w-full',
                      sortOptions[0].width,
                      sortOptions[0].hiddenMobile ? 'max-lg:hidden' : 'flex',
                    )}
                  >
                    {ele[sortOptions[0].value]}
                  </TableCell>
                  {sortOptions.slice(1, sortOptions.length - (notAction ? 0 : 1)).map((cell, cellIdx) => (
                    <TableCell
                      className={cn(
                        'flex w-1/2 flex-col lg:flex-row',
                        cell.width,
                        !cell.hiddenMobile ? 'lg:flex-row' : 'hidden',
                      )}
                      key={`${cell.value}-${cellIdx}`}
                    >
                      <TextHeading className='lg:hidden'>{t(cell.label)}</TextHeading>
                      {ele[cell.value]}
                    </TableCell>
                  ))}
                  {!notAction && (
                    <TableCell className={cn('flex w-full flex-col', sortOptions[sortOptions.length - 1].width)}>
                      {ele[sortOptions[sortOptions.length - 1].value]}
                    </TableCell>
                  )}
                </div>
              ))}
          </>
        )}
      </div>
      {!loading && pageCount > 1 && !hidePagination && (
        <ul className='flex items-center justify-center gap-2 px-5 py-3 lg:justify-end'>
          <PaginateCell
            onClick={() => {
              if (currentPage !== 1) {
                setCurrentPage(Math.max(currentPage - 1, 1))
                handleRedirectPage(Math.max(currentPage - 1, 1))
              }
            }}
            disabled={currentPage === 1}
          >
            <ArrowLeftIcon className={`h-4 w-4${currentPage === 1 ? ' stroke-gray-700' : ''}`} />
          </PaginateCell>
          {pageCount < 6 &&
            new Array(pageCount).fill(0).map((item, idx) => (
              <PaginateCell
                key={`paginate-${idx}`}
                active={currentPage === idx + 1}
                onClick={() => {
                  setCurrentPage(idx + 1)
                  handleRedirectPage(idx + 1)
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
                  handleRedirectPage(1)
                }}
              >
                1
              </PaginateCell>
              <PaginateCell
                active={currentPage === 2}
                onClick={() => {
                  setCurrentPage(2)
                  handleRedirectPage(2)
                }}
              >
                2
              </PaginateCell>
              {currentPage > 3 && (
                <PaginateCell
                  onClick={() => {
                    setCurrentPage(currentPage > 3 ? currentPage - 1 : currentPage + 1)
                    handleRedirectPage(currentPage > 3 ? currentPage - 1 : currentPage + 1)
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
                    handleRedirectPage(currentPage)
                  }}
                >
                  {currentPage}
                </PaginateCell>
              )}
              {currentPage < pageCount - 2 && (
                <PaginateCell
                  onClick={() => {
                    setCurrentPage(currentPage > pageCount - 2 ? currentPage - 1 : currentPage + 1)
                    handleRedirectPage(currentPage > pageCount - 2 ? currentPage - 1 : currentPage + 1)
                  }}
                >
                  ...
                </PaginateCell>
              )}
              <PaginateCell
                active={currentPage === pageCount - 1}
                onClick={() => {
                  setCurrentPage(pageCount - 1)
                  handleRedirectPage(pageCount - 1)
                }}
              >
                {pageCount - 1}
              </PaginateCell>
              <PaginateCell
                active={currentPage === pageCount}
                onClick={() => {
                  setCurrentPage(pageCount)
                  handleRedirectPage(pageCount)
                }}
              >
                {pageCount}
              </PaginateCell>
            </>
          )}
          <PaginateCell
            onClick={() => {
              if (currentPage !== pageCount) {
                setCurrentPage(Math.min(currentPage + 1, pageCount))
                handleRedirectPage(Math.min(currentPage + 1, pageCount))
              }
            }}
            disabled={currentPage === pageCount}
          >
            <ArrowLeftIcon className={`h-4 w-4 rotate-180${currentPage === pageCount ? ' stroke-gray-700' : ''}`} />
          </PaginateCell>
        </ul>
      )}
    </div>
  )
}

export default Table
