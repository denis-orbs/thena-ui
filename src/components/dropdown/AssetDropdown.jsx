'use client'

import React, { useEffect, useRef, useState } from 'react'

import { cn } from '@/lib/utils'

import TokenBadge from '../badges/TokenBadge'

function AssetDropdown({ className, data, selected, setSelected }) {
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [wrapperRef])

  return (
    <div className={cn('relative', className)} ref={wrapperRef}>
      <TokenBadge asset={selected} onClick={() => setOpen(!open)} />
      <div
        className={cn(
          'visible absolute z-10 mt-2 flex-col items-start justify-start gap-1',
          'rounded-xl border border-neutral-600 bg-neutral-800 p-2 opacity-100 shadow',
          'transition-all duration-150 ease-out',
          !open && 'invisible opacity-0',
          className,
        )}
      >
        {data.map((item, idx) => (
          <div
            className={cn(
              'inline-flex w-full cursor-pointer flex-col items-start justify-center gap-1 rounded-md p-1.5',
              'text-sm text-neutral-300 transition-all duration-150 ease-out hover:bg-neutral-700 hover:text-neutral-50',
            )}
            key={`dropdown-${idx}`}
            onClick={() => {
              setSelected(item.address)
              setOpen(false)
            }}
          >
            {item.symbol}
          </div>
        ))}
      </div>
    </div>
  )
}

export default AssetDropdown
