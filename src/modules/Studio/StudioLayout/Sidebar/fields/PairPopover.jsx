'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import GroupIconTokens from '@/components/icongroup/GroupIconTokens'
import SearchInput from '@/components/input/SearchInput'
import { Paragraph, TextHeading } from '@/components/typography'
import { PAIR_TYPES } from '@/constant'
import { cn, formatAmount } from '@/lib/utils'
import { ListTokenPercantage } from '@/modules/WeightedPool/TokenPercentage'

export default function PairPopover({ popup, setPopup, pools, setSelected, field = 'apr', wrapperRef }) {
  const [searchText, setSearchText] = useState('')
  const [position, setPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
    direction: 'down',
    maxHeight: 340,
  })
  const dropdownRef = useRef(null)

  // Filter pools based on search text
  const filteredPools = useMemo(() => {
    if (!searchText) return pools
    const searchTerms = searchText
      .toLowerCase()
      .split(/[\s/,]+/)
      .map(term => term.trim())

    return pools.filter(pool => {
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
  }, [pools, searchText])

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setPopup(false)
        setSearchText('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [setPopup, wrapperRef])

  // Calculate and update position
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

      if (spaceBelow < estimatedDropdownHeight && spaceAbove > spaceBelow) {
        direction = 'up'
        top = rect.bottom + height + 16 + window.scrollY - estimatedDropdownHeight
      }

      const availableHeight = direction === 'down' ? spaceBelow - 20 : spaceAbove - 20
      const maxHeight = Math.min(340, Math.max(200, availableHeight))
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

    if (popup) {
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        updatePosition()
        window.addEventListener('resize', updatePosition)
        window.addEventListener('scroll', updatePosition, true)
        document.addEventListener('scroll', updatePosition, true)
      })
    }

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
      document.removeEventListener('scroll', updatePosition, true)
    }
  }, [popup, filteredPools, wrapperRef])

  // Prevent body scroll when popover is open
  useEffect(() => {
    if (popup) {
      // Store the current scroll position
      const { scrollY } = window

      // Prevent scrolling
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = '100%'

      return () => {
        // Restore scrolling
        document.body.style.position = ''
        document.body.style.top = ''
        document.body.style.width = ''
        window.scrollTo(0, scrollY)
      }
    }
  }, [popup])

  const handleSelect = useCallback(
    pool => {
      setSelected(pool)
      setPopup(false)
      setSearchText('')
    },
    [setSelected, setPopup],
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

  // Add a small delay to prevent flash at (0,0)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (popup) {
      const timer = setTimeout(() => setIsReady(true), 10)
      return () => clearTimeout(timer)
    }
    setIsReady(false)
  }, [popup])

  if (!popup || !isReady) return null

  return createPortal(
    <div
      ref={dropdownRef}
      className={cn('fixed z-50 rounded-xl border border-neutral-600 bg-neutral-800 shadow-lg')}
      style={{
        position: 'fixed',
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
  )
}
