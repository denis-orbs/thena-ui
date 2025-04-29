'use client'

import { useTranslations } from 'next-intl'
import React, { useEffect, useRef, useState } from 'react'

import { cn } from '@/lib/utils'
import { CheckCircleIcon, ChevronDownIcon } from '@/svgs'

import Input from '../input'

function VeTheDropdown({
  className,
  data,
  selected,
  setSelected,
  placeHolder,
  isApproved,
  approvedId,
  setApprovedId,
  disabled = false,
  isLocale = true,
  classNames,
}) {
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef(null)
  const t = useTranslations()

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
      <Input
        classNames={{
          input: cn('cursor-pointer caret-transparent', classNames?.dropdown),
          ...classNames,
        }}
        type='text'
        val={selected}
        onClick={() => {
          setOpen(!open)
        }}
        placeholder={placeHolder}
        TrailingIcon={
          <ChevronDownIcon
            className={cn('transfrom transition-all duration-150 ease-out', open ? 'rotate-180' : 'rotate-0')}
          />
        }
        isLocale={isLocale}
        readOnly
        disabled={disabled}
      />
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
              'inline-flex w-full cursor-pointer flex-col items-start justify-center gap-1',
              'rounded-md p-3 text-neutral-300 transition-all duration-150 ease-out hover:bg-neutral-700 hover:text-neutral-50',
            )}
            key={`dropdown-${idx}`}
            onClick={() => {
              setSelected(item)
              setOpen(false)
            }}
          >
            <p>{isLocale && item.label ? t(item.label) : item.label}</p>
          </div>
        ))}
        <Input
          val={approvedId}
          type='number'
          onChange={e => {
            setApprovedId(e.target.value)
          }}
          placeholder='Search'
          TrailingIcon={isApproved ? <CheckCircleIcon /> : null}
        />
      </div>
    </div>
  )
}

export default VeTheDropdown
