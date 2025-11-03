'use client'

import { useTranslations } from 'next-intl'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import ChevronDownIcon from '@/icons/ChevronDownIcon'
import { cn } from '@/lib/utils'

import Input from '../input'

function Dropdown({
  className,
  classNames,
  listClassNames,
  data,
  selected,
  setSelected,
  placeHolder,
  isLocale = true,
  prefix,
  prefixClass,
}) {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 })
  const wrapperRef = useRef(null)
  const dropdownRef = useRef(null)
  const t = useTranslations()

  const handleOpen = useCallback(
    e => {
      e.preventDefault()
      setOpen(!open)
    },
    [open],
  )

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  useEffect(() => {
    function updatePosition() {
      if (!wrapperRef.current) return
      const rect = wrapperRef.current.getBoundingClientRect()
      setPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      })
    }

    if (open) {
      updatePosition()
      window.addEventListener('resize', updatePosition)
      window.addEventListener('scroll', updatePosition, true)
    }

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [open])

  return (
    <div className={cn('relative', className)} ref={wrapperRef}>
      <Input
        classNames={{
          // ...classNames,
          input: cn('cursor-pointer caret-transparent', className, classNames?.input),
        }}
        type='text'
        val={selected && isLocale ? t(selected) : selected}
        onMouseDown={handleOpen}
        placeholder={placeHolder}
        TrailingIcon={<ChevronDownIcon isRevert={open} onMouseDown={handleOpen} />}
        isLocale={isLocale}
        prefix={
          <div className='cursor-pointer' onMouseDown={handleOpen}>
            {prefix}
          </div>
        }
        prefixClass={prefixClass}
        readOnly
      />
      {open &&
        createPortal(
          <div
            ref={dropdownRef}
            className={cn(
              'absolute mt-2 flex-col items-start justify-start gap-1',
              'rounded-xl border border-neutral-600 bg-neutral-800 p-2 shadow-lg',
              'visible opacity-100',
              listClassNames,
            )}
            style={{
              position: 'absolute',
              top: position.top,
              left: position.left,
              width:
                /w-\d+/.test(listClassNames) || listClassNames?.includes('w-full') || listClassNames?.includes('w-[')
                  ? undefined
                  : `${position.width}px`,
            }}
          >
            {data.map((item, idx) => (
              <div
                className={cn(
                  'inline-flex w-full cursor-pointer flex-col items-start justify-center gap-1',
                  'rounded-md p-3 text-neutral-300 hover:bg-neutral-700 hover:text-neutral-50',
                )}
                key={`dropdown-${idx}`}
                onMouseDown={e => {
                  e.preventDefault()
                  setSelected(item)
                  setOpen(false)
                }}
              >
                <p>{isLocale && item.label ? t(item.label) : item.label}</p>
              </div>
            ))}
          </div>,
          document.body,
        )}
    </div>
  )
}

export default Dropdown
