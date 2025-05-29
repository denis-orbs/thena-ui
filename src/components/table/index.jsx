'use client'

import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import Loading from '@/app/loading'
import { cn } from '@/lib/utils'
import { ArrowDownIcon, ArrowLeftIcon, PoolCoinsIcon, XIcon } from '@/svgs'

import { TertiaryButton } from '../buttons/Button'
import { TextIconButton } from '../buttons/IconButton'
import Dropdown from '../dropdown'
import Input from '../input'
import { TextHeading, TextSubHeading } from '../typography'

function PaginateCell({ children, className, active, onClick, disabled }) {
  return (
    <li
      role='presentation'
      className={cn(
        'flex h-8 w-fit min-w-8 items-center justify-center stroke-neutral-300 px-[2px] text-neutral-300',
        'hover:bg-neutral-700 hover:stroke-neutral-200 hover:text-neutral-200',
        'outline-2 outline-offset-4 outline-transparent outline-solid',
        'cursor-pointer rounded-sm transition-all duration-150 ease-out',
        'active:outline-focus text-sm',
        active && 'bg-neutral-800',
        disabled && 'cursor-not-allowed hover:bg-inherit active:outline-hidden active:outline-transparent',
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
    <div className={cn('flex items-start gap-3 p-3 lg:items-center lg:p-5', className)} {...rest}>
      {children}
    </div>
  )
}

function Popover({ inputPage = '', setInputPage, showPopover = false, setShowPopover, pageCount, onClick = () => {} }) {
  return (
    <div
      data-popover
      id='popover-default-1'
      role='tooltip'
      className={`absolute ${
        showPopover ? '' : 'invisible opacity-0'
        // eslint-disable-next-line max-len
      } top-12 left-1/2 z-10 inline-block -translate-x-1/2 rounded-lg border border-neutral-600 bg-neutral-800 text-sm text-neutral-500 shadow-xs transition-opacity duration-300 lg:left-1/2`}
    >
      <div className='flex items-center justify-between rounded-t-lg border-b border-neutral-600 bg-neutral-700 px-3 py-2'>
        <TextSubHeading className='text-nowrap text-white'>Go to page</TextSubHeading>
        <TextIconButton
          Icon={XIcon}
          classNames='p-[2px]'
          className='h-5! w-5! stroke-neutral-400'
          onClick={() => {
            setShowPopover(false)
            setInputPage('')
          }}
        />
      </div>
      <div className='flex flex-row items-center justify-between gap-2 px-3 py-2'>
        <Input
          className='w-[100px]'
          classNames={{
            input: 'p-2',
          }}
          autoFocus
          type='number'
          val={inputPage}
          onChange={e => {
            if (e.target.value === '') {
              setInputPage('')
            } else {
              setInputPage(Math.min(Math.max(Number(e.target.value), 1), pageCount))
            }
            e.stopPropagation()
          }}
        />
        <TertiaryButton className='h-[42px]' onClick={onClick}>
          Go
        </TertiaryButton>
      </div>
      <div data-popper-arrow />
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
  totalItems = undefined,
  limitPage = undefined,
  enabledRedirectOnClickSort = false,
  hightLightIndex = undefined,
  hightLightById = undefined,
  showPopoverPagination = false,
  bgHightLight = 'bg-neutral-500',
  defaultHead = undefined,
  showNumberOfPage = false,
  setNumberOfPage,
  classNames,
  summary = undefined,
  defaultNumberItem = undefined,
}) {
  const t = useTranslations()
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { page } = useParams()
  const query = useMemo(() => new URLSearchParams(searchParams.toString()), [searchParams])
  const [inputPage, setInputPage] = useState(undefined)
  const [showPopover, setShowPopover] = useState(false)

  const pageCount = useMemo(() => {
    const count = Math.ceil((totalItems || data.length) / pageSize)

    return limitPage && limitPage < count ? limitPage : count
  }, [data.length, limitPage, pageSize, totalItems])

  const handleRedirectPage = useCallback(
    newPage => {
      if (enabledRedirectOnClickPagination) {
        if (newPage !== currentPage) {
          let pathNew = ''
          if (!page) {
            pathNew = `${pathname}/${newPage}`
          } else {
            const pathnameReverse = pathname.split('').reverse()
            const i = pathnameReverse.findIndex(item => item === '/')
            if (i !== -1) {
              pathnameReverse.splice(0, i)
              pathNew = pathnameReverse.reverse().join('') + (newPage === 1 ? '' : newPage)
            }
          }
          query.delete('rank', undefined)
          router.replace(`${pathNew}?${query.toString()}`)
        }
      }
    },
    [currentPage, enabledRedirectOnClickPagination, page, pathname, query, router],
  )

  useEffect(() => {
    if (enabledRedirectOnClickPagination) {
      if (page) {
        setCurrentPage(Number(page))
      } else {
        setCurrentPage(1)
      }
    }
  }, [enabledRedirectOnClickPagination, page, setCurrentPage])

  useEffect(() => {
    if (sort && enabledRedirectOnClickSort) {
      query.set('sort', sort.value?.toString())
      query.set('isDesc', sort.isDesc?.toString())
      let pathNew = pathname
      if (page && page !== currentPage) {
        const pathnameReverse = pathname.split('').reverse()
        const i = pathnameReverse.findIndex(item => item === '/')
        if (i !== -1) {
          pathnameReverse.splice(0, i)
          pathNew = pathnameReverse.reverse().join('') + (currentPage === 1 ? '' : currentPage)
        }
      }
      router.replace(`${pathNew}?${query.toString()}`)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort, enabledRedirectOnClickSort])

  useEffect(() => {
    if (enabledRedirectOnClickSort) {
      const sortParams = searchParams.get('sort')
      const isDescParams = searchParams.get('isDesc')

      if (sort?.value !== sortParams && String(sort?.isDesc) !== isDescParams) {
        const sortOption = sortOptions.find(item => item.value === sortParams)
        if (sortOption) {
          setSort({
            ...sortOption,
            value: sortParams,
            isDesc: isDescParams === 'true',
          })
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  useEffect(() => {
    if (hightLightIndex && searchParams.get('rank')) {
      const element = document.getElementById(`table-row-${hightLightIndex}`)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }, [hightLightIndex, searchParams])
  return (
    <div className={cn('relative flex flex-col gap-3 rounded-xl bg-neutral-900 px-2 py-3 lg:p-4', className)}>
      <div className={cn('overflow-x-auto', classNames?.tableContainer ?? '')}>
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
                        handleRedirectPage(1)
                        query.delete('rank', undefined)
                        if (!onlySortDesc) {
                          setSort({
                            ...option,
                            isDesc: sort.value === option.value ? !sort.isDesc : true,
                          })
                          setCurrentPage(1)
                        } else {
                          setSort({
                            ...option,
                            isDesc: true,
                          })
                          setCurrentPage(1)
                        }
                      }
                    }}
                  >
                    <TableCell className={cn('flex text-nowrap', option.justify, classNames?.cellItem)}>
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
              {!loading && (
                <>
                  {defaultHead && (
                    <tr className={bgHightLight}>
                      {sortOptions.map((cell, cellIdx) => (
                        <td key={`${cell.value}-${cellIdx}`} className={cn(cell.minWidth)}>
                          <TableCell
                            className={cn(
                              'flex flex-col text-nowrap lg:flex-row',
                              cell.justify,
                              classNames?.cellItem,
                              cell?.className,
                            )}
                          >
                            {defaultHead[cell.value]}
                          </TableCell>
                        </td>
                      ))}
                    </tr>
                  )}
                  {(totalItems ? data : data.slice((currentPage - 1) * pageSize, currentPage * pageSize)).map(
                    (ele, eleIdx) => {
                      if (hightLightById) {
                        return (
                          <tr
                            key={`table-row-${eleIdx}`}
                            id={`table-row-${eleIdx}`}
                            className={ele.id === hightLightById ? bgHightLight : ''}
                          >
                            {sortOptions.map((cell, cellIdx) => (
                              <td key={`${cell.value}-${cellIdx}`} className={cn(cell.minWidth)}>
                                <TableCell
                                  className={cn(
                                    'flex flex-col text-nowrap lg:flex-row',
                                    cell.justify,
                                    classNames?.cellItem,
                                    cell?.className,
                                  )}
                                >
                                  {ele[cell.value]}
                                </TableCell>
                              </td>
                            ))}
                          </tr>
                        )
                      }
                      return (
                        <tr
                          key={`table-row-${eleIdx}`}
                          id={`table-row-${eleIdx}`}
                          className={
                            eleIdx === hightLightIndex
                              ? 'table__animate-gradient bg-linear-to-r from-[#B386FF] to-[#FF86FA]'
                              : ''
                          }
                        >
                          {sortOptions.map((cell, cellIdx) => (
                            <td key={`${cell.value}-${cellIdx}`} className={cn(cell.minWidth)}>
                              <TableCell
                                className={cn(
                                  'flex flex-col text-nowrap lg:flex-row',
                                  cell.justify,
                                  classNames?.cellItem,
                                  cell?.className,
                                )}
                              >
                                {ele[cell.value]}
                              </TableCell>
                            </td>
                          ))}
                        </tr>
                      )
                    },
                  )}
                  {summary && (
                    <tr key='table-row-summary' id='table-row-summary'>
                      {sortOptions.map((cell, cellIdx) => (
                        <td key={`${cell.value}-${cellIdx}`} className={cn(cell.minWidth)}>
                          <TableCell
                            className={cn(
                              'flex flex-col text-nowrap lg:flex-row',
                              cell.justify,
                              classNames?.cellItem,
                              cell?.className,
                            )}
                          >
                            {summary[cell.value]}
                          </TableCell>
                        </td>
                      ))}
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        ) : (
          <>
            <div
              className={cn(
                'hidden w-full min-w-max items-center border-b border-neutral-700 lg:flex',
                classNames?.header,
              )}
            >
              {sortOptions.map((option, idx) => (
                <TableCell
                  className={cn(
                    'gap-1',
                    !option.disabled && 'cursor-pointer',
                    option.width,
                    option.justify,
                    classNames?.cellItem,
                  )}
                  key={`header-${idx}`}
                  onClick={() => {
                    if (!option.disabled) {
                      handleRedirectPage(1)
                      query.delete('rank', undefined)
                      setSort({
                        ...option,
                        isDesc: sort.value === option.value ? !sort.isDesc : true,
                      })
                      setCurrentPage(1)
                    }
                  }}
                >
                  <TextHeading className='text-sm'>
                    {option.label && typeof option.label === 'string' && option.notTranslate !== true
                      ? t(option.label)
                      : option.label}
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
              (totalItems ? data : data.slice((currentPage - 1) * pageSize, currentPage * pageSize)).map(
                (ele, eleIdx) => (
                  <div
                    className={cn(
                      'flex w-full flex-wrap items-start rounded-lg border-b border-neutral-700 hover:bg-neutral-800 lg:flex-nowrap lg:items-center lg:border-0',
                      ele.onRowClick && 'cursor-pointer',
                      ele.className ?? '',
                    )}
                    onClick={() => ele.onRowClick && ele.onRowClick()}
                    key={`table-row-${eleIdx}`}
                  >
                    <TableCell
                      className={cn(
                        'flex w-full',
                        sortOptions[0].width,
                        sortOptions[0].hiddenMobile ? 'max-lg:hidden' : 'flex',
                        classNames?.cellItem,
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
                          classNames?.cellItem,
                          cell?.className,
                        )}
                        key={`${cell.value}-${cellIdx}`}
                      >
                        <TextHeading className={cn('lg:hidden', classNames?.cellItemLabel)}>
                          {cell.notTranslate !== true ? t(cell.label) : cell.label}
                        </TextHeading>
                        {ele[cell.value]}
                      </TableCell>
                    ))}
                    {!notAction && (
                      <TableCell
                        className={
                          (cn('flex w-full flex-col', sortOptions[sortOptions.length - 1].width), classNames?.cellItem)
                        }
                      >
                        {ele[sortOptions[sortOptions.length - 1].value]}
                      </TableCell>
                    )}
                  </div>
                ),
              )}
          </>
        )}
      </div>
      {((!loading && pageCount > 1 && !hidePagination) || showNumberOfPage) && (
        <div className='flex flex-col justify-between gap-1 border-t border-neutral-700 px-3 pt-4 md:flex-row lg:px-5'>
          {showNumberOfPage && (
            <Dropdown
              className='h-11 w-full max-w-[128px] text-sm text-neutral-400'
              classNames={{ trailingIcon: 'right-4', input: 'pr-12 text-right' }}
              listClassNames='z-40'
              data={[
                ...(defaultNumberItem ? [{ label: defaultNumberItem }] : []),
                { label: 10 },
                { label: 20 },
                { label: 50 },
                { label: 100 },
              ]}
              selected={pageSize}
              setSelected={ele => setNumberOfPage(ele.label)}
              prefix={<PoolCoinsIcon className='h-5 w-5 stroke-neutral-400' />}
              prefixClass='pl-12'
              isLocale={false}
            />
          )}
          {!loading && pageCount > 1 && !hidePagination && (
            <div className='flex justify-center sm:justify-end'>
              <ul className='relative flex w-fit items-center justify-center gap-2 px-5 py-3 lg:justify-end'>
                <PaginateCell
                  onClick={() => {
                    if (currentPage !== 1) {
                      handleRedirectPage(Math.max(currentPage - 1, 1))
                      setCurrentPage(Math.max(currentPage - 1, 1))
                    }
                  }}
                  disabled={currentPage === 1}
                >
                  <ArrowLeftIcon className={`h-4 w-4${currentPage === 1 ? 'stroke-gray-700' : ''}`} />
                </PaginateCell>
                {pageCount < 6 &&
                  new Array(pageCount).fill(0).map((item, idx) => (
                    <PaginateCell
                      key={`paginate-${idx}`}
                      active={currentPage === idx + 1}
                      onClick={() => {
                        handleRedirectPage(idx + 1)
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
                        handleRedirectPage(1)
                        setCurrentPage(1)
                      }}
                    >
                      1
                    </PaginateCell>
                    <PaginateCell
                      active={currentPage === 2}
                      onClick={() => {
                        handleRedirectPage(2)
                        setCurrentPage(2)
                      }}
                    >
                      2
                    </PaginateCell>
                    {currentPage > 3 && (
                      <PaginateCell
                        onClick={() => {
                          if (showPopoverPagination) {
                            setShowPopover(true)
                          } else {
                            handleRedirectPage(currentPage > 3 ? currentPage - 1 : currentPage + 1)
                            setCurrentPage(currentPage > 3 ? currentPage - 1 : currentPage + 1)
                          }
                        }}
                      >
                        ...
                      </PaginateCell>
                    )}
                    {currentPage > 2 && currentPage < pageCount - 1 && (
                      <PaginateCell
                        active
                        onClick={() => {
                          handleRedirectPage(currentPage)
                          setCurrentPage(currentPage)
                        }}
                      >
                        {currentPage}
                      </PaginateCell>
                    )}
                    {currentPage < pageCount - 2 && (
                      <PaginateCell
                        onClick={() => {
                          if (showPopoverPagination) {
                            setShowPopover(true)
                          } else {
                            handleRedirectPage(currentPage > pageCount - 2 ? currentPage - 1 : currentPage + 1)
                            setCurrentPage(currentPage > pageCount - 2 ? currentPage - 1 : currentPage + 1)
                          }
                        }}
                      >
                        ...
                      </PaginateCell>
                    )}
                    <PaginateCell
                      active={currentPage === pageCount - 1}
                      onClick={() => {
                        handleRedirectPage(pageCount - 1)
                        setCurrentPage(pageCount - 1)
                      }}
                    >
                      {pageCount - 1}
                    </PaginateCell>
                    <PaginateCell
                      active={currentPage === pageCount}
                      onClick={() => {
                        handleRedirectPage(pageCount)
                        setCurrentPage(pageCount)
                      }}
                    >
                      {pageCount}
                    </PaginateCell>
                  </>
                )}
                <PaginateCell
                  onClick={() => {
                    if (currentPage !== pageCount) {
                      handleRedirectPage(Math.min(currentPage + 1, pageCount))
                      setCurrentPage(Math.min(currentPage + 1, pageCount))
                    }
                  }}
                  disabled={currentPage === pageCount}
                >
                  <ArrowLeftIcon
                    className={`h-4 w-4 rotate-180${currentPage === pageCount ? 'stroke-gray-700' : ''}`}
                  />
                </PaginateCell>
                {showPopoverPagination && (
                  <Popover
                    inputPage={inputPage}
                    setInputPage={setInputPage}
                    setCurrentPage={setCurrentPage}
                    showPopover={showPopover}
                    setShowPopover={setShowPopover}
                    pageCount={pageCount}
                    onClick={() => {
                      const newPage = Number(inputPage)
                      if (newPage && newPage !== currentPage) {
                        if (enabledRedirectOnClickPagination) {
                          handleRedirectPage(Number(newPage))
                        } else {
                          setCurrentPage(newPage)
                        }
                      }
                      setShowPopover(false)
                      setInputPage('')
                    }}
                  />
                )}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Table
