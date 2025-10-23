'use client'

import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import IconGroup from '@/components/icongroup'
import GroupIconTokens from '@/components/icongroup/GroupIconTokens'
import { ThreeIconGroup } from '@/components/icongroup/ThreeIconGroup'
import SearchInput from '@/components/input/SearchInput'
import { Paragraph, TextHeading } from '@/components/typography'
import { PAIR_TYPES, UNKNOWN_LOGO } from '@/constant'
import { cn, formatAmount } from '@/lib/utils'
import { PATH_NAME } from '@/modules/Studio/lib/utils'
import { ListTokenPercantage } from '@/modules/WeightedPool/TokenPercentage'
import { ChevronDownIcon } from '@/svgs'

export default function PairPickerField({ label, value, onChange, options = [] }) {
  const [open, setOpen] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [position, setPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
    direction: 'down',
    maxHeight: 340,
  })
  const t = useTranslations()
  const wrapperRef = useRef(null)
  const dropdownRef = useRef(null)

  const pathname = usePathname()
  const field = pathname !== PATH_NAME.INCENTIVES ? 'apr' : 'incentives'

  // Filter pools based on search text
  const filteredPools = useMemo(() => {
    if (!searchText) return options
    const searchTerms = searchText
      .toLowerCase()
      .split(/[\s/,]+/)
      .map(term => term.trim())

    return options.filter(pool => {
      const poolSymbols = pool.symbol.toLowerCase().split('/')

      if (searchTerms.length === 2) {
        return (
          (poolSymbols[0].includes(searchTerms[0]) && poolSymbols[1].includes(searchTerms[1])) ||
          (poolSymbols[0].includes(searchTerms[1]) && poolSymbols[1].includes(searchTerms[0]))
        )
      }

      return (
        pool.symbol.toLowerCase().includes(searchText.toLowerCase()) ||
        pool.address.toLowerCase().includes(searchText.toLowerCase())
      )
    })
  }, [options, searchText])

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setOpen(false)
        setSearchText('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Calculate position when dropdown opens
  useEffect(() => {
    function updatePosition() {
      if (!wrapperRef.current) return
      const rect = wrapperRef.current.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const viewportWidth = window.innerWidth

      // Calculate available space above and below
      const spaceBelow = viewportHeight - rect.bottom
      const spaceAbove = rect.top

      const searchHeight = 74
      const dividerHeight = 1
      const itemHeight = 68
      const actualContentHeight = searchHeight + dividerHeight + filteredPools.length * itemHeight

      // Use a minimum height but cap at reasonable maximum
      const estimatedDropdownHeight = Math.max(200, Math.min(400, actualContentHeight))

      // Determine direction based on available space
      let direction = 'down'
      let { top } = rect
      const { height } = rect
      let maxHeight = 340

      if (spaceBelow < estimatedDropdownHeight && spaceAbove > spaceBelow) {
        direction = 'up'
        top = rect.bottom + height + 16 + window.scrollY - estimatedDropdownHeight
      }

      const availableHeight = direction === 'down' ? spaceBelow - 20 : spaceAbove - 20
      maxHeight = Math.min(340, Math.max(200, availableHeight))

      let left = rect.left + window.scrollX
      const dropdownWidth = rect.width
      if (left + dropdownWidth > viewportWidth) {
        left = viewportWidth - dropdownWidth - 10
      }
      if (left < 10) {
        left = 10
      }

      setPosition({
        top,
        left,
        width: rect.width,
        direction,
        maxHeight,
      })
    }

    updatePosition()
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [filteredPools])

  const handleSelect = useCallback(
    pool => {
      onChange(pool)
      setOpen(false)
      setSearchText('')
    },
    [onChange],
  )

  const renderList = useCallback(() => {
    // For upward direction, we need to account for search input at bottom
    const listMaxHeight =
      position.direction === 'up'
        ? position.maxHeight - 80 // Reserve space for search input at bottom
        : position.maxHeight

    return (
      <div className='overflow-auto' style={{ maxHeight: `${listMaxHeight}px` }}>
        {filteredPools.map(pool => (
          <div
            className='flex cursor-pointer items-center justify-between rounded-lg px-6 py-3 hover:bg-neutral-700'
            onClick={() => handleSelect(pool)}
            key={pool.address}
          >
            <div className='flex items-center gap-3'>
              {pool.type === PAIR_TYPES.WEIGHTED ? (
                <ListTokenPercantage listToken={pool.tokens} poolAddress={pool?.address} />
              ) : (
                <>
                  <GroupIconTokens
                    classNames={{
                      image: 'outline-2 w-7 h-7',
                      rows: '*:not-first:-ml-2',
                      toolTip: 'hidden',
                    }}
                    width={32}
                    height={32}
                    tokens={[pool.token0, pool.token1]}
                    showToolTip={false}
                  />
                  <div className='flex flex-col'>
                    <TextHeading>{pool.symbol}</TextHeading>
                    <Paragraph className='text-sm'>
                      {pool.title === 'CL_Farming' ? 'Conc. Liquidity' : pool.title ?? pool.type}
                    </Paragraph>
                  </div>
                </>
              )}
            </div>
            {field === 'apr' && (
              <Paragraph className='text-sm! leading-5 font-normal text-neutral-500'>{pool.apr}</Paragraph>
            )}
            {field === 'incentives' && (
              <Paragraph className='text-sm! leading-5 font-normal text-neutral-500'>
                ${formatAmount(pool.gauge.bribeUsd)}
              </Paragraph>
            )}
          </div>
        ))}
      </div>
    )
  }, [field, filteredPools, handleSelect, position.maxHeight, position.direction])

  return (
    <div ref={wrapperRef}>
      <TextHeading className='leading-5! font-medium'>{label}</TextHeading>
      <div
        className='mt-2 flex h-11 cursor-pointer items-center justify-between rounded-lg bg-neutral-700 px-4 py-3'
        onClick={() => setOpen(!open)}
      >
        {value ? (
          <div className='flex items-center gap-3'>
            {value.type === PAIR_TYPES.WEIGHTED ? (
              <ThreeIconGroup
                className='*:not-first:-ml-1'
                classNames={{
                  image: 'w-4 h-4 text-xl font-medium leading-5 text-[#1C2027] z-0',
                }}
                logo1={value?.tokens?.[0].logoURI ?? UNKNOWN_LOGO}
                logo2={value?.tokens?.[1].logoURI ?? UNKNOWN_LOGO}
                extendNumber={(value?.tokens?.length || 2) - 2}
              />
            ) : (
              <IconGroup
                className='*:not-first:-ml-1'
                classNames={{
                  image: 'outline-2 w-4 h-4 z-0',
                }}
                logo1={value?.token0?.logoURI ?? UNKNOWN_LOGO}
                logo2={value?.token1?.logoURI ?? UNKNOWN_LOGO}
              />
            )}
            <div className='flex items-center gap-2'>
              <div className='flex min-w-0 items-center gap-2' title={value.symbol}>
                <TextHeading className='block max-w-[120px] truncate text-base! leading-5! uppercase'>
                  {value.symbol}
                </TextHeading>
              </div>
              <Paragraph className='text-sm! leading-5!'>{t(value.type)}</Paragraph>
            </div>
          </div>
        ) : (
          <p className='text-neutral-400'>{t('Select Pair')}</p>
        )}
        <ChevronDownIcon
          className={cn('transfrom h-5 w-5 transition-all duration-150 ease-out', open ? 'rotate-180' : 'rotate-0')}
        />
      </div>

      {open &&
        createPortal(
          <div
            ref={dropdownRef}
            className={cn('absolute z-50 rounded-xl border border-neutral-600 bg-neutral-800 shadow-lg')}
            style={{
              position: 'absolute',
              top: position.top,
              left: position.left,
              width: `${position.width}px`,
            }}
          >
            {position.direction === 'down' ? (
              <>
                <div className='p-3'>
                  <SearchInput
                    className='w-full'
                    val={searchText}
                    setVal={setSearchText}
                    placeholder='Search by name, symbol or address'
                    autoFocus
                  />
                </div>
                <div className='h-px w-full border border-neutral-700' />
                {renderList()}
              </>
            ) : (
              <>
                {renderList()}
                <div className='h-px w-full border border-neutral-700' />
                <div className='p-3'>
                  <SearchInput
                    className='w-full'
                    val={searchText}
                    setVal={setSearchText}
                    placeholder='Search by name, symbol or address'
                    autoFocus
                  />
                </div>
              </>
            )}
          </div>,
          document.body,
        )}
    </div>
  )
}
